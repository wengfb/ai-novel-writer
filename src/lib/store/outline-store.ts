import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

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
  // 状态
  outlines: Outline[]           // 树形结构的大纲列表
  flatOutlines: Outline[]       // 扁平化列表（用于父节点选择）
  currentOutline: Outline | null
  isLoading: boolean
  error: string | null
  lastFetchedProjectId: string | null

  // Actions
  fetchOutlines: (projectId: string, force?: boolean) => Promise<void>
  setCurrentOutline: (outline: Outline | null) => void
  createOutline: (data: CreateOutlineParams) => Promise<Outline>
  updateOutline: (id: string, data: Partial<Outline>) => Promise<void>
  deleteOutline: (id: string) => Promise<void>
  clearError: () => void
}

export const useOutlineStore = create<OutlineState>()(
  immer((set, get) => ({
    // 初始状态
    outlines: [],
    flatOutlines: [],
    currentOutline: null,
    isLoading: false,
    error: null,
    lastFetchedProjectId: null,

    // 获取大纲列表
    fetchOutlines: async (projectId: string, force = false) => {
      const state = get()

      // 正在请求中，直接拦截
      if (state.isLoading) return

      // 非强制刷新且已缓存同一项目数据，跳过
      if (!force && state.lastFetchedProjectId === projectId) return

      set({ isLoading: true, error: null })
      try {
        const response = await fetch(`/api/projects/${projectId}/outlines`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error.message)
        }

        set({
          outlines: data.data.outlines,
          flatOutlines: data.data.flat,
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

    // 设置当前大纲
    setCurrentOutline: (outline) => {
      set({ currentOutline: outline })
    },

    // 创建大纲
    createOutline: async (data) => {
      set({ isLoading: true, error: null })
      try {
        const { projectId, ...outlineData } = data
        const response = await fetch(`/api/projects/${projectId}/outlines`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(outlineData),
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error.message)
        }

        const newOutline = result.data.outline

        // 重新获取列表以更新树形结构
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

    // 更新大纲
    updateOutline: async (id: string, data: Partial<Outline>) => {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch(`/api/outlines/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error.message)
        }

        const updatedOutline = result.data.outline

        // 重新获取列表以更新树形结构
        const { outlines } = get()
        if (outlines.length > 0) {
          await get().fetchOutlines(outlines[0].projectId)
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

    // 删除大纲
    deleteOutline: async (id: string) => {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch(`/api/outlines/${id}`, {
          method: 'DELETE',
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error.message)
        }

        // 重新获取列表以更新树形结构
        const { outlines } = get()
        if (outlines.length > 0) {
          await get().fetchOutlines(outlines[0].projectId)
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

    // 清除错误
    clearError: () => {
      set({ error: null })
    },
  }))
)
