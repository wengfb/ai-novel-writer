import { apiClient } from '../client'
import type { IdeaItem, IdeaComment, StoryIdeaCard } from '@/types'

export interface IdeaListParams {
  page?: number
  limit?: number
  status?: string
  genre?: string
  sortBy?: string
  sortOrder?: string
  aiGenerated?: boolean
}

export interface IdeaListResult {
  ideas: IdeaItem[]
  total: number
  page: number
  limit: number
}

export interface CreateIdeaInput {
  title: string
  genre: string
  worldBuilding: string
  protagonist: string
  coreConflict: string
  mainGoal: string
  highConcept: string
  sublimation: string
  openingHook: string
  status?: string
  source?: string
  aiGenerated?: boolean
}

export interface UpdateIdeaInput {
  status?: string
  title?: string
  genre?: string
  worldBuilding?: string
  protagonist?: string
  coreConflict?: string
  mainGoal?: string
  highConcept?: string
  sublimation?: string
  openingHook?: string
  aiGenerated?: boolean
  convertedToProjectId?: string | null
}

export interface GenerateIdeasInput {
  audience?: string
  genre?: string
  tone?: string
  customRequirements?: string
  positiveExampleIds?: string[]
  negativeExampleIds?: string[]
  saveToIdeas?: boolean
}

export interface GenerateIdeasResult {
  cards: Array<StoryIdeaCard & { ideaId?: string }>
  hasExamples?: boolean
  positiveExampleCount?: number
  negativeExampleCount?: number
}

/**
 * 创意中心 API 封装
 */
export const ideasApi = {
  list: (params?: IdeaListParams) => {
    const search = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          search.set(key, String(value))
        }
      })
    }
    const qs = search.toString()
    return apiClient.get<IdeaListResult>(`/ideas${qs ? `?${qs}` : ''}`)
  },

  get: (id: string) => apiClient.get<{ idea: IdeaItem }>(`/ideas/${id}`),

  create: (data: CreateIdeaInput) =>
    apiClient.post<{ idea: IdeaItem }>('/ideas', data),

  update: (id: string, data: UpdateIdeaInput) =>
    apiClient.request<{ idea: IdeaItem }>(`/ideas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiClient.delete<{ deleted: boolean }>(`/ideas/${id}`),

  rate: (id: string, score: number) =>
    apiClient.post<{ rating: number }>(`/ideas/${id}/rate`, { score }),

  listComments: (id: string, page = 1, limit = 20) =>
    apiClient.get<{ comments: IdeaComment[] }>(
      `/ideas/${id}/comments?page=${page}&limit=${limit}`
    ),

  addComment: (id: string, content: string) =>
    apiClient.post<{ comment: IdeaComment }>(`/ideas/${id}/comments`, { content }),

  convert: (id: string, data?: Record<string, unknown>) =>
    apiClient.post<{ projectId: string }>(`/ideas/${id}/convert`, data ?? {}),

  generate: (prefs: GenerateIdeasInput) =>
    apiClient.post<GenerateIdeasResult>('/ai/random-story-idea', {
      ...prefs,
      saveToIdeas: prefs.saveToIdeas ?? true,
    }),
}
