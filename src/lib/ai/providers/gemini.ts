import { google } from '@ai-sdk/google'
import { streamText, generateText } from 'ai'
import type { GenerationParams, GenerationResult } from '@/types'

export class GeminiProvider {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
    if (!this.apiKey) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set')
    }
  }

  /**
   * 生成文本（非流式）
   */
  async generate(params: GenerationParams): Promise<GenerationResult> {
    const startTime = Date.now()

    try {
      const result = await generateText({
        model: google(params.model),
        prompt: params.prompt,
        system: params.systemPrompt,
        temperature: params.temperature ?? 0.8,
      })

      const duration = Date.now() - startTime

      // 获取 token 使用情况
      const usage = result.usage as any
      const promptTokens = usage?.promptTokens || usage?.prompt || 0
      const completionTokens = usage?.completionTokens || usage?.completion || 0
      const totalTokens = usage?.totalTokens || usage?.total || 0

      return {
        output: result.text,
        tokensUsed: {
          promptTokens,
          completionTokens,
          totalTokens,
        },
        cost: this.estimateCost(promptTokens, completionTokens, params.model),
        duration,
        status: 'success',
      }
    } catch (error) {
      const duration = Date.now() - startTime
      console.error('Gemini generation error:', error)

      return {
        output: '',
        duration,
        status: 'error',
      }
    }
  }

  /**
   * 流式生成文本
   */
  async *streamGenerate(params: GenerationParams): AsyncGenerator<string, void, unknown> {
    try {
      const result = await streamText({
        model: google(params.model),
        prompt: params.prompt,
        system: params.systemPrompt,
        temperature: params.temperature ?? 0.8,
      })

      for await (const chunk of result.textStream) {
        yield chunk
      }
    } catch (error) {
      console.error('Gemini stream generation error:', error)
      throw error
    }
  }

  /**
   * 估算成本
   * Gemini 定价（参考）:
   * - Gemini 2.5 Flash: $0.075/1M input, $0.30/1M output
   * - Gemini 2.5 Pro: $1.25/1M input, $5.00/1M output
   */
  private estimateCost(inputTokens: number, outputTokens: number, model: string): number {
    let inputCostPer1M = 0
    let outputCostPer1M = 0

    if (model === 'gemini-2.5-flash') {
      inputCostPer1M = 0.075
      outputCostPer1M = 0.30
    } else if (model === 'gemini-2.5-pro') {
      inputCostPer1M = 1.25
      outputCostPer1M = 5.00
    }

    const inputCost = (inputTokens / 1_000_000) * inputCostPer1M
    const outputCost = (outputTokens / 1_000_000) * outputCostPer1M

    return inputCost + outputCost
  }

  /**
   * 估算Token数量（粗略）
   * 英文：1 token ≈ 0.75 个单词
   * 中文：1 token ≈ 2-3 个字符
   */
  estimateTokens(text: string): number {
    // 简单估算：中文字符数 + 英文单词数 * 0.75
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length

    return Math.ceil(chineseChars / 2 + englishWords * 0.75)
  }
}

// 导出单例
let geminiProvider: GeminiProvider | null = null

export function getGeminiProvider(): GeminiProvider {
  if (!geminiProvider) {
    geminiProvider = new GeminiProvider()
  }
  return geminiProvider
}
