import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText, generateText, type LanguageModel } from 'ai'
import type { GenerationParams, GenerationResult } from '@/types'
import type { AIProviderConfig } from '@/lib/ai/config'
import type { AIProvider } from './types'

interface TokenUsageLike {
  inputTokens?: number
  promptTokens?: number
  prompt?: number
  outputTokens?: number
  completionTokens?: number
  completion?: number
  totalTokens?: number
  total?: number
}

export class GeminiProvider implements AIProvider {
  name = 'gemini' as const
  model: string
  private google: ReturnType<typeof createGoogleGenerativeAI>

  constructor(config?: Partial<AIProviderConfig>) {
    const apiKey = config?.apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
    const baseURL = config?.baseURL || process.env.GEMINI_BASE_URL
    this.model = config?.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash'

    if (!apiKey) {
      throw new Error('Missing Gemini API key. Set GOOGLE_GENERATIVE_AI_API_KEY.')
    }

    this.google = createGoogleGenerativeAI({
      apiKey,
      baseURL,
    })
  }

  getModel(modelOverride?: string): LanguageModel {
    return this.google(modelOverride || this.model)
  }

  async generate(params: GenerationParams): Promise<GenerationResult> {
    const startTime = Date.now()

    try {
      const model = params.model || this.model
      const result = await generateText({
        model: this.getModel(model),
        prompt: params.prompt,
        system: params.systemPrompt,
        temperature: params.temperature ?? 0.8,
      })

      const duration = Date.now() - startTime
      const usage = result.usage as TokenUsageLike
      const promptTokens = usage?.inputTokens || usage?.promptTokens || usage?.prompt || 0
      const completionTokens = usage?.outputTokens || usage?.completionTokens || usage?.completion || 0
      const totalTokens = usage?.totalTokens || usage?.total || promptTokens + completionTokens

      return {
        output: result.text,
        tokensUsed: {
          promptTokens,
          completionTokens,
          totalTokens,
        },
        cost: this.estimateCost(promptTokens, completionTokens, model),
        duration,
        status: 'success',
      }
    } catch (error) {
      const duration = Date.now() - startTime
      const message = error instanceof Error ? error.message : String(error)
      console.error('Gemini generation error:', message)

      return {
        output: '',
        duration,
        status: 'error',
        error: message,
      }
    }
  }

  async *streamGenerate(params: GenerationParams): AsyncGenerator<string, void, unknown> {
    try {
      const result = await streamText({
        model: this.getModel(params.model),
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

  private estimateCost(inputTokens: number, outputTokens: number, model: string): number {
    let inputCostPer1M = 0
    let outputCostPer1M = 0

    if (model.includes('flash')) {
      inputCostPer1M = 0.075
      outputCostPer1M = 0.30
    } else if (model.includes('pro')) {
      inputCostPer1M = 1.25
      outputCostPer1M = 5.00
    }

    const inputCost = (inputTokens / 1_000_000) * inputCostPer1M
    const outputCost = (outputTokens / 1_000_000) * outputCostPer1M

    return inputCost + outputCost
  }

  estimateTokens(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length

    return Math.ceil(chineseChars / 2 + englishWords * 0.75)
  }
}

let geminiProvider: GeminiProvider | null = null

export function getGeminiProvider(config?: Partial<AIProviderConfig>): GeminiProvider {
  if (!geminiProvider || config) {
    geminiProvider = new GeminiProvider(config)
  }
  return geminiProvider
}
