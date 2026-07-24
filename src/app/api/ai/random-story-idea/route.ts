import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ApiErrors } from '@/lib/api/response'
import { prisma } from '@/lib/db/prisma'
import { runAgentObject } from '@/lib/ai/agents'
import { StoryIdeaCardOutputSchema } from '@/lib/ai/agents/schemas'

/** 创意生成统一走 story-idea Agent（提示词可在设置页编辑） */
const STORY_IDEA_AGENT_ID = 'story-idea'

/**
 * 生成侧宽松卡：字段尽量 string 化，缺省后端补
 * （聊天同通道下模型字段常不齐，硬 schema 会全军覆没）
 */
const GeneratedIdeaCardSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    title: z.string().optional(),
    genre: z.string().optional(),
    worldBuilding: z.string().optional(),
    protagonist: z.string().optional(),
    coreConflict: z.string().optional(),
    mainGoal: z.string().optional(),
    highConcept: z.string().optional(),
    sublimation: z.string().optional(),
    openingHook: z.string().optional(),
  })
  .passthrough()

function normalizeIdeaCards(raw: unknown): Array<z.infer<typeof GeneratedIdeaCardSchema>> {
  if (Array.isArray(raw)) return raw as any
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    for (const key of ['ideas', 'cards', 'data', 'stories', 'results']) {
      if (Array.isArray(o[key])) return o[key] as any
    }
  }
  return []
}

/** 宽松接收任意 JSON，再在业务侧 normalize */
const StoryIdeaBatchSchema = z.any().transform((raw) => {
  const list = normalizeIdeaCards(raw)
  return list
    .map((card, i) => GeneratedIdeaCardSchema.parse(card))
    .filter((c) => c.title || c.highConcept || c.genre)
    .slice(0, 5)
})

function buildExamplesPrompt(positiveIdeas: Array<{
  title: string; highConcept: string; protagonist: string; coreConflict: string
}>, negativeIdeas: Array<{
  title: string; highConcept: string
}>): string {
  const parts: string[] = []

  if (positiveIdeas.length > 0) {
    const positiveLines = positiveIdeas.map((idea, i) =>
      `${i + 1}.「${idea.title}」—— 高概念：${idea.highConcept}；主角：${idea.protagonist}；核心冲突：${idea.coreConflict}`
    ).join('\n')
    parts.push(`【你欣赏的创意示例】以下是你之前给了高分的创意，请参考它们的亮点（世界观深度、冲突设计、人物塑造等），生成风格和深度类似的新创意：
${positiveLines}`)
  }

  if (negativeIdeas.length > 0) {
    const negativeLines = negativeIdeas.map((idea, i) =>
      `${i + 1}.「${idea.title}」—— ${idea.highConcept}`
    ).join('\n')
    parts.push(`【你觉得一般的创意示例】以下是你给了低分的创意，请避免类似的选题方向或设定模式：
${negativeLines}`)
  }

  if (parts.length > 0) {
    parts.push('请参考高分创意的优点，规避低分创意的问题，生成 3 个新的小说创意。')
  }

  return parts.length > 0 ? '\n\n' + parts.join('\n\n') : ''
}

/**
 * 拉取正反例创意（用于注入 prompt）
 */
async function fetchExamples(
  positiveIds?: string[],
  negativeIds?: string[]
): Promise<{
  positiveIdeas: Array<{ title: string; highConcept: string; protagonist: string; coreConflict: string }>
  negativeIdeas: Array<{ title: string; highConcept: string }>
}> {
  const positiveIdeas: any[] = []
  const negativeIdeas: any[] = []

  if (positiveIds && positiveIds.length > 0) {
    const found = await prisma.idea.findMany({
      where: { id: { in: positiveIds } },
      select: { title: true, highConcept: true, protagonist: true, coreConflict: true },
      take: 3,
    })
    positiveIdeas.push(...found)
  }

  if (negativeIds && negativeIds.length > 0) {
    const found = await prisma.idea.findMany({
      where: { id: { in: negativeIds } },
      select: { title: true, highConcept: true },
      take: 3,
    })
    negativeIdeas.push(...found)
  }

  // 如果前端没有传示例，自动从已评分创意中拉取
  if (positiveIdeas.length === 0 && negativeIdeas.length === 0) {
    const [highRated, lowRated] = await Promise.all([
      prisma.idea.findMany({
        where: { rating: { gte: 4 } },
        select: { title: true, highConcept: true, protagonist: true, coreConflict: true },
        orderBy: { rating: 'desc' },
        take: 3,
      }),
      prisma.idea.findMany({
        where: { rating: { lte: 2 } },
        select: { title: true, highConcept: true },
        orderBy: { rating: 'asc' },
        take: 3,
      }),
    ])
    if (highRated.length > 0 || lowRated.length > 0) {
      positiveIdeas.push(...highRated)
      negativeIdeas.push(...lowRated)
    }
  }

  return { positiveIdeas, negativeIdeas }
}

/**
 * 将生成的创意自动写入 Idea 表
 */
async function saveIdeasToDB(
  cards: Array<{
    id: string; title: string; genre: string; worldBuilding: string
    protagonist: string; coreConflict: string; mainGoal: string
    highConcept: string; sublimation: string; openingHook: string
  }>,
  sourceData: {
    audience?: string; genre?: string; tone?: string
    customRequirements?: string
    positiveExampleIds?: string[]; negativeExampleIds?: string[]
  }
): Promise<string[]> {
  const savedIds: string[] = []
  const source = JSON.stringify(sourceData)

  for (const card of cards) {
    const idea = await prisma.idea.create({
      data: {
        title: card.title,
        genre: card.genre,
        worldBuilding: card.worldBuilding,
        protagonist: card.protagonist,
        coreConflict: card.coreConflict,
        mainGoal: card.mainGoal,
        highConcept: card.highConcept,
        sublimation: card.sublimation,
        openingHook: card.openingHook,
        source,
        status: 'draft',
        aiGenerated: true,
      },
    })
    savedIds.push(idea.id)
  }

  return savedIds
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const {
      audience, genre, tone, pov, customRequirements,
      positiveExampleIds, negativeExampleIds,
      saveToIdeas = true, // 默认自动保存
    } = body || {}

    // 构建用户偏好约束
    const constraints: string[] = []
    if (audience) constraints.push(`目标受众：${audience}`)
    if (genre) constraints.push(`题材类型：${genre}`)
    if (tone) constraints.push(`故事基调：${tone}`)
    if (pov) constraints.push(`叙事人称：${pov === 'first_person' ? '第一人称' : pov === 'third_person' ? '第三人称' : '多视角切换'}`)
    if (customRequirements) constraints.push(`用户自定义要求：${customRequirements}`)

    const filters = constraints.length > 0
      ? `【用户偏好，必须严格遵循】\n${constraints.join('\n')}\n请确保生成的故事构想完全符合以上偏好。`
      : ''

    // 拉取正反例
    const { positiveIdeas, negativeIdeas } = await fetchExamples(positiveExampleIds, negativeExampleIds)
    const examples = buildExamplesPrompt(positiveIdeas, negativeIdeas)

    // 与引导页/创意中心共用 story-idea Agent + 结构化输出
    let cards: Array<{
      id: string; title: string; genre: string; worldBuilding: string
      protagonist: string; coreConflict: string; mainGoal: string
      highConcept: string; sublimation: string; openingHook: string
    }>

    try {
      const agentResult = await runAgentObject({
        agentId: STORY_IDEA_AGENT_ID,
        variables: {
          filters,
          examples,
        },
        temperature: 0.9,
        maxTokens: 4000,
        schema: StoryIdeaBatchSchema,
        schemaName: 'StoryIdeaList',
        schemaDescription:
          'JSON 数组，长度 3；每项含 title, genre, worldBuilding, protagonist, coreConflict, mainGoal, highConcept, sublimation, openingHook（id 可省略）',
      })
      const list = agentResult.object as Array<Record<string, unknown>>
      if (!Array.isArray(list) || list.length === 0) {
        console.error('story-idea empty list, raw text:', agentResult.text?.slice(0, 1500))
        throw new Error('模型未返回创意列表')
      }
      cards = list.slice(0, 3).map((card, index) => ({
        id: String(card.id ?? index + 1),
        title: String(card.title || `${card.genre || '新'}小说`),
        genre: String(card.genre || '未分类'),
        worldBuilding: String(card.worldBuilding || ''),
        protagonist: String(card.protagonist || ''),
        coreConflict: String(card.coreConflict || ''),
        mainGoal: String(card.mainGoal || ''),
        highConcept: String(card.highConcept || ''),
        sublimation: String(card.sublimation || ''),
        openingHook: String(card.openingHook || ''),
      }))
    } catch (error) {
      console.error('story-idea structured generation failed:', error)
      return ApiErrors.serverError(
        error instanceof Error
          ? `生成失败：${error.message.slice(0, 200)}`
          : '生成失败，AI 返回格式异常，请重试'
      )
    }

    if (cards.length === 0) {
      return ApiErrors.serverError('生成失败，未获得有效创意，请重试')
    }

    // 自动保存到 Idea 表
    let savedIds: string[] = []
    if (saveToIdeas) {
      try {
        const sourceData = {
          audience, genre, tone, customRequirements,
          positiveExampleIds: positiveIdeas.length > 0 ? positiveExampleIds : undefined,
          negativeExampleIds: negativeIdeas.length > 0 ? negativeExampleIds : undefined,
        }
        savedIds = await saveIdeasToDB(cards, sourceData)
      } catch (saveError) {
        console.error('Failed to save ideas to DB:', saveError)
        // 保存失败不影响创意返回，前端仍可使用生成的卡片
      }
    }

    // 将数据库 ID 附加到每个卡片
    const cardsWithDbId = cards.map((card, index) => ({
      ...card,
      ideaId: savedIds[index] || null,
    }))

    return Response.json({
      success: true,
      data: {
        cards: cardsWithDbId,
        hasExamples: positiveIdeas.length > 0 || negativeIdeas.length > 0,
        positiveExampleCount: positiveIdeas.length,
        negativeExampleCount: negativeIdeas.length,
      },
    })
  } catch (error) {
    console.error('Random story idea generation error:', error)
    return ApiErrors.serverError('生成随机创意失败，请重试')
  }
}
