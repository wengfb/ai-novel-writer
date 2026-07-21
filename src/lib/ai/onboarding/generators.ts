/**
 * Onboarding 各步 AI 生成器
 *
 * 统一路径：build*Prompt → runAgent(onboarding-*) → JSON 提取（可重试）
 * 风格锚点为纯文本，parseJson=false。
 *
 * WHY 不直接调 Provider：保证 system 提示词走可编辑 Agent 注册表。
 */

import { getAIProviderAsync } from '@/lib/ai/providers'
// 从 runner 直引，避免 onboarding ↔ agents/index 再导出链上的环
import { runAgent } from '@/lib/ai/agents/runner'
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

  try {
    return JSON.parse(trimmed) as T
  } catch {
    // continue
  }

  const codeBlockMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/)
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]) as T
    } catch {
      // continue
    }
  }

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

interface StepMeta {
  raw: string
  provider: string
  modelUsed: string
  duration: number
  tokensUsed?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  cost?: number
}

interface CallOptions {
  agentId: string
  taskBody: string
  model?: string
  temperature?: number
  maxTokens?: number
  /** 是否解析 JSON（风格锚点为纯文本） */
  parseJson?: boolean
}

/**
 * 通过 Agent 调用 + 可选 JSON 解析
 * JSON 失败时最多重试 retries 次，并追加更严的格式约束
 */
async function callAgentStep<T>(
  options: CallOptions & { parseJson: true },
  retries?: number
): Promise<{ data: T } & StepMeta>
async function callAgentStep(
  options: CallOptions & { parseJson: false },
  retries?: number
): Promise<{ data: string } & StepMeta>
async function callAgentStep<T>(
  options: CallOptions,
  retries = 2
): Promise<{ data: T | string } & StepMeta> {
  const parseJson = options.parseJson !== false
  let lastError: Error | null = null
  let taskBody = options.taskBody

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const result = await runAgent({
        agentId: options.agentId,
        model: options.model,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        variables: {
          taskBody,
          extraConstraints: '',
        },
      })

      if (!result.text?.trim()) {
        throw new Error('AI 返回为空')
      }

      const meta: StepMeta = {
        raw: result.text,
        provider: result.provider || 'unknown',
        modelUsed: result.modelUsed || options.model || 'unknown',
        duration: result.duration || 0,
        tokensUsed: result.tokensUsed,
        cost: result.cost,
      }

      if (!parseJson) {
        return { data: result.text, ...meta }
      }

      const data = extractJSON<T>(result.text)
      return { data, ...meta }
    } catch (error) {
      lastError = error as Error
      if (attempt <= retries && parseJson) {
        taskBody = `${options.taskBody}

【重要】上一次输出无法解析为有效 JSON。请严格遵守以下要求：
1. 只输出纯 JSON，不要添加任何解释文字
2. 所有字符串值中的双引号必须用反斜杠转义
3. 数组和对象的最后一个元素后不要加逗号
4. 确保所有花括号和方括号正确配对`
      } else if (attempt > retries) {
        break
      }
    }
  }

  throw new Error(
    parseJson
      ? `JSON 解析失败（已重试 ${retries} 次）: ${lastError?.message}`
      : `Agent 调用失败: ${lastError?.message}`
  )
}

// ============ Step 1: 故事架构 (onboarding-architecture) ============

/** 生成故事架构 JSON */
export async function generateArchitecture(
  prompt: string,
  model?: string
): Promise<{
  architecture: StoryArchitecture
  raw: string
  provider: string
  modelUsed: string
  duration: number
  tokensUsed?: StepMeta['tokensUsed']
  cost?: number
}> {
  const result = await callAgentStep<StoryArchitecture>({
    agentId: 'onboarding-architecture',
    taskBody: prompt,
    model,
    temperature: 0.7,
    maxTokens: 6000,
    parseJson: true,
  })
  return {
    architecture: result.data,
    raw: result.raw,
    provider: result.provider,
    modelUsed: result.modelUsed,
    duration: result.duration,
    tokensUsed: result.tokensUsed,
    cost: result.cost,
  }
}

// ============ Step 2: 角色群像 (onboarding-characters) ============

/** 生成角色群像 JSON */
export async function generateCharacters(
  prompt: string,
  model?: string
): Promise<{
  characters: CharacterEnsemble
  raw: string
  provider: string
  modelUsed: string
  duration: number
  tokensUsed?: StepMeta['tokensUsed']
  cost?: number
}> {
  const result = await callAgentStep<CharacterEnsemble>({
    agentId: 'onboarding-characters',
    taskBody: prompt,
    model,
    temperature: 0.8,
    maxTokens: 8000,
    parseJson: true,
  })
  return {
    characters: result.data,
    raw: result.raw,
    provider: result.provider,
    modelUsed: result.modelUsed,
    duration: result.duration,
    tokensUsed: result.tokensUsed,
    cost: result.cost,
  }
}

// ============ Step 3: 世界观 (onboarding-world) ============

/** 生成世界观元素 JSON */
export async function generateWorldElements(
  prompt: string,
  model?: string
): Promise<{
  worldSettings: WorldSettings
  raw: string
  provider: string
  modelUsed: string
  duration: number
  tokensUsed?: StepMeta['tokensUsed']
  cost?: number
}> {
  const result = await callAgentStep<WorldSettings>({
    agentId: 'onboarding-world',
    taskBody: prompt,
    model,
    temperature: 0.7,
    maxTokens: 8000,
    parseJson: true,
  })
  return {
    worldSettings: result.data,
    raw: result.raw,
    provider: result.provider,
    modelUsed: result.modelUsed,
    duration: result.duration,
    tokensUsed: result.tokensUsed,
    cost: result.cost,
  }
}

// ============ Step 4: 总纲 + 前三章细纲 (onboarding-chapters) ============

/**
 * 生成章节大纲 JSON（Bootstrap 精简：overallOutline + 前 3 章）
 * maxTokens 已下调，避免全量 40 章超时
 */
export async function generateChapters(
  prompt: string,
  model?: string
): Promise<{
  chapters: ChapterOutline
  raw: string
  provider: string
  modelUsed: string
  duration: number
  tokensUsed?: StepMeta['tokensUsed']
  cost?: number
}> {
  // Bootstrap 仅需总纲 + 前三章细纲，输出显著缩小，降低超时风险
  const result = await callAgentStep<ChapterOutline>({
    agentId: 'onboarding-chapters',
    taskBody: prompt,
    model,
    temperature: 0.6,
    maxTokens: 6000,
    parseJson: true,
  })
  return {
    chapters: result.data,
    raw: result.raw,
    provider: result.provider,
    modelUsed: result.modelUsed,
    duration: result.duration,
    tokensUsed: result.tokensUsed,
    cost: result.cost,
  }
}

// ============ Step 5: 伏笔 (onboarding-foreshadowings) ============

/** 生成伏笔计划 JSON */
export async function generateForeshadowings(
  prompt: string,
  model?: string
): Promise<{
  foreshadowings: ForeshadowingPlan
  raw: string
  provider: string
  modelUsed: string
  duration: number
  tokensUsed?: StepMeta['tokensUsed']
  cost?: number
}> {
  const result = await callAgentStep<ForeshadowingPlan>({
    agentId: 'onboarding-foreshadowings',
    taskBody: prompt,
    model,
    temperature: 0.7,
    maxTokens: 6000,
    parseJson: true,
  })
  return {
    foreshadowings: result.data,
    raw: result.raw,
    provider: result.provider,
    modelUsed: result.modelUsed,
    duration: result.duration,
    tokensUsed: result.tokensUsed,
    cost: result.cost,
  }
}

// ============ Step 6: 风格锚点 (onboarding-style-anchor，纯文本) ============

/** 生成风格锚点样章正文（非 JSON） */
export async function generateStyleAnchorText(
  prompt: string,
  model?: string
): Promise<{
  styleAnchor: StyleAnchorResult
  raw: string
  provider: string
  modelUsed: string
  duration: number
  tokensUsed?: StepMeta['tokensUsed']
  cost?: number
}> {
  const result = await callAgentStep({
    agentId: 'onboarding-style-anchor',
    taskBody: prompt,
    model,
    temperature: 0.8,
    maxTokens: 3000,
    parseJson: false,
  })

  const content = String(result.data).trim()
  const chineseChars = (content.match(/[一-龥]/g) || []).length

  // 若 Agent 不可用则兜底（理论上不会）
  if (!content) {
    const ai = await getAIProviderAsync(model)
    throw new Error(`风格锚点生成失败（provider: ${ai.name}）`)
  }

  return {
    styleAnchor: { content, wordCount: chineseChars },
    raw: result.raw,
    provider: result.provider,
    modelUsed: result.modelUsed,
    duration: result.duration,
    tokensUsed: result.tokensUsed,
    cost: result.cost,
  }
}
