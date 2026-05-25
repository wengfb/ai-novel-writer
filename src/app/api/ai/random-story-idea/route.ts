import { NextRequest } from 'next/server'
import { generateText } from 'ai'
import { getLanguageModelAsync } from '@/lib/ai/providers'
import { ApiErrors } from '@/lib/api/response'

const SYSTEM_PROMPT = `你是一个创意小说灵感生成器。用户需要随机的小说创作灵感。

请生成一个有趣、有创意的小说构思，包含以下要素：
- 一个吸引人的故事核心设定
- 主角的基本身份或特点
- 核心冲突或悬念

要求：
- 控制在2-4句话以内（50-120字）
- 风格随机多样（修仙、都市、科幻、玄幻、悬疑、历史、游戏异界等不限）
- 每次都要有不同的创意，避免重复套路
- 使用中文
- 直接输出故事构想，不需要任何前缀（如"好的"、"这是一个"等）
- 不要使用markdown格式`

export async function POST(_request: NextRequest) {
  try {
    const { model } = await getLanguageModelAsync()

    const result = await generateText({
      model,
      system: SYSTEM_PROMPT,
      prompt: '请给我一个随机的小说创作灵感',
      temperature: 1.2,
      maxOutputTokens: 300,
    })

    return Response.json({
      success: true,
      data: { idea: result.text.trim() },
    })
  } catch (error) {
    console.error('Random story idea generation error:', error)
    return ApiErrors.serverError('生成随机创意失败，请重试')
  }
}
