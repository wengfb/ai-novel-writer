import { apiClient } from '../client'
import type { WorldElement, CreateWorldElementParams } from '@/lib/store/world-store'

/**
 * 世界观 API 封装
 */
export const worldElementsApi = {
  /**
   * 获取世界观元素列表
   */
  list: (projectId: string) =>
    apiClient.get<{ worldElements: WorldElement[] }>(`/projects/${projectId}/world-elements`),

  /**
   * 获取单个世界观元素
   */
  get: (id: string) => apiClient.get<WorldElement>(`/world-elements/${id}`),

  /**
   * 创建世界观元素
   */
  create: (data: CreateWorldElementParams) =>
    apiClient.post<WorldElement>('/world-elements', data),

  /**
   * 更新世界观元素
   */
  update: (id: string, data: Partial<WorldElement>) =>
    apiClient.put<WorldElement>(`/world-elements/${id}`, data),

  /**
   * 删除世界观元素
   */
  delete: (id: string) => apiClient.delete(`/world-elements/${id}`),
}
