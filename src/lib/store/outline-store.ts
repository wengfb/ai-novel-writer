import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { outlinesApi } from '@/lib/api/endpoints/outlines'

export interface Outline {
  id: string
  projectId: string
  type: 'volume' | 'chapter' | 'scene'
  order: number
  title: string
  description?: string | null
  targetWords?: number | null
  parentId?: string | null
  chapterId?: string | null
  status: 'planned' | 'writing' | 'completed'
  planningMode: 'full' | 'progressive'
  planningRange?: number | null
  isFlexible: boolean
  confidence: number
  emotionalGoal?: string | null
  plotFunction: '推进' | '转折' | '铺垫' | '高潮' | '过渡'
  tensionLevel: number
  chapter?: {
    id: string
    chapterNumber: number
    title: string
    wordCount: number
  }
  children?: Outline[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateOutlineParams {
  projectId: string
  type: 'volume' | 'chapter' | 'scene'
  parentId?: string
  order: number
  title: string
  description?: string
  targetWords?: number
  planningMode?: 'full' | 'progressive'
  planningRange?: number
  isFlexible?: boolean
  confidence?: number
  emotionalGoal?: string
  plotFunction?: '推进' | '转折' | '铺垫' | '高潮' | '过渡'
  tensionLevel?: number
}

interface OutlineState {
  outlines: Outline[]
  flatOutlines: Outline[]
  currentOutline: Outline | null
  isLoading: boolean
  error: string | null
  lastFetchedProjectId: string | null

  fetchOutlines: (projectId: string, force?: boolean) => Promise<void>
  setCurrentOutline: (outline: Outline | null) => void
  createOutline: (data: CreateOutlineParams) => Promise<Outline>
  updateOutline: (id: string, data: Partial<Outline>) => Promise<void>
  deleteOutline: (id: string) => Promise<void>
  clearError: () => void
}

export const useOutlineStore = create<OutlineState>()(
  immer((set, get) => ({
    outlines: [],
    flatOutlines: [],
    currentOutline: null,
    isLoading: false,
    error: null,
    lastFetchedProjectId: null,

    fetchOutlines: async (projectId: string, force = false) => {
      const state = get()
      if (state.isLoading) return
      if (!force && state.lastFetchedProjectId === projectId) return

      set({ isLoading: true, error: null })
      try {
        const res = await outlinesApi.list(projectId)
        set({
          outlines: res.data?.outlines ?? [],
          flatOutlines: res.data?.flat ?? [],
          isLoading: false,
          lastFetchedProjectId: projectId,
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '获取大纲列表失败',
          isLoading: false,
        })
      }
    },

    setCurrentOutline: (outline) => {
      set({ currentOutline: outline })
    },

    createOutline: async (data) => {
      set({ isLoading: true, error: null })
      try {
        const { projectId, ...outlineData } = data
        const res = await outlinesApi.create(projectId, outlineData)
        const newOutline = (res.data?.outline ?? res.data) as Outline

        await get().fetchOutlines(projectId, true)

        return newOutline
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '创建大纲失败',
          isLoading: false,
        })
        throw error
      }
    },

    updateOutline: async (id: string, data: Partial<Outline>) => {
      set({ isLoading: true, error: null })
      try {
        await outlinesApi.update(id, data)

        const projectId =
          get().outlines[0]?.projectId ||
          get().flatOutlines[0]?.projectId ||
          get().lastFetchedProjectId

        if (projectId) {
          await get().fetchOutlines(projectId, true)
        }

        set({ isLoading: false })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '更新大纲失败',
          isLoading: false,
        })
        throw error
      }
    },

    deleteOutline: async (id: string) => {
      set({ isLoading: true, error: null })
      try {
        await outlinesApi.delete(id)

        const projectId =
          get().outlines[0]?.projectId ||
          get().flatOutlines[0]?.projectId ||
          get().lastFetchedProjectId

        if (projectId) {
          await get().fetchOutlines(projectId, true)
        }

        set({ isLoading: false })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '删除大纲失败',
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
