/**
 * 统一 Agent 运行入口
 *
 * ## 分层
 * - 提示词：注册表 + prompt-store（可编辑，支持多 slot）
 * - 散文：runAgent / streamAgent → Provider（与 chat 同一 chat/completions 通道）
 * - 结构：runAgentObject → runAgent + JSON 约定 + Zod（与 chat 同栈）
 * - Mastra Agent：仅 createMastraAgent，高级 tools 场景
 */

import { Agent } from '@mastra/core/agent'
import type { ToolsInput } from '@mastra/core/agent'
import type { z } from 'zod'
import { getLanguageModelAsync, getAIProviderAsync } from '@/lib/ai/providers'
import { requireAgentDefinition, resolveAgentId } from './registry'
import { getPromptContent, resolveAgentPrompts } from './prompt-store'
import { interpolatePrompt } from './prompt-utils'
import type {
  AgentObjectResult,
  AgentRunRequest,
  AgentRunResult,
} from './types'

/** 创建 Mastra Agent 实例时的选项 */
export interface CreateAgentOptions {
  agentId: string
  modelOverride?: string
  variables?: Record<string, unknown>
  contextAppend?: string
  systemSlot?: string
  tools?: ToolsInput
  temperature?: number
}

export async function createMastraAgent(options: CreateAgentOptions): Promise<{
  agent: Agent
  definition: ReturnType<typeof requireAgentDefinition>
  systemPrompt: string
}> {
  const definition = requireAgentDefinition(options.agentId)
  const legacy = resolveAgentId(options.agentId)
  const { model } = await getLanguageModelAsync(options.modelOverride)

  const systemTemplate = await getPromptContent(
    definition,
    options.systemSlot || legacy.systemSlot || 'system'
  )
  let systemPrompt = interpolatePrompt(systemTemplate, options.variables ?? {})

  if (options.contextAppend?.trim()) {
    systemPrompt = `${systemPrompt}\n\n${options.contextAppend.trim()}`
  }

  const agent = new Agent({
    id: definition.id,
    name: definition.name,
    description: definition.description,
    instructions: systemPrompt,
    model: model as any,
    tools: options.tools,
    defaultOptions: {
      modelSettings: {
        temperature: options.temperature ?? definition.temperature ?? 0.7,
      },
      maxSteps: definition.maxSteps ?? 5,
    },
  })

  return { agent, definition, systemPrompt }
}

export async function resolveAgentPromptsForRun(request: AgentRunRequest): Promise<{
  systemPrompt: string
  userPrompt: string
  temperature: number
  definition: ReturnType<typeof requireAgentDefinition>
  resolvedAgentId: string
}> {
  const legacy = resolveAgentId(request.agentId)
  const definition = requireAgentDefinition(request.agentId)
  const slots = await resolveAgentPrompts(definition)
  const variables = request.variables ?? {}
  const systemKey = request.systemSlot || legacy.systemSlot || 'system'
  const userKey = request.userSlot || legacy.userSlot || 'user'

  const systemSlot = slots.find((s) => s.key === systemKey)
  let systemPrompt = systemSlot
    ? interpolatePrompt(systemSlot.content, variables)
    : ''

  if (!systemPrompt && systemKey !== 'system') {
    const fallback = slots.find((s) => s.key === 'system')
    if (fallback) systemPrompt = interpolatePrompt(fallback.content, variables)
  }

  if (request.contextAppend?.trim()) {
    systemPrompt = systemPrompt
      ? `${systemPrompt}\n\n${request.contextAppend.trim()}`
      : request.contextAppend.trim()
  }

  const userSlot = slots.find((s) => s.key === userKey)
  let userPrompt = request.userMessage?.trim() || ''
  if (!userPrompt && userSlot) {
    userPrompt = interpolatePrompt(userSlot.content, variables)
  }
  if (!userPrompt && userKey !== 'user') {
    const fallback = slots.find((s) => s.key === 'user')
    if (fallback) userPrompt = interpolatePrompt(fallback.content, variables)
  }
  if (!userPrompt) {
    throw new Error(
      `Agent ${request.agentId} 需要 userMessage 或 ${userKey} 提示词槽位`
    )
  }

  return {
    systemPrompt,
    userPrompt,
    temperature: request.temperature ?? definition.temperature ?? 0.7,
    definition,
    resolvedAgentId: legacy.agentId,
  }
}

export async function runAgent(request: AgentRunRequest): Promise<AgentRunResult> {
  const resolved = await resolveAgentPromptsForRun(request)
  const ai = await getAIProviderAsync(request.model)
  const startTime = Date.now()

  const result = await ai.generate({
    type: 'chapter',
    model: request.model,
    prompt: resolved.userPrompt,
    systemPrompt: resolved.systemPrompt || undefined,
    temperature: resolved.temperature,
    maxTokens: request.maxTokens,
  })

  const duration = Date.now() - startTime

  if (result.status === 'error') {
    throw new Error(result.error || `Agent ${request.agentId} 生成失败`)
  }

  return {
    agentId: resolved.resolvedAgentId,
    text: result.output || '',
    systemPrompt: resolved.systemPrompt,
    userPrompt: resolved.userPrompt,
    provider: ai.name,
    modelUsed: request.model || ai.model,
    duration: result.duration ?? duration,
    tokensUsed: result.tokensUsed,
    cost: result.cost,
  }
}

/**
 * 结构化单轮：与 runAgent / 聊天同一通道 + Zod
 */
export async function runAgentObject<T>(
  request: AgentRunRequest & {
    schema: z.ZodType<T>
    schemaName?: string
    schemaDescription?: string
  }
): Promise<AgentObjectResult<T>> {
  const shapeHint = request.schemaDescription
    ? `目标结构：${request.schemaDescription}`
    : request.schemaName
      ? `输出名称：${request.schemaName}`
      : '输出合法 JSON'

  const textResult = await runAgent({
    ...request,
    contextAppend: [
      request.contextAppend,
      '【输出协议】只输出一个合法 JSON（对象或数组），不要 markdown 代码块，不要解释文字。',
      shapeHint,
    ]
      .filter(Boolean)
      .join('\n'),
  })

  if (!textResult.text?.trim()) {
    throw new Error(`Agent ${request.agentId} 返回为空`)
  }

  const object = parseJsonWithSchema(textResult.text, request.schema)

  return {
    agentId: textResult.agentId,
    object,
    text: JSON.stringify(object),
    systemPrompt: textResult.systemPrompt,
    userPrompt: textResult.userPrompt,
    provider: textResult.provider,
    modelUsed: textResult.modelUsed,
    duration: textResult.duration,
    tokensUsed: textResult.tokensUsed,
    cost: textResult.cost,
  }
}

/** 安全 JSON.parse：兼容尾部多余文字 */
function tryParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch (error) {
    if (error instanceof SyntaxError) {
      const m = error.message.match(/position\s+(\d+)/i)
      if (m) {
        const cut = Number(m[1])
        if (cut > 0 && cut < raw.length) {
          return JSON.parse(raw.slice(0, cut))
        }
      }
      const lastBrace = Math.max(raw.lastIndexOf('}'), raw.lastIndexOf(']'))
      if (lastBrace > 0) {
        return JSON.parse(raw.slice(0, lastBrace + 1))
      }
    }
    throw error
  }
}

/** 从文本中提取平衡的 JSON 值 */
function extractBalancedJson(text: string): string[] {
  const out: string[] = []
  for (let i = 0; i < text.length; i++) {
    const start = text[i]
    if (start !== '{' && start !== '[') continue
    const open = start
    const close = start === '{' ? '}' : ']'
    let depth = 0
    let inString = false
    let escape = false
    for (let j = i; j < text.length; j++) {
      const ch = text[j]
      if (inString) {
        if (escape) escape = false
        else if (ch === '\\') escape = true
        else if (ch === '"') inString = false
        continue
      }
      if (ch === '"') {
        inString = true
        continue
      }
      if (ch === open) depth++
      else if (ch === close) {
        depth--
        if (depth === 0) {
          out.push(text.slice(i, j + 1))
          i = j
          break
        }
      }
    }
  }
  return out
}

function parseJsonWithSchema<T>(text: string, schema: z.ZodType<T>): T {
  const trimmed = text.trim()
  const candidates: string[] = []

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence?.[1]) candidates.push(fence[1].trim())

  candidates.push(...extractBalancedJson(trimmed))
  candidates.push(trimmed)

  const obj = trimmed.match(/\{[\s\S]*\}/)
  if (obj?.[0]) candidates.push(obj[0])
  const arr = trimmed.match(/\[[\s\S]*\]/)
  if (arr?.[0]) candidates.push(arr[0])

  const seen = new Set<string>()
  const unique = candidates
    .filter((c) => {
      if (!c || seen.has(c)) return false
      seen.add(c)
      return true
    })
    // 优先最长片段，避免内层小对象先匹配成功/失败干扰
    .sort((a, b) => b.length - a.length)

  let lastError: unknown
  for (const raw of unique) {
    try {
      const parsed: unknown = tryParseJson(raw)
      const tried: unknown[] = [parsed]
      if (Array.isArray(parsed)) {
        tried.push({ ideas: parsed })
        tried.push({ cards: parsed })
        tried.push({ scenes: parsed })
        tried.push({ characters: parsed })
        tried.push({ worldSettings: parsed })
        tried.push({ foreshadowings: parsed })
        tried.push({ chapters: parsed })
      } else if (parsed && typeof parsed === 'object') {
        const o = parsed as Record<string, unknown>
        if (Array.isArray(o.cards) && o.ideas == null) {
          tried.push({ ...o, ideas: o.cards })
        }
        if (Array.isArray(o.data) && o.ideas == null) {
          tried.push({ ...o, ideas: o.data })
        }
      }
      for (const candidate of tried) {
        try {
          return schema.parse(candidate)
        } catch (e) {
          lastError = e
        }
      }
    } catch (e) {
      lastError = e
    }
  }

  const preview = trimmed.slice(0, 500).replace(/\s+/g, ' ')
  throw new Error(
    `无法解析结构化结果: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    } | 原文预览: ${preview}`
  )
}

export async function* streamAgent(
  request: AgentRunRequest
): AsyncGenerator<string, AgentRunResult, unknown> {
  const resolved = await resolveAgentPromptsForRun(request)
  const ai = await getAIProviderAsync(request.model)

  let fullText = ''
  const generator = ai.streamGenerate({
    type: 'chapter',
    model: request.model,
    prompt: resolved.userPrompt,
    systemPrompt: resolved.systemPrompt || undefined,
    temperature: resolved.temperature,
    maxTokens: request.maxTokens,
  })

  for await (const chunk of generator) {
    fullText += chunk
    yield chunk
  }

  return {
    agentId: resolved.resolvedAgentId,
    text: fullText,
    systemPrompt: resolved.systemPrompt,
    userPrompt: resolved.userPrompt,
  }
}

export async function renderAgentSlot(
  agentId: string,
  slotKey: string,
  variables: Record<string, unknown> = {}
): Promise<string> {
  const definition = requireAgentDefinition(agentId)
  const legacy = resolveAgentId(agentId)
  let key = slotKey
  if (slotKey === 'system' && legacy.systemSlot) key = legacy.systemSlot
  if (slotKey === 'user' && legacy.userSlot) key = legacy.userSlot
  try {
    const content = await getPromptContent(definition, key)
    return interpolatePrompt(content, variables)
  } catch {
    if (key !== slotKey) {
      const content = await getPromptContent(definition, slotKey)
      return interpolatePrompt(content, variables)
    }
    throw new Error(`Agent ${definition.id} 没有提示词槽位: ${slotKey}`)
  }
}
