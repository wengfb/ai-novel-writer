import { apiClient } from '../client'
import type { Project, CreateProjectParams } from '@/lib/store/project-store'

export interface ProjectStats {
  totalWords: number
  totalChapters: number
  totalCharacters: number
  totalWorldElements: number
}

/**
 * 项目 API 封装
 */
export const projectsApi = {
  /**
   * 获取项目列表
   */
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<{ projects: Project[]; total: number }>('/projects'),

  /**
   * 获取单个项目
   */
  get: (id: string) => apiClient.get<Project>(`/projects/${id}`),

  /**
   * 创建项目
   */
  create: (data: CreateProjectParams) =>
    apiClient.post<Project>('/projects', data),

  /**
   * 更新项目
   */
  update: (id: string, data: Partial<Project>) =>
    apiClient.put<Project>(`/projects/${id}`, data),

  /**
   * 删除项目
   */
  delete: (id: string) => apiClient.delete(`/projects/${id}`),

  /**
   * 获取项目统计
   */
  stats: (id: string) => apiClient.get<ProjectStats>(`/projects/${id}/stats`),
}
