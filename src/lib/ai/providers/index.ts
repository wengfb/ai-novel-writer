import type { LanguageModel } from 'ai'
import { getAIProviderConfig } from '@/lib/ai/config'
import type { AIProvider } from './types'
import { GeminiProvider } from './gemini'
import { OpenAICompatibleProvider } from './openai-compatible'

export function getAIProvider(modelOverride?: string): AIProvider {
  const config = getAIProviderConfig(modelOverride)

  if (config.provider === 'gemini') {
    return new GeminiProvider(config)
  }

  return new OpenAICompatibleProvider(config)
}

export function getLanguageModel(modelOverride?: string): {
  model: LanguageModel
  provider: AIProvider['name']
  modelId: string
} {
  const provider = getAIProvider(modelOverride)

  return {
    model: provider.getModel(),
    provider: provider.name,
    modelId: provider.model,
  }
}
