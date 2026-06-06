import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { IdeaItem, IdeaComment } from '@/types'

interface IdeaState {
  // 列表数据
  ideas: IdeaItem[]
  total: number
  page: number

  // 当前选中
  currentIdea: IdeaItem | null
  currentIdeaComments: IdeaComment[]

  // 状态
  isLoading: boolean
  isDetailLoading: boolean
  isGenerating: boolean
  error: string | null

  // 生成结果（临时存储，未保存到列表的生成结果）
  generatedCards: IdeaItem[]
  hasExamples: boolean
  positiveExampleCount: number
  negativeExampleCount: number

  // Actions — 列表
  fetchIdeas: (query?: Record<string, string>) => Promise<void>
  fetchIdea: (id: string) => Promise<void>
  saveIdea: (data: {
    title: string; genre: string; worldBuilding: string; protagonist: string
    coreConflict: string; mainGoal: string; highConcept: string; sublimation: string
    openingHook: string; status?: string; source?: string; aiGenerated?: boolean
  }) => Promise<IdeaItem | null>
  updateIdea: (id: string, data: { status?: string; title?: string }) => Promise<void>
  deleteIdea: (id: string) => Promise<void>

  // Actions — 评分和评论
  rateIdea: (id: string, score: number) => Promise<void>
  fetchComments: (id: string, page?: number) => Promise<void>
  addComment: (id: string, content: string) => Promise<void>

  // Actions — 生成
  generateIdeas: (prefs: {
    audience?: string; genre?: string; tone?: string; customRequirements?: string
    positiveExampleIds?: string[]; negativeExampleIds?: string[]
  }) => Promise<void>
  clearGeneratedCards: () => void

  // Actions — 设置当前创意
  setCurrentIdea: (idea: IdeaItem | null) => void

  // 状态清理
  clearError: () => void
}

function normalizeIdea(raw: any): IdeaItem {
  return {
    id: raw.id,
    title: raw.title,
    genre: raw.genre,
    worldBuilding: raw.worldBuilding,
    protagonist: raw.protagonist,
    coreConflict: raw.coreConflict,
    mainGoal: raw.mainGoal,
    highConcept: raw.highConcept,
    sublimation: raw.sublimation,
    openingHook: raw.openingHook,
    status: raw.status || 'draft',
    source: typeof raw.source === 'string' ? JSON.parse(raw.source) : raw.source || undefined,
    convertedToProjectId: raw.convertedToProjectId || undefined,
    rating: raw.rating ?? null,
    commentCount: raw.commentCount || 0,
    aiGenerated: raw.aiGenerated ?? true,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  }
}

export const useIdeaStore = create<IdeaState>()(
  immer((set, get) => ({
    // 初始状态
    ideas: [],
    total: 0,
    page: 1,
    currentIdea: null,
    currentIdeaComments: [],
    isLoading: false,
    isGenerating: false,
    isDetailLoading: false,
    error: null,
    generatedCards: [],
    hasExamples: false,
    positiveExampleCount: 0,
    negativeExampleCount: 0,

    // 获取创意列表
    fetchIdeas: async (query) => {
      const state = get()
      if (state.isLoading) return
      // 已有数据则不重复请求，除非显式 refetch
      if (state.ideas.length > 0 && !query) return

      set({ isLoading: true, error: null })
      try {
        const params = new URLSearchParams(query || {})
        const response = await fetch(`/api/ideas?${params.toString()}`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error?.message || '获取创意列表失败')
        }

        const ideas = (data.data.ideas || []).map(normalizeIdea)
        set({
          ideas,
          total: data.data.total || 0,
          page: data.data.page || 1,
          isLoading: false,
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '获取创意列表失败',
          isLoading: false,
        })
      }
    },

    // 获取单个创意详情
    fetchIdea: async (id) => {
      set({ isDetailLoading: true, error: null })
      try {
        const response = await fetch(`/api/ideas/${id}`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error?.message || '获取创意详情失败')
        }

        const idea = normalizeIdea(data.data.idea)
        set({ currentIdea: idea, isDetailLoading: false })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '获取创意详情失败',
          isDetailLoading: false,
        })
      }
    },

    // 手动保存创意
    saveIdea: async (input) => {
      set({ error: null })
      try {
        const response = await fetch('/api/ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error?.message || '保存创意失败')
        }

        const idea = normalizeIdea(result.data.idea)
        set((state) => {
          state.ideas.unshift(idea)
          state.total += 1
        })
        return idea
      } catch (error) {
        set({ error: error instanceof Error ? error.message : '保存创意失败' })
        return null
      }
    },

    // 更新创意
    updateIdea: async (id, data) => {
      set({ error: null })
      try {
        const response = await fetch(`/api/ideas/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error?.message || '更新创意失败')
        }

        const updated = normalizeIdea(result.data.idea)
        set((state) => {
          const idx = state.ideas.findIndex((i) => i.id === id)
          if (idx !== -1) state.ideas[idx] = updated
          if (state.currentIdea?.id === id) state.currentIdea = updated
        })
      } catch (error) {
        set({ error: error instanceof Error ? error.message : '更新创意失败' })
      }
    },

    // 删除创意
    deleteIdea: async (id) => {
      set({ error: null })
      try {
        const response = await fetch(`/api/ideas/${id}`, {
          method: 'DELETE',
        })
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error?.message || '删除创意失败')
        }

        set((state) => {
          state.ideas = state.ideas.filter((i) => i.id !== id)
          state.total -= 1
          if (state.currentIdea?.id === id) state.currentIdea = null
        })
      } catch (error) {
        set({ error: error instanceof Error ? error.message : '删除创意失败' })
      }
    },

    // 评分
    rateIdea: async (id, score) => {
      set({ error: null })
      try {
        const response = await fetch(`/api/ideas/${id}/rate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score }),
        })
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error?.message || '评分失败')
        }

        set((state) => {
          const idx = state.ideas.findIndex((i) => i.id === id)
          if (idx !== -1) {
            state.ideas[idx].rating = result.data.rating
          }
          if (state.currentIdea?.id === id) {
            state.currentIdea.rating = result.data.rating
          }
        })
      } catch (error) {
        set({ error: error instanceof Error ? error.message : '评分失败' })
      }
    },

    // 获取评论
    fetchComments: async (id, page = 1) => {
      set({ error: null })
      try {
        const response = await fetch(`/api/ideas/${id}/comments?page=${page}&limit=20`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error?.message || '获取评论失败')
        }

        set({ currentIdeaComments: data.data.comments || [] })
      } catch (error) {
        set({ error: error instanceof Error ? error.message : '获取评论失败' })
      }
    },

    // 添加评论
    addComment: async (id, content) => {
      set({ error: null })
      try {
        const response = await fetch(`/api/ideas/${id}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        })
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error?.message || '添加评论失败')
        }

        set((state) => {
          state.currentIdeaComments.unshift(result.data.comment)
          const idx = state.ideas.findIndex((i) => i.id === id)
          if (idx !== -1) state.ideas[idx].commentCount += 1
          if (state.currentIdea?.id === id) state.currentIdea.commentCount += 1
        })
      } catch (error) {
        set({ error: error instanceof Error ? error.message : '添加评论失败' })
      }
    },

    // 生成新创意（调用 enhanced random-story-idea）
    generateIdeas: async (prefs) => {
      set({ isGenerating: true, error: null })
      try {
        const response = await fetch('/api/ai/random-story-idea', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...prefs,
            saveToIdeas: true,
          }),
        })
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error?.message || '生成创意失败')
        }

        const cards = data.data.cards || []

        // 将生成的卡片转为 IdeaItem 格式
        const ideas: IdeaItem[] = cards.map((card: any) => ({
          id: card.ideaId || card.id,
          title: card.title,
          genre: card.genre,
          worldBuilding: card.worldBuilding,
          protagonist: card.protagonist,
          coreConflict: card.coreConflict,
          mainGoal: card.mainGoal,
          highConcept: card.highConcept,
          sublimation: card.sublimation,
          openingHook: card.openingHook,
          status: 'draft' as const,
          rating: null,
          commentCount: 0,
          aiGenerated: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))

        set({
          generatedCards: ideas,
          hasExamples: data.data.hasExamples || false,
          positiveExampleCount: data.data.positiveExampleCount || 0,
          negativeExampleCount: data.data.negativeExampleCount || 0,
          isGenerating: false,
        })

        // 同时追加到列表
        set((state) => {
          for (const idea of ideas) {
            state.ideas.unshift(idea)
          }
          state.total += ideas.length
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '生成创意失败',
          isGenerating: false,
        })
      }
    },

    clearGeneratedCards: () => {
      set({ generatedCards: [], hasExamples: false, positiveExampleCount: 0, negativeExampleCount: 0 })
    },

    setCurrentIdea: (idea) => {
      set({ currentIdea: idea })
    },

    clearError: () => {
      set({ error: null })
    },
  }))
)
