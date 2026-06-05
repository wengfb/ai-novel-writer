import { NextRequest } from 'next/server'
import { generateText } from 'ai'
import { getLanguageModelAsync } from '@/lib/ai/providers'
import { ApiErrors } from '@/lib/api/response'

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { audience, genre, tone, customRequirements } = body || {}

    const constraints: string[] = []
    if (audience) constraints.push(`目标受众：${audience}`)
    if (genre) constraints.push(`题材类型：${genre}`)
    if (tone) constraints.push(`故事基调：${tone}`)
    if (customRequirements) constraints.push(`用户自定义要求：${customRequirements}`)

    const constraintPrompt = constraints.length > 0
      ? `\n\n【用户偏好，必须严格遵循】\n${constraints.join('\n')}\n请确保生成的故事构想完全符合以上偏好。`
      : ''

    const { model } = await getLanguageModelAsync()

    const result = await generateText({
      model,
      system: SYSTEM_PROMPT + constraintPrompt,
      prompt: '请给我3个随机的小说创作灵感',
      temperature: 0.9,
    })

    const rawText = result.text.trim()

    // 尝试解析 JSON
    let cards: Array<{
      id: string
      title: string
      genre: string
      worldBuilding: string
      protagonist: string
      coreConflict: string
      mainGoal: string
      highConcept: string
      sublimation: string
      openingHook: string
    }>

    try {
      // 先尝试直接解析
      cards = JSON.parse(rawText)
    } catch {
      // 尝试从 markdown 代码块中提取
      const jsonMatch = rawText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
      if (jsonMatch) {
        try {
          cards = JSON.parse(jsonMatch[1])
        } catch {
          console.error('Failed to parse JSON from response:', rawText)
          return ApiErrors.serverError('生成失败，AI 返回格式异常，请重试')
        }
      } else {
        // 尝试匹配 JSON 数组
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

    return Response.json({
      success: true,
      data: { cards },
    })
  } catch (error) {
    console.error('Random story idea generation error:', error)
    return ApiErrors.serverError('生成随机创意失败，请重试')
  }
}
