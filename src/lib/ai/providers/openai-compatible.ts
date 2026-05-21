import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
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

export class OpenAICompatibleProvider implements AIProvider {
  name = 'openai-compatible' as const
  model: string
  private provider: ReturnType<typeof createOpenAICompatible>

  constructor(private config: AIProviderConfig) {
    this.model = config.model
    this.provider = createOpenAICompatible({
      name: config.name,
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://api.openai.com/v1',
    })
  }

  getModel(modelOverride?: string): LanguageModel {
    return this.provider(modelOverride || this.model)
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
        duration,
        status: 'success',
      }
    } catch (error) {
      const duration = Date.now() - startTime
      console.error('OpenAI-compatible generation error:', error)

      return {
        output: '',
        duration,
        status: 'error',
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
      console.error('OpenAI-compatible stream generation error:', error)
      throw error
    }
  }

  estimateTokens(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length

    return Math.ceil(chineseChars / 2 + englishWords * 0.75)
  }
}
