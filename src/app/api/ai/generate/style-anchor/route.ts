import { NextRequest } from 'next/server'
import { getAIProviderAsync } from '@/lib/ai/providers'
import { apiSuccess, ApiErrors } from '@/lib/api/response'
import { validateRequest } from '@/lib/api/validators'
import { z } from 'zod'

const GenerateStyleAnchorSchema = z.object({
  description: z.string().min(10, '故事描述至少10个字'),
  genre: z.string().min(1, '请提供小说类型'),
  hint: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = validateRequest(GenerateStyleAnchorSchema, body)

    const ai = await getAIProviderAsync()

    const hintSection = data.hint
      ? `\n**用户指定的风格方向**：${data.hint}`
      : ''

    const prompt = `你是一位专业的小说作家。请根据以下故事设定，写一段 500-2000 字的样章作为写作风格参考。

**小说类型**：${data.genre}
**故事描述**：${data.description}${hintSection}

要求：
1. 这是一个完整的叙事片段（可以是故事的开头或关键场景）
2. 展示你选择的语气基调、叙事节奏和文风
3. 包含对话和描写
4. 500-2000 字
5. 直接输出样章正文，不要加任何说明、标题或标签`

    const result = await ai.generate({
      type: 'chapter',
      prompt,
      temperature: 0.8,
      maxTokens: 4000,
    })

    if (result.status !== 'success' || !result.output.trim()) {
      return ApiErrors.badRequest('样章生成失败，请重试')
    }

    const content = result.output.trim()

    return apiSuccess({
      content,
      wordCount: content.length,
    })
  } catch (error) {
    console.error('Style anchor generation error:', error)
    return ApiErrors.badRequest(
      error instanceof Error ? error.message : '样章生成失败'
    )
  }
}
