import type { LanguageModel } from 'ai'
import type { GenerationParams, GenerationResult } from '@/types'
import type { AIProviderName } from '@/lib/ai/config'

export interface AIProvider {
  name: AIProviderName
  model: string
  getModel(modelOverride?: string): LanguageModel
  generate(params: GenerationParams): Promise<GenerationResult>
  streamGenerate(params: GenerationParams): AsyncGenerator<string, void, unknown>
  estimateTokens(text: string): number
}
