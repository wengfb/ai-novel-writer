export type AIProviderName = 'openai-compatible' | 'gemini'

export interface AIProviderConfig {
  provider: AIProviderName
  model: string
  apiKey: string
  baseURL?: string
  name: string
}

const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'
const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
const DEFAULT_CONTEXT_MAX_TOKENS = 100000

export function getContextMaxTokens(): number {
  const envValue = process.env.AI_CONTEXT_MAX_TOKENS
  if (envValue) {
    const parsed = parseInt(envValue, 10)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  return DEFAULT_CONTEXT_MAX_TOKENS
}

export function normalizeAIProvider(provider?: string): AIProviderName {
  const normalized = provider?.trim().toLowerCase()

  if (normalized === 'gemini' || normalized === 'google') {
    return 'gemini'
  }

  return 'openai-compatible'
}

export function getAIProviderConfig(modelOverride?: string): AIProviderConfig {
  const provider = normalizeAIProvider(process.env.AI_PROVIDER)

  if (provider === 'gemini') {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
    const model = modelOverride || process.env.AI_MODEL || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL

    if (!apiKey) {
      throw new Error('Missing Gemini API key. Set GOOGLE_GENERATIVE_AI_API_KEY.')
    }

    return {
      provider,
      name: 'gemini',
      model,
      apiKey,
      baseURL: process.env.GEMINI_BASE_URL,
    }
  }

  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || ''
  const model = modelOverride || process.env.AI_MODEL || process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL

  if (!apiKey) {
    throw new Error(
      'Missing AI API key. Set AI_API_KEY or OPENAI_API_KEY, or set AI_PROVIDER=gemini with GOOGLE_GENERATIVE_AI_API_KEY.'
    )
  }

  return {
    provider,
    name: 'openai-compatible',
    model,
    apiKey,
    baseURL: process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL || DEFAULT_OPENAI_BASE_URL,
  }
}
