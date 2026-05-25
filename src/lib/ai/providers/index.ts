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

/** 同步获取 AI Provider（仅环境变量，用于类字段初始化） */
export function getAIProvider(modelOverride?: string): AIProvider {
  return createProvider(getAIProviderConfig(modelOverride))
}

/** 异步获取 AI Provider（DB 设置优先于环境变量） */
export async function getAIProviderAsync(modelOverride?: string): Promise<AIProvider> {
  return createProvider(await getAIProviderConfigAsync(modelOverride))
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
