import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { IdeaItem, IdeaComment } from '@/types'
import { ideasApi } from '@/lib/api/endpoints/ideas'

interface IdeaState {
  ideas: IdeaItem[]
  total: number
  page: number

  currentIdea: IdeaItem | null
  currentIdeaComments: IdeaComment[]

  isLoading: boolean
  isDetailLoading: boolean
  isGenerating: boolean
  error: string | null

  generatedCards: IdeaItem[]
  hasExamples: boolean
  positiveExampleCount: number
  negativeExampleCount: number

  fetchIdeas: (query?: Record<string, string>) => Promise<void>
  fetchIdea: (id: string) => Promise<void>
  saveIdea: (data: {
    title: string; genre: string; worldBuilding: string; protagonist: string
    coreConflict: string; mainGoal: string; highConcept: string; sublimation: string
    openingHook: string; status?: string; source?: string; aiGenerated?: boolean
  }) => Promise<IdeaItem | null>
  updateIdea: (id: string, data: Partial<{
    status: string; title: string; genre: string;
    worldBuilding: string; protagonist: string;
    coreConflict: string; mainGoal: string;
    highConcept: string; sublimation: string; openingHook: string;
    aiGenerated: boolean;
  }>) => Promise<void>
  deleteIdea: (id: string) => Promise<void>

  rateIdea: (id: string, score: number) => Promise<void>
  fetchComments: (id: string, page?: number) => Promise<void>
  addComment: (id: string, content: string) => Promise<void>

  generateIdeas: (prefs: {
    audience?: string; genre?: string; tone?: string; customRequirements?: string
    positiveExampleIds?: string[]; negativeExampleIds?: string[]
  }) => Promise<void>
  clearGeneratedCards: () => void

  setCurrentIdea: (idea: IdeaItem | null) => void
  clearError: () => void
}

/** 后端 Idea 原始字段（source 可能是 JSON 字符串） */
interface IdeaRaw {
  id: string
  title: string
  genre: string
  worldBuilding: string
  protagonist: string
  coreConflict: string
  mainGoal: string
  highConcept: string
  sublimation: string
  openingHook: string
  status?: IdeaItem['status']
  source?: string | IdeaItem['source']
  convertedToProjectId?: string | null
  rating?: number | null
  commentCount?: number
  aiGenerated?: boolean
  createdAt?: string
  updatedAt?: string
  ideaId?: string
}

function normalizeIdea(raw: IdeaRaw): IdeaItem {
  let source: IdeaItem['source']
  if (typeof raw.source === 'string') {
    try {
      source = JSON.parse(raw.source)
    } catch {
      source = undefined
    }
  } else {
    source = raw.source || undefined
  }

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
    source,
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

    fetchIdeas: async (query) => {
      const state = get()
      if (state.isLoading) return
      if (state.ideas.length > 0 && !query) return

      set({ isLoading: true, error: null })
      try {
        const res = await ideasApi.list(query)
        const ideas = (res.data?.ideas || []).map((item) => normalizeIdea(item as IdeaRaw))
        set({
          ideas,
          total: res.data?.total || 0,
          page: res.data?.page || 1,
          isLoading: false,
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '获取创意列表失败',
          isLoading: false,
        })
      }
    },

    fetchIdea: async (id) => {
      set({ isDetailLoading: true, error: null })
      try {
        const res = await ideasApi.get(id)
        const idea = normalizeIdea((res.data?.idea ?? res.data) as IdeaRaw)
        set({ currentIdea: idea, isDetailLoading: false })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '获取创意详情失败',
          isDetailLoading: false,
        })
      }
    },

    saveIdea: async (input) => {
      set({ error: null })
      try {
        const res = await ideasApi.create(input)
        const idea = normalizeIdea((res.data?.idea ?? res.data) as IdeaRaw)
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

    updateIdea: async (id, data) => {
      set({ error: null })
      try {
        const res = await ideasApi.update(id, data)
        const updated = normalizeIdea((res.data?.idea ?? res.data) as IdeaRaw)
        set((state) => {
          const idx = state.ideas.findIndex((i) => i.id === id)
          if (idx !== -1) state.ideas[idx] = updated
          if (state.currentIdea?.id === id) state.currentIdea = updated
        })
      } catch (error) {
        set({ error: error instanceof Error ? error.message : '更新创意失败' })
      }
    },

    deleteIdea: async (id) => {
      set({ error: null })
      try {
        await ideasApi.delete(id)
        set((state) => {
          state.ideas = state.ideas.filter((i) => i.id !== id)
          state.total -= 1
          if (state.currentIdea?.id === id) state.currentIdea = null
        })
      } catch (error) {
        set({ error: error instanceof Error ? error.message : '删除创意失败' })
      }
    },

    rateIdea: async (id, score) => {
      set({ error: null })
      try {
        const res = await ideasApi.rate(id, score)
        const rating = res.data?.rating ?? score
        set((state) => {
          const idx = state.ideas.findIndex((i) => i.id === id)
          if (idx !== -1) {
            state.ideas[idx].rating = rating
          }
          if (state.currentIdea?.id === id) {
            state.currentIdea.rating = rating
          }
        })
      } catch (error) {
        set({ error: error instanceof Error ? error.message : '评分失败' })
      }
    },

    fetchComments: async (id, page = 1) => {
      set({ error: null })
      try {
        const res = await ideasApi.listComments(id, page)
        set({ currentIdeaComments: res.data?.comments || [] })
      } catch (error) {
        set({ error: error instanceof Error ? error.message : '获取评论失败' })
      }
    },

    addComment: async (id, content) => {
      set({ error: null })
      try {
        const res = await ideasApi.addComment(id, content)
        const comment = res.data?.comment
        if (!comment) return

        set((state) => {
          state.currentIdeaComments.unshift(comment)
          const idx = state.ideas.findIndex((i) => i.id === id)
          if (idx !== -1) state.ideas[idx].commentCount += 1
          if (state.currentIdea?.id === id) state.currentIdea.commentCount += 1
        })
      } catch (error) {
        set({ error: error instanceof Error ? error.message : '添加评论失败' })
      }
    },

    generateIdeas: async (prefs) => {
      set({ isGenerating: true, error: null })
      try {
        const res = await ideasApi.generate(prefs)
        const cards = res.data?.cards || []

        const ideas: IdeaItem[] = cards.map((card) =>
          normalizeIdea({
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
            status: 'draft',
            rating: null,
            commentCount: 0,
            aiGenerated: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        )

        set({
          generatedCards: ideas,
          hasExamples: res.data?.hasExamples || false,
          positiveExampleCount: res.data?.positiveExampleCount || 0,
          negativeExampleCount: res.data?.negativeExampleCount || 0,
          isGenerating: false,
        })

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
