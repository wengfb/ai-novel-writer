/**
 * Agent 注册表
 *
 * - 静态定义：definitions/catalog.ts
 * - 动态提示词：prompt-store（DB 覆盖）
 * - 对外清单：listAgentCatalog / getAgentCatalogItem（设置页、API）
 */

import type { AgentCatalogItem, AgentDefinition, ResolvedPromptSlot } from './types'
import {
  getAgentDefinition,
  listAgentDefinitions,
  resolveAgentRef,
  LEGACY_AGENT_MAP,
} from './definitions/catalog'
import { resolveAgentPrompts } from './prompt-store'

/**
 * 获取 Agent 定义；不存在则抛错
 * 支持旧 agentId（自动映射到合并后的 id）
 * @throws 未知 Agent
 */
export function requireAgentDefinition(agentId: string): AgentDefinition {
  const ref = resolveAgentRef(agentId)
  const def = getAgentDefinition(ref.agentId)
  if (!def) {
    throw new Error(`未知 Agent: ${agentId}`)
  }
  return def
}

/** 解析 agentId（含 legacy）为实际 id + 默认 slot */
export function resolveAgentId(agentId: string) {
  return resolveAgentRef(agentId)
}

/**
 * 列出全部 Agent，并附带解析后的提示词槽位
 * 用于设置页与 GET /api/ai/agents
 */
export async function listAgentCatalog(): Promise<AgentCatalogItem[]> {
  const defs = listAgentDefinitions()
  const items: AgentCatalogItem[] = []

  for (const def of defs) {
    const promptSlots = await resolveAgentPrompts(def)
    items.push(toCatalogItem(def, promptSlots))
  }

  return items
}

/**
 * 获取单个 Agent 目录项（含解析后提示词）
 * @throws 未知 Agent
 */
export async function getAgentCatalogItem(agentId: string): Promise<AgentCatalogItem> {
  const def = requireAgentDefinition(agentId)
  const promptSlots = await resolveAgentPrompts(def)
  return toCatalogItem(def, promptSlots)
}

/** 组装 API/UI 用的目录结构 */
function toCatalogItem(def: AgentDefinition, promptSlots: ResolvedPromptSlot[]): AgentCatalogItem {
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    category: def.category,
    chatCompatible: Boolean(def.chatCompatible),
    promptSlots,
  }
}

export { getAgentDefinition, listAgentDefinitions, resolveAgentRef, LEGACY_AGENT_MAP }
