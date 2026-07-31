/**
 * AI Chat 工具集
 * 按领域拆分为 character / world / chapter / outline / foreshadowing / project / consistency
 */
import type { ChatToolOptions } from './types'
import { createCharacterTools } from './character-tools'
import { createWorldTools } from './world-tools'
import { createChapterTools } from './chapter-tools'
import { createOutlineTools } from './outline-tools'
import { createForeshadowingTools } from './foreshadowing-tools'
import { createProjectTools } from './project-tools'
import { createConsistencyTools } from './consistency-tools'
import { getAllowedChatTools } from './permissions'

export type { ChatToolOptions } from './types'

export interface BuildChatToolsOptions extends ChatToolOptions {
  agentId?: string
  scopeType?: import('@/lib/ai/agent-workspace').AssistantScopeType
}

/** 根据当前 Agent 与参考作用域组装最小工具集。 */
export function buildChatTools({ agentId = 'studio-chat', scopeType, ...options }: BuildChatToolsOptions) {
  const allTools = {
    ...createCharacterTools(options),
    ...createWorldTools(options),
    ...createChapterTools(options),
    ...createProjectTools(options),
    ...createOutlineTools(options),
    ...createForeshadowingTools(options),
    ...createConsistencyTools(options),
  }
  const allowed = new Set(getAllowedChatTools(agentId, scopeType))
  return Object.fromEntries(Object.entries(allTools).filter(([name]) => allowed.has(name)))
}
