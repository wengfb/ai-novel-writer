import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { worldElementsApi } from '@/lib/api/endpoints/world-elements'

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
  loadedProjectId: string | null
  loadingProjectId: string | null
  error: string | null

  fetchWorldElements: (projectId: string, force?: boolean) => Promise<void>
  createWorldElement: (data: CreateWorldElementParams) => Promise<WorldElement>
  updateWorldElement: (id: string, data: Partial<WorldElement>) => Promise<void>
  deleteWorldElement: (id: string) => Promise<void>
  clearError: () => void
}

export const useWorldStore = create<WorldState>()(
  immer((set, get) => ({
    worldElements: [],
    isLoading: false,
    loadedProjectId: null,
    loadingProjectId: null,
    error: null,

    fetchWorldElements: async (projectId, force = false) => {
      const { loadedProjectId, loadingProjectId } = get()
      if (!force && (loadedProjectId === projectId || loadingProjectId === projectId)) return

      set({ isLoading: true, loadingProjectId: projectId, error: null })
      try {
        const res = await worldElementsApi.list(projectId)
        set({
          worldElements: res.data?.elements ?? [],
          isLoading: false,
          loadedProjectId: projectId,
          loadingProjectId: null,
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '获取世界观列表失败',
          isLoading: false,
          loadingProjectId: null,
        })
      }
    },

    createWorldElement: async (data) => {
      set({ isLoading: true, error: null })
      try {
        const res = await worldElementsApi.create(data)
        const newElement = (res.data?.worldElement ?? res.data) as WorldElement

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
        const res = await worldElementsApi.update(id, data)
        const updatedElement = (res.data?.element ?? res.data) as WorldElement

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
        await worldElementsApi.delete(id)

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
