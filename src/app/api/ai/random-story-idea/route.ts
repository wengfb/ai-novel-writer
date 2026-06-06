import { NextRequest } from 'next/server'
import { generateText } from 'ai'
import { getLanguageModelAsync } from '@/lib/ai/providers'
import { ApiErrors } from '@/lib/api/response'
import { prisma } from '@/lib/db/prisma'

const SYSTEM_PROMPT = `你是一名网络小说编辑。

请随机生成 3 个不同方向的"适合商业网文"的小说创意。3 个方向应该在题材切入点、主角设定或世界观上有明显差异。

要求：
- 设定合理，容易被大多数普通人理解，不要多种题材混搭
- 具备长期连载空间
- 要有内容升华
- 每项1~2句话即可

请以纯 JSON 数组格式输出，不要用 markdown 代码块包裹：

[
  {
    "id": "1",
    "title": "小说名称",
    "genre": "题材",
    "worldBuilding": "世界观",
    "protagonist": "主角",
    "coreConflict": "核心冲突",
    "mainGoal": "主线目标",
    "highConcept": "高概念梗概",
    "sublimation": "内容升华",
    "openingHook": "开篇切入点"
  },
  ...
]`

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
        where: { avgRating: { gte: 4 }, ratingCount: { gte: 1 } },
        select: { title: true, highConcept: true, protagonist: true, coreConflict: true },
        orderBy: { avgRating: 'desc' },
        take: 3,
      }),
      prisma.idea.findMany({
        where: { avgRating: { lte: 2 }, ratingCount: { gte: 1 } },
        select: { title: true, highConcept: true },
        orderBy: { avgRating: 'asc' },
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

    const constraintPrompt = constraints.length > 0
      ? `\n\n【用户偏好，必须严格遵循】\n${constraints.join('\n')}\n请确保生成的故事构想完全符合以上偏好。`
      : ''

    // 拉取正反例
    const { positiveIdeas, negativeIdeas } = await fetchExamples(positiveExampleIds, negativeExampleIds)
    const examplesPrompt = buildExamplesPrompt(positiveIdeas, negativeIdeas)

    const { model } = await getLanguageModelAsync()

    const result = await generateText({
      model,
      system: SYSTEM_PROMPT + constraintPrompt + examplesPrompt,
      prompt: '请给我3个随机的小说创作灵感',
      temperature: 0.9,
    })

    const rawText = result.text.trim()

    // 三级降级解析 JSON
    let cards: Array<{
      id: string; title: string; genre: string; worldBuilding: string
      protagonist: string; coreConflict: string; mainGoal: string
      highConcept: string; sublimation: string; openingHook: string
    }>

    try {
      cards = JSON.parse(rawText)
    } catch {
      const jsonMatch = rawText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
      if (jsonMatch) {
        try {
          cards = JSON.parse(jsonMatch[1])
        } catch {
          console.error('Failed to parse JSON from response:', rawText)
          return ApiErrors.serverError('生成失败，AI 返回格式异常，请重试')
        }
      } else {
        const arrMatch = rawText.match(/\[\s*\{[\s\S]*\}\s*\]/)
        if (arrMatch) {
          try {
            cards = JSON.parse(arrMatch[0])
          } catch {
            console.error('Failed to parse JSON array from response:', rawText)
            return ApiErrors.serverError('生成失败，AI 返回格式异常，请重试')
          }
        } else {
          console.error('No JSON found in response:', rawText)
          return ApiErrors.serverError('生成失败，AI 返回格式异常，请重试')
        }
      }
    }

    if (!Array.isArray(cards) || cards.length === 0) {
      return ApiErrors.serverError('生成失败，未获得有效创意，请重试')
    }

    // 确保每个卡片都有 id
    cards = cards.slice(0, 3).map((card, index) => ({
      ...card,
      id: card.id || String(index + 1),
      title: card.title || `${card.genre || '新'}小说`,
    }))

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
