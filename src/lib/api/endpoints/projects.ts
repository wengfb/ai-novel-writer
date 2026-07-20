import { apiClient } from '../client'
import type { Project, CreateProjectParams } from '@/types'

export interface ProjectStats {
  totalWords: number
  totalChapters: number
  totalCharacters: number
  totalWorldElements: number
}

export interface ProjectListResult {
  projects: Project[]
  total: number
  page?: number
  limit?: number
}

/**
 * 项目 API 封装
 */
export const projectsApi = {
  /**
   * 获取项目列表
   */
  list: (params?: { page?: number; limit?: number; status?: string }) => {
    const search = new URLSearchParams()
    if (params?.page) search.set('page', String(params.page))
    if (params?.limit) search.set('limit', String(params.limit))
    if (params?.status) search.set('status', params.status)
    const qs = search.toString()
    return apiClient.get<ProjectListResult>(`/projects${qs ? `?${qs}` : ''}`)
  },

  /**
   * 获取单个项目
   */
  get: (id: string) => apiClient.get<{ project: Project }>(`/projects/${id}`),

  /**
   * 创建项目
   */
  create: (data: CreateProjectParams) =>
    apiClient.post<{ project: Project }>('/projects', data),

  /**
   * 更新项目
   */
  update: (id: string, data: Partial<Project>) =>
    apiClient.put<{ project: Project }>(`/projects/${id}`, data),

  /**
   * 删除项目
   */
  delete: (id: string) => apiClient.delete(`/projects/${id}`),

  /**
   * 获取项目统计
   */
  stats: (id: string) => apiClient.get<ProjectStats>(`/projects/${id}/stats`),
}
