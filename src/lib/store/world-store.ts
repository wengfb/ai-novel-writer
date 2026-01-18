import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export interface WorldElement {
  id: string
  projectId: string
  name: string
  type: 'location' | 'organization' | 'item' | 'concept' | 'other'
  description: string
  importance: number
  scope: 'global' | 'regional' | 'local'
  parentId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateWorldElementParams {
  projectId: string
  name: string
  type: 'location' | 'organization' | 'item' | 'concept' | 'other'
  description: string
  importance?: number
  scope?: 'global' | 'regional' | 'local'
  parentId?: string
}

interface WorldState {
  worldElements: WorldElement[]
  isLoading: boolean
  error: string | null

  fetchWorldElements: (projectId: string) => Promise<void>
  createWorldElement: (data: CreateWorldElementParams) => Promise<WorldElement>
  updateWorldElement: (id: string, data: Partial<WorldElement>) => Promise<void>
  deleteWorldElement: (id: string) => Promise<void>
  clearError: () => void
}

export const useWorldStore = create<WorldState>()(
  immer((set) => ({
    worldElements: [],
    isLoading: false,
    error: null,

    fetchWorldElements: async (projectId: string) => {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch(`/api/projects/${projectId}/world-elements`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error.message)
        }

        set({ worldElements: data.data.worldElements, isLoading: false })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '获取世界观列表失败',
          isLoading: false,
        })
      }
    },

    createWorldElement: async (data) => {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch('/api/world-elements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error.message)
        }

        const newElement = result.data

        set((state) => {
          state.worldElements.push(newElement)
          state.isLoading = false
        })

        return newElement
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '创建世界观元素失败',
          isLoading: false,
        })
        throw error
      }
    },

    updateWorldElement: async (id, data) => {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch(`/api/world-elements/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error.message)
        }

        const updatedElement = result.data

        set((state) => {
          const index = state.worldElements.findIndex((e) => e.id === id)
          if (index !== -1) {
            state.worldElements[index] = updatedElement
          }
          state.isLoading = false
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '更新世界观元素失败',
          isLoading: false,
        })
        throw error
      }
    },

    deleteWorldElement: async (id) => {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch(`/api/world-elements/${id}`, {
          method: 'DELETE',
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error.message)
        }

        set((state) => {
          state.worldElements = state.worldElements.filter((e) => e.id !== id)
          state.isLoading = false
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '删除世界观元素失败',
          isLoading: false,
        })
        throw error
      }
    },

    clearError: () => {
      set({ error: null })
    },
  }))
)
