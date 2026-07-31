import { apiClient } from '../client'
import type { AgentCatalogItem, AgentRunResult, ResolvedPromptSlot } from '@/lib/ai/agents'

export const agentsApi = {
  /** 列出全部 Agent 及提示词 */
  list: () => apiClient.get<{ agents: AgentCatalogItem[] }>('/ai/agents'),

  /** 获取单个 Agent */
  get: (agentId: string) =>
    apiClient.get<AgentCatalogItem>(`/ai/agents?id=${encodeURIComponent(agentId)}`),

  /** 保存提示词槽位 */
  savePrompt: (
    agentId: string,
    data: { slotKey: string; content: string; name?: string; description?: string }
  ) =>
    apiClient.put<{ slot: ResolvedPromptSlot; agent: AgentCatalogItem }>(
      `/ai/agents/${encodeURIComponent(agentId)}/prompts`,
      data
    ),

  /** 重置提示词：传 slot 则重置单槽，否则全部 */
  resetPrompt: (agentId: string, slotKey?: string) => {
    const qs = slotKey ? `?slot=${encodeURIComponent(slotKey)}` : ''
    return apiClient.delete<{
      slot?: ResolvedPromptSlot
      slots?: ResolvedPromptSlot[]
      agent: AgentCatalogItem
    }>(`/ai/agents/${encodeURIComponent(agentId)}/prompts${qs}`)
  },

  /** 保存 Agent 专属运行参数；空值回退到全局配置。 */
  saveRuntimeConfig: (
    agentId: string,
    data: { model?: string; temperature?: number | null; maxTokens?: number | null }
  ) => apiClient.put<{ agent: AgentCatalogItem }>(
    `/ai/agents/${encodeURIComponent(agentId)}/runtime`,
    data
  ),

  /** 任务型运行 */
  run: (body: {
    agentId: string
    model?: string
    variables?: Record<string, unknown>
    userMessage?: string
    contextAppend?: string
    temperature?: number
  }) => apiClient.post<AgentRunResult>('/ai/agents/run', body),
}
