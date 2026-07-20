import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { chaptersApi } from '@/lib/api/endpoints/chapters'

export interface Chapter {
  id: string
  projectId: string
  chapterNumber: number
  title: string
  content: string
  wordCount: number
  status: 'draft' | 'writing' | 'completed'
  createdAt: Date
  updatedAt: Date
}

export interface CreateChapterParams {
  projectId: string
  title: string
  chapterNumber?: number
  content?: string
}

type ChapterResponse = Omit<Partial<Chapter>, 'createdAt' | 'updatedAt'> & {
  id: string
  projectId: string
  chapterNumber: number
  title: string
  content?: string | null
  wordCount?: number
  status?: Chapter['status']
  createdAt: string | Date
  updatedAt: string | Date
}

function normalizeChapter(chapter: ChapterResponse): Chapter {
  return {
    id: chapter.id,
    projectId: chapter.projectId,
    chapterNumber: chapter.chapterNumber,
    title: chapter.title,
    content: chapter.content ?? '',
    wordCount: chapter.wordCount ?? 0,
    status: chapter.status ?? 'draft',
    createdAt: new Date(chapter.createdAt),
    updatedAt: new Date(chapter.updatedAt),
  }
}

interface ChapterState {
  chapters: Chapter[]
  currentChapter: Chapter | null
  isLoading: boolean
  isSaving: boolean
  error: string | null
  lastSaved: Date | null
  lastFetchedProjectId: string | null

  fetchChapters: (projectId: string, force?: boolean) => Promise<void>
  setCurrentChapter: (chapter: Chapter | null) => void
  addChapterLocally: (chapter: Chapter) => void
  removeChapterLocally: (id: string) => void
  updateChapterContent: (id: string, content: string) => void
  saveChapter: (id: string) => Promise<void>
  createChapter: (data: CreateChapterParams) => Promise<Chapter>
  deleteChapter: (projectId: string, id: string) => Promise<void>
  clearProjectContext: () => void
  clearError: () => void
}

export const useChapterStore = create<ChapterState>()(
  immer((set, get) => ({
    chapters: [],
    currentChapter: null,
    isLoading: false,
    isSaving: false,
    error: null,
    lastSaved: null,
    lastFetchedProjectId: null,

    fetchChapters: async (projectId: string, force = false) => {
      const state = get()
      if (state.isLoading) return
      if (!force && state.lastFetchedProjectId === projectId) return

      set({ isLoading: true, error: null })
      try {
        const res = await chaptersApi.list(projectId)
        const chapters = (res.data?.chapters ?? []).map((c) =>
          normalizeChapter(c as ChapterResponse)
        )
        const currentChapter = get().currentChapter
        const syncedCurrent = currentChapter
          ? chapters.find((c) => c.id === currentChapter.id) || currentChapter
          : null
        set({
          chapters,
          currentChapter: syncedCurrent,
          isLoading: false,
          lastFetchedProjectId: projectId,
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '获取章节列表失败',
          isLoading: false,
        })
      }
    },

    setCurrentChapter: (chapter) => {
      set({ currentChapter: chapter })
    },

    addChapterLocally: (chapter) => {
      set((state) => {
        const exists = state.chapters.some((c) => c.id === chapter.id)
        if (!exists) {
          state.chapters.push(chapter)
        }
        state.currentChapter = chapter
      })
    },

    removeChapterLocally: (id) => {
      set((state) => {
        state.chapters = state.chapters.filter((c) => c.id !== id)
        if (state.currentChapter?.id === id) {
          state.currentChapter = null
        }
      })
    },

    updateChapterContent: (id, content) => {
      set((state) => {
        const chapter = state.chapters.find((c) => c.id === id)
        if (chapter) {
          chapter.content = content
          chapter.wordCount = content.replace(/<[^>]*>/g, '').length
        }
        if (state.currentChapter?.id === id) {
          state.currentChapter.content = content
          state.currentChapter.wordCount = content.replace(/<[^>]*>/g, '').length
        }
      })
    },

    saveChapter: async (id: string) => {
      set({ isSaving: true, error: null })
      try {
        const chapter = get().chapters.find((c) => c.id === id)
        if (!chapter) {
          throw new Error('章节不存在')
        }

        await chaptersApi.update(chapter.projectId, id, {
          content: chapter.content,
          wordCount: chapter.wordCount,
        })

        set({ isSaving: false, lastSaved: new Date() })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '保存章节失败',
          isSaving: false,
        })
        throw error
      }
    },

    createChapter: async (data) => {
      set({ isLoading: true, error: null })
      try {
        const { projectId, ...chapterData } = data
        const res = await chaptersApi.create(projectId, chapterData)
        const newChapter = normalizeChapter(
          (res.data?.chapter ?? res.data) as ChapterResponse
        )

        set((state) => {
          state.chapters.push(newChapter)
          state.currentChapter = newChapter
          state.isLoading = false
        })

        return newChapter
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '创建章节失败',
          isLoading: false,
        })
        throw error
      }
    },

    deleteChapter: async (projectId: string, id: string) => {
      set({ isLoading: true, error: null })
      try {
        await chaptersApi.delete(projectId, id)

        set((state) => {
          state.chapters = state.chapters.filter((c) => c.id !== id)
          if (state.currentChapter?.id === id) {
            state.currentChapter = null
          }
          state.isLoading = false
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '删除章节失败',
          isLoading: false,
        })
        throw error
      }
    },

    clearError: () => {
      set({ error: null })
    },

    clearProjectContext: () => {
      set({
        chapters: [],
        currentChapter: null,
        isLoading: false,
        isSaving: false,
        error: null,
        lastSaved: null,
        lastFetchedProjectId: null,
      })
    },
  }))
)
