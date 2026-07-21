/**
 * AI Agents 模块
 *
 * ## 职责
 * - 注册所有 AI 功能点（每个功能一个 Agent）
 * - 提示词默认值 + DB 可编辑覆盖
 * - 统一任务型调用入口（runAgent / streamAgent）
 *
 * ## 调用约定
 * - 业务代码禁止硬编码长 system/user 提示词
 * - 聊天：renderAgentSlot + AI SDK streamText（见 /api/ai/chat）
 * - 任务按钮：runAgent 或 streamAgent
 * - 多步编排：@/lib/ai/workflows
 *
 * ## 目录
 * - types / registry / prompt-store / runner
 * - definitions/catalog.ts — Agent 清单与默认提示词
 * - definitions/default-prompts.ts — 可复用 user 模板正文
 */

export type {
  AgentCategory,
  AgentCatalogItem,
  AgentDefinition,
  AgentRunRequest,
  AgentRunResult,
  PromptSlotDefinition,
  PromptVariableMeta,
  ResolvedPromptSlot,
} from './types'

export {
  getAgentDefinition,
  listAgentDefinitions,
  listAgentCatalog,
  getAgentCatalogItem,
  requireAgentDefinition,
} from './registry'

export {
  resolveAgentPrompts,
  getPromptContent,
  saveAgentPrompt,
  resetAgentPrompt,
  resetAllAgentPrompts,
  clearPromptCache,
  type SavePromptInput,
} from './prompt-store'

export {
  createMastraAgent,
  runAgent,
  renderAgentSlot,
  resolveAgentPromptsForRun,
  streamAgent,
  type CreateAgentOptions,
} from './runner'

export { interpolatePrompt, normalizePromptContent, type PromptVariables } from './prompt-utils'

/** Workflow 同域再导出，业务侧可只从 @/lib/ai/agents 引入 */
export {
  createChapterGenerationWorkflow,
  runChapterGenerationWorkflow,
  createBootstrapWorkflow,
  runBootstrapWorkflow,
} from '@/lib/ai/workflows'
