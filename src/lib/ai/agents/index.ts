/**
 * AI Agents 模块
 *
 * ## 职责
 * - 按领域注册 Agent（多 slot）；结构化任务 + 散文任务统一入口
 * - 提示词默认值 + DB 可编辑覆盖
 *
 * ## 调用约定
 * - 结构：runAgentObject + agents/schemas
 * - 散文：runAgent / streamAgent
 * - 聊天：renderAgentSlot + streamText + chat-tools
 */

export type {
  AgentCategory,
  AgentCatalogItem,
  AgentDefinition,
  AgentObjectResult,
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
  resolveAgentId,
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
  runAgentObject,
  renderAgentSlot,
  resolveAgentPromptsForRun,
  streamAgent,
  type CreateAgentOptions,
} from './runner'

export { interpolatePrompt, normalizePromptContent, type PromptVariables } from './prompt-utils'

export * from './schemas'

/** Workflow 同域再导出，业务侧可只从 @/lib/ai/agents 引入 */
export {
  createChapterGenerationWorkflow,
  runChapterGenerationWorkflow,
  createBootstrapWorkflow,
  runBootstrapWorkflow,
} from '@/lib/ai/workflows'
