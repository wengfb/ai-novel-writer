import { apiClient } from '../client'
import type { Outline, CreateOutlineParams } from '@/lib/store/outline-store'

/**
 * 大纲 API 封装
 */
export const outlinesApi = {
  /**
   * 获取大纲列表（树形结构）
   */
  list: (projectId: string) =>
    apiClient.get<{ outlines: Outline[], flat: Outline[] }>(`/projects/${projectId}/outlines`),

  /**
   * 获取单个大纲节点
   */
  get: (id: string) => apiClient.get<Outline>(`/outlines/${id}`),

  /**
   * 创建大纲节点
   */
  create: (projectId: string, data: Omit<CreateOutlineParams, 'projectId'>) =>
    apiClient.post<Outline>(`/projects/${projectId}/outlines`, data),

  /**
   * 更新大纲节点
   */
  update: (id: string, data: Partial<Outline>) =>
    apiClient.put<Outline>(`/outlines/${id}`, data),

  /**
   * 删除大纲节点（级联删除子节点）
   */
  delete: (id: string) => apiClient.delete(`/outlines/${id}`),
}
