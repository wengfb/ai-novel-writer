/**
 * 模型列表 / 连通性测试 API
 */

import { apiClient } from '../client'

export interface ModelOption {
  id: string
  name: string
}

export interface ModelTestData {
  ok: boolean
  provider: string
  model: string
  response: string
}

export const aiModelsApi = {
  list: () =>
    apiClient.post<{ models: ModelOption[]; provider: string }>('/ai/models', {
      action: 'list',
    }),

  test: (input?: { model?: string; agentId?: string }) =>
    apiClient.post<ModelTestData>('/ai/models', {
      action: 'test',
      model: input?.model || undefined,
      agentId: input?.agentId || undefined,
    }),
}
