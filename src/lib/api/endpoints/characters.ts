import { apiClient } from '../client'
import type { Character, CreateCharacterParams } from '@/lib/store/character-store'

/**
 * 角色 API 封装
 */
export const charactersApi = {
  /**
   * 获取角色列表
   */
  list: (projectId: string) =>
    apiClient.get<{ characters: Character[] }>(`/projects/${projectId}/characters`),

  /**
   * 获取单个角色
   */
  get: (id: string) => apiClient.get<Character>(`/characters/${id}`),

  /**
   * 创建角色
   */
  create: (data: CreateCharacterParams) =>
    apiClient.post<Character>('/characters', data),

  /**
   * 更新角色
   */
  update: (id: string, data: Partial<Character>) =>
    apiClient.put<Character>(`/characters/${id}`, data),

  /**
   * 删除角色
   */
  delete: (id: string) => apiClient.delete(`/characters/${id}`),
}
