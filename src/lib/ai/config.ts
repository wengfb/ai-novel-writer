import { prisma } from '@/lib/db/prisma'

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

// 缓存 DB 设置，避免每次请求都读库
let cachedDBSettings: Record<string, string> | null = null
let cacheExpiry = 0
const CACHE_TTL = 30_000 // 30秒缓存

async function getDBSettings(): Promise<Record<string, string>> {
  const now = Date.now()
  if (cachedDBSettings && now < cacheExpiry) {
    return cachedDBSettings
  }

  try {
    const rows = await prisma.systemSetting.findMany()
    cachedDBSettings = {}
    for (const row of rows) {
      cachedDBSettings[row.key] = row.value
    }
    cacheExpiry = now + CACHE_TTL
    return cachedDBSettings
  } catch {
    return cachedDBSettings || {}
  }
}

/** 清除设置缓存（供外部调用，如保存设置后刷新） */
export function clearConfigCache() {
  cachedDBSettings = null
  cacheExpiry = 0
}

function getEnvWithDBFallback(
  dbSettings: Record<string, string>,
  dbKey: string,
  envKey: string,
  defaultValue: string = ''
): string {
  return dbSettings[dbKey] || process.env[envKey] || defaultValue
}

export function getContextMaxTokens(): number {
  const envValue = process.env.AI_CONTEXT_MAX_TOKENS
  if (envValue) {
    const parsed = parseInt(envValue, 10)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  return DEFAULT_CONTEXT_MAX_TOKENS
}

/** 异步获取上下文 Token 上限（DB 可覆盖环境变量） */
export async function getContextMaxTokensAsync(): Promise<number> {
  const dbSettings = await getDBSettings()
  const dbValue = dbSettings['ai.contextMaxTokens']
  if (dbValue) {
    const parsed = parseInt(dbValue, 10)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  return getContextMaxTokens()
}

export function normalizeAIProvider(provider?: string): AIProviderName {
  const normalized = provider?.trim().toLowerCase()

  if (normalized === 'gemini' || normalized === 'google') {
    return 'gemini'
  }

  return 'openai-compatible'
}

/**
 * 同步获取 AI Provider 配置（仅读环境变量，用于类字段初始化等非异步场景）
 */
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

/**
 * 异步获取 AI Provider 配置（DB 设置优先于环境变量）
 */
export async function getAIProviderConfigAsync(modelOverride?: string): Promise<AIProviderConfig> {
  const dbSettings = await getDBSettings()

  const dbProvider = normalizeAIProvider(dbSettings['ai.provider'])
  const envProvider = normalizeAIProvider(process.env.AI_PROVIDER)
  const provider = dbSettings['ai.provider'] ? dbProvider : envProvider

  if (provider === 'gemini') {
    const apiKey = getEnvWithDBFallback(
      dbSettings, 'ai.apiKey', 'GOOGLE_GENERATIVE_AI_API_KEY'
    )
    const model = modelOverride
      || dbSettings['ai.model']
      || process.env.AI_MODEL
      || process.env.GEMINI_MODEL
      || DEFAULT_GEMINI_MODEL

    if (!apiKey) {
      throw new Error('Missing Gemini API key. Configure in settings or set GOOGLE_GENERATIVE_AI_API_KEY.')
    }

    return {
      provider,
      name: 'gemini',
      model,
      apiKey,
      baseURL: dbSettings['ai.baseUrl'] || process.env.GEMINI_BASE_URL,
    }
  }

  const apiKey = getEnvWithDBFallback(
    dbSettings, 'ai.apiKey', 'AI_API_KEY'
  ) || process.env.OPENAI_API_KEY || ''

  const model = modelOverride
    || dbSettings['ai.model']
    || process.env.AI_MODEL
    || process.env.OPENAI_MODEL
    || DEFAULT_OPENAI_MODEL

  if (!apiKey) {
    throw new Error(
      'Missing AI API key. Configure in settings or set AI_API_KEY/OPENAI_API_KEY.'
    )
  }

  return {
    provider,
    name: 'openai-compatible',
    model,
    apiKey,
    baseURL: getEnvWithDBFallback(
      dbSettings, 'ai.baseUrl', 'AI_BASE_URL',
      process.env.OPENAI_BASE_URL || DEFAULT_OPENAI_BASE_URL
    ),
  }
}
