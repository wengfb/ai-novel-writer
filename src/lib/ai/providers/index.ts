import type { LanguageModel } from 'ai'
import { getAIProviderConfig, getAIProviderConfigAsync } from '@/lib/ai/config'
import type { AIProvider } from './types'
import { GeminiProvider } from './gemini'
import { OpenAICompatibleProvider } from './openai-compatible'

function createProvider(config: ReturnType<typeof getAIProviderConfig>): AIProvider {
  if (config.provider === 'gemini') {
    return new GeminiProvider(config)
  }
  return new OpenAICompatibleProvider(config)
}

/** 异步获取 AI Provider（DB 设置优先于环境变量） */
export async function getAIProviderAsync(modelOverride?: string): Promise<AIProvider> {
  return createProvider(await getAIProviderConfigAsync(modelOverride))
}

/** 异步获取 LanguageModel（DB 设置优先于环境变量） */
export async function getLanguageModelAsync(modelOverride?: string): Promise<{
  model: LanguageModel
  provider: AIProvider['name']
  modelId: string
}> {
  const provider = await getAIProviderAsync(modelOverride)

  return {
    model: provider.getModel(),
    provider: provider.name,
    modelId: provider.model,
  }
}
