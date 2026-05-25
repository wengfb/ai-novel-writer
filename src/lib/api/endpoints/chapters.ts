import { apiClient } from '../client'
import type { Chapter, CreateChapterParams } from '@/lib/store/chapter-store'

/**
 * 章节 API 封装
 */
export const chaptersApi = {
  /**
   * 获取章节列表
   */
  list: (projectId: string) =>
    apiClient.get<{ chapters: Chapter[] }>(`/projects/${projectId}/chapters`),

  /**
   * 获取单个章节
   */
  get: (id: string) => apiClient.get<Chapter>(`/chapters/${id}`),

  /**
   * 创建章节
   */
  create: (projectId: string, data: Omit<CreateChapterParams, 'projectId'>) =>
    apiClient.post<Chapter>(`/projects/${projectId}/chapters`, data),

  /**
   * 更新章节
   */
  update: (id: string, data: Partial<Chapter>) =>
    apiClient.put<Chapter>(`/chapters/${id}`, data),

  /**
   * 删除章节
   */
  delete: (projectId: string, id: string) =>
    apiClient.delete(`/projects/${projectId}/chapters/${id}`),
}
