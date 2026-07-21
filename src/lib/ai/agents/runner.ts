/**
 * 统一 Agent 运行入口
 *
 * ## 分层
 * - 提示词：注册表 + prompt-store（可编辑）
 * - 模型调用：现有 Provider（Gemini / OpenAI 兼容中转）
 * - Mastra Agent：仅 createMastraAgent，用于需要 tools 的高级场景
 *
 * ## 用法
 * - 任务型：runAgent / streamAgent
 * - 对话型：chat route 用 renderAgentSlot 取 system，再 streamText
 */

import { Agent } from '@mastra/core/agent'
import type { ToolsInput } from '@mastra/core/agent'
import { getLanguageModelAsync, getAIProviderAsync } from '@/lib/ai/providers'
import { requireAgentDefinition } from './registry'
import { getPromptContent, resolveAgentPrompts } from './prompt-store'
import { interpolatePrompt } from './prompt-utils'
import type { AgentRunRequest, AgentRunResult } from './types'

/** 创建 Mastra Agent 实例时的选项 */
export interface CreateAgentOptions {
  agentId: string
  modelOverride?: string
  /** 运行时插值变量（用于 instructions 模板） */
  variables?: Record<string, unknown>
  /** 拼在 system 提示词后的动态上下文 */
  contextAppend?: string
  tools?: ToolsInput
  temperature?: number
}

/**
 * 根据注册表 + 可编辑提示词创建 Mastra Agent 实例
 * 每次调用新建实例，避免跨请求状态污染
 *
 * 常规单轮任务优先用 {@link runAgent}，不必走 Mastra 层
 */
export async function createMastraAgent(options: CreateAgentOptions): Promise<{
  agent: Agent
  definition: ReturnType<typeof requireAgentDefinition>
  systemPrompt: string
}> {
  const definition = requireAgentDefinition(options.agentId)
  const { model } = await getLanguageModelAsync(options.modelOverride)

  const systemTemplate = await getPromptContent(definition, 'system')
  let systemPrompt = interpolatePrompt(systemTemplate, options.variables ?? {})

  if (options.contextAppend?.trim()) {
    systemPrompt = `${systemPrompt}\n\n${options.contextAppend.trim()}`
  }

  const agent = new Agent({
    id: definition.id,
    name: definition.name,
    description: definition.description,
    instructions: systemPrompt,
    // Provider 的 LanguageModel 与 Mastra 内部类型对齐通过 any 桥接
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

/**
 * 解析任务型 Agent 的 system + user 提示词（应用用户覆盖与变量插值）
 * 流式场景可与 Provider.streamGenerate 组合
 */
export async function resolveAgentPromptsForRun(request: AgentRunRequest): Promise<{
  systemPrompt: string
  userPrompt: string
  temperature: number
  definition: ReturnType<typeof requireAgentDefinition>
}> {
  const definition = requireAgentDefinition(request.agentId)
  const slots = await resolveAgentPrompts(definition)
  const variables = request.variables ?? {}

  const systemSlot = slots.find((s) => s.key === 'system')
  let systemPrompt = systemSlot
    ? interpolatePrompt(systemSlot.content, variables)
    : ''

  if (request.contextAppend?.trim()) {
    systemPrompt = systemPrompt
      ? `${systemPrompt}\n\n${request.contextAppend.trim()}`
      : request.contextAppend.trim()
  }

  const userSlot = slots.find((s) => s.key === 'user')
  let userPrompt = request.userMessage?.trim() || ''
  if (!userPrompt && userSlot) {
    userPrompt = interpolatePrompt(userSlot.content, variables)
  }
  if (!userPrompt) {
    throw new Error(`Agent ${request.agentId} 需要 userMessage 或 user 提示词槽位`)
  }

  return {
    systemPrompt,
    userPrompt,
    temperature: request.temperature ?? definition.temperature ?? 0.7,
    definition,
  }
}

/**
 * 任务型单轮运行：渲染提示词 → Provider.generate
 * @throws 生成失败或未知 Agent
 */
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
    agentId: request.agentId,
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
 * 流式运行任务型 Agent
 * - yield：增量文本块
 * - return：完整 {@link AgentRunResult}
 */
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
    agentId: request.agentId,
    text: fullText,
    systemPrompt: resolved.systemPrompt,
    userPrompt: resolved.userPrompt,
  }
}

/**
 * 渲染 Agent 某个 slot（用户覆盖 + 变量插值）
 * 常用于 chat system 或尚未完全迁到 runAgent 的调用点
 */
export async function renderAgentSlot(
  agentId: string,
  slotKey: string,
  variables: Record<string, unknown> = {}
): Promise<string> {
  const definition = requireAgentDefinition(agentId)
  const content = await getPromptContent(definition, slotKey)
  return interpolatePrompt(content, variables)
}
