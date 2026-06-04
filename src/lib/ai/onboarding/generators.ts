import { getAIProviderAsync } from '@/lib/ai/providers'
import type { AIProvider } from '@/lib/ai/providers/types'
import type {
  StoryArchitecture,
  CharacterEnsemble,
  WorldSettings,
  ChapterOutline,
  ForeshadowingPlan,
  StyleAnchorResult,
} from './types'

// ============ 通用 JSON 提取与重试 ============

/**
 * 从 AI 原始输出中提取 JSON 并解析
 * 尝试顺序：直接解析 → markdown 代码块提取 → 正则匹配括号
 */
function extractJSON<T>(output: string): T {
  const trimmed = output.trim()

  // 1. 直接解析
  try {
    return JSON.parse(trimmed) as T
  } catch {
    // continue
  }

  // 2. markdown 代码块提取
  const codeBlockMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/)
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]) as T
    } catch {
      // continue
    }
  }

  // 3. 正则匹配最外层 { } 或 [ ]
  const bracketMatch = trimmed.match(/\{[\s\S]*\}/) || trimmed.match(/\[[\s\S]*\]/)
  if (bracketMatch) {
    try {
      return JSON.parse(bracketMatch[0]) as T
    } catch {
      // continue
    }
  }

  throw new Error('无法从 AI 输出中提取有效 JSON')
}

interface AICallOptions {
  prompt: string
  model?: string
  temperature?: number
  maxTokens?: number
}

interface AICallResult {
  output: string
  tokensUsed?: { promptTokens: number; completionTokens: number; totalTokens: number }
  cost?: number
  duration: number
}

/**
 * 带重试的 AI 调用 + JSON 解析
 * 最多重试 2 次，每次追加 "请输出纯 JSON" 指令
 */
async function callAIAndParse<T>(
  options: AICallOptions,
  model?: string,
  retries = 2
): Promise<{ data: T; raw: string; ai: AIProvider; duration: number; tokensUsed?: AICallResult['tokensUsed']; cost?: number }> {
  const ai = await getAIProviderAsync(model)
  let lastError: Error | null = null
  let currentPrompt = options.prompt

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    const startTime = Date.now()
    const result = await ai.generate({
      type: 'outline',
      model: model || ai.model,
      prompt: currentPrompt,
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 8000,
    })
    const duration = Date.now() - startTime

    if (result.status === 'error' || !result.output) {
      throw new Error(`AI 生成失败: ${result.error || '未知错误'}`)
    }

    try {
      const data = extractJSON<T>(result.output)
      return {
        data,
        raw: result.output,
        ai,
        duration,
        tokensUsed: result.tokensUsed,
        cost: result.cost,
      }
    } catch (parseError) {
      lastError = parseError as Error
      if (attempt <= retries) {
        // 追加更严格的 JSON 格式要求后重试
        currentPrompt = `${options.prompt}

【重要】上一次输出无法解析为有效 JSON。请严格遵守以下要求：
1. 只输出纯 JSON，不要添加任何解释文字
2. 所有字符串值中的双引号必须用反斜杠转义
3. 数组和对象的最后一个元素后不要加逗号
4. 确保所有花括号和方括号正确配对`
      }
    }
  }

  throw new Error(`JSON 解析失败（已重试 ${retries} 次）: ${lastError?.message}`)
}

// ============ Step 1: 故事架构 ============

export async function generateArchitecture(
  prompt: string,
  model?: string
): Promise<{
  architecture: StoryArchitecture
  raw: string
  provider: string
  modelUsed: string
  duration: number
  tokensUsed?: AICallResult['tokensUsed']
  cost?: number
}> {
  const result = await callAIAndParse<StoryArchitecture>(
    { prompt, temperature: 0.7, maxTokens: 6000 },
    model
  )
  return {
    architecture: result.data,
    raw: result.raw,
    provider: result.ai.name,
    modelUsed: model || result.ai.model,
    duration: result.duration,
    tokensUsed: result.tokensUsed,
    cost: result.cost,
  }
}

// ============ Step 2: 角色群像 ============

export async function generateCharacters(
  prompt: string,
  model?: string
): Promise<{
  characters: CharacterEnsemble
  raw: string
  provider: string
  modelUsed: string
  duration: number
  tokensUsed?: AICallResult['tokensUsed']
  cost?: number
}> {
  const result = await callAIAndParse<CharacterEnsemble>(
    { prompt, temperature: 0.8, maxTokens: 8000 },
    model
  )
  return {
    characters: result.data,
    raw: result.raw,
    provider: result.ai.name,
    modelUsed: model || result.ai.model,
    duration: result.duration,
    tokensUsed: result.tokensUsed,
    cost: result.cost,
  }
}

// ============ Step 3: 世界观 ============

export async function generateWorldElements(
  prompt: string,
  model?: string
): Promise<{
  worldSettings: WorldSettings
  raw: string
  provider: string
  modelUsed: string
  duration: number
  tokensUsed?: AICallResult['tokensUsed']
  cost?: number
}> {
  const result = await callAIAndParse<WorldSettings>(
    { prompt, temperature: 0.7, maxTokens: 8000 },
    model
  )
  return {
    worldSettings: result.data,
    raw: result.raw,
    provider: result.ai.name,
    modelUsed: model || result.ai.model,
    duration: result.duration,
    tokensUsed: result.tokensUsed,
    cost: result.cost,
  }
}

// ============ Step 4: 分章大纲 ============

export async function generateChapters(
  prompt: string,
  model?: string
): Promise<{
  chapters: ChapterOutline
  raw: string
  provider: string
  modelUsed: string
  duration: number
  tokensUsed?: AICallResult['tokensUsed']
  cost?: number
}> {
  const result = await callAIAndParse<ChapterOutline>(
    { prompt, temperature: 0.6, maxTokens: 16000 },
    model
  )
  return {
    chapters: result.data,
    raw: result.raw,
    provider: result.ai.name,
    modelUsed: model || result.ai.model,
    duration: result.duration,
    tokensUsed: result.tokensUsed,
    cost: result.cost,
  }
}

// ============ Step 5: 伏笔系统 ============

export async function generateForeshadowings(
  prompt: string,
  model?: string
): Promise<{
  foreshadowings: ForeshadowingPlan
  raw: string
  provider: string
  modelUsed: string
  duration: number
  tokensUsed?: AICallResult['tokensUsed']
  cost?: number
}> {
  const result = await callAIAndParse<ForeshadowingPlan>(
    { prompt, temperature: 0.7, maxTokens: 6000 },
    model
  )
  return {
    foreshadowings: result.data,
    raw: result.raw,
    provider: result.ai.name,
    modelUsed: model || result.ai.model,
    duration: result.duration,
    tokensUsed: result.tokensUsed,
    cost: result.cost,
  }
}

// ============ Step 6: 风格锚点 ============

export async function generateStyleAnchorText(
  prompt: string,
  model?: string
): Promise<{
  styleAnchor: StyleAnchorResult
  raw: string
  provider: string
  modelUsed: string
  duration: number
  tokensUsed?: AICallResult['tokensUsed']
  cost?: number
}> {
  const ai = await getAIProviderAsync(model)
  const startTime = Date.now()
  const result = await ai.generate({
    type: 'outline',
    model: model || ai.model,
    prompt,
    temperature: 0.8,
    maxTokens: 3000,
  })
  const duration = Date.now() - startTime

  if (result.status === 'error' || !result.output) {
    throw new Error('风格锚点生成失败')
  }

  const content = result.output.trim()
  const chineseChars = (content.match(/[一-龥]/g) || []).length

  return {
    styleAnchor: { content, wordCount: chineseChars },
    raw: result.output,
    provider: ai.name,
    modelUsed: model || ai.model,
    duration,
    tokensUsed: result.tokensUsed,
    cost: result.cost,
  }
}
