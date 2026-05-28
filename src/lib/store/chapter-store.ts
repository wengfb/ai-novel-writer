import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

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
  // 状态
  chapters: Chapter[]
  currentChapter: Chapter | null
  isLoading: boolean
  isSaving: boolean
  error: string | null
  lastSaved: Date | null
  lastFetchedProjectId: string | null

  // Actions
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
    // 初始状态
    chapters: [],
    currentChapter: null,
    isLoading: false,
    isSaving: false,
    error: null,
    lastSaved: null,
    lastFetchedProjectId: null,

    // 获取章节列表
    fetchChapters: async (projectId: string, force = false) => {
      const state = get()
      // 正在请求中，跳过并发重复
      if (state.isLoading) return
      // 同一项目已缓存，跳过（切换项目或强制刷新时不会命中）
      if (!force && state.lastFetchedProjectId === projectId) return

      set({ isLoading: true, error: null })
      try {
        const response = await fetch(`/api/projects/${projectId}/chapters`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error.message)
        }

        const chapters = data.data.chapters.map(normalizeChapter)
        // 强制刷新时同步更新 currentChapter 引用，避免与 chapters 数组中的对象不同步
        const currentChapter = get().currentChapter
        const syncedCurrent = currentChapter
          ? chapters.find((c: Chapter) => c.id === currentChapter.id) || currentChapter
          : null
        set({ chapters, currentChapter: syncedCurrent, isLoading: false, lastFetchedProjectId: projectId })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '获取章节列表失败',
          isLoading: false,
        })
      }
    },

    // 设置当前章节
    setCurrentChapter: (chapter) => {
      set({ currentChapter: chapter })
    },

    // 将章节添加到本地列表并设为当前（用于 AI 生成时立即显示）
    addChapterLocally: (chapter) => {
      set((state) => {
        const exists = state.chapters.some((c) => c.id === chapter.id)
        if (!exists) {
          state.chapters.push(chapter)
        }
        state.currentChapter = chapter
      })
    },

    // 从本地列表移除章节（AI 生成失败时清理）
    removeChapterLocally: (id) => {
      set((state) => {
        state.chapters = state.chapters.filter((c) => c.id !== id)
        if (state.currentChapter?.id === id) {
          state.currentChapter = null
        }
      })
    },

    // 更新章节内容（仅更新本地状态）
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

    // 保存章节
    saveChapter: async (id: string) => {
      set({ isSaving: true, error: null })
      try {
        const chapter = get().chapters.find((c) => c.id === id)
        if (!chapter) {
          throw new Error('章节不存在')
        }

        const response = await fetch(`/api/projects/${chapter.projectId}/chapters/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: chapter.content,
            wordCount: chapter.wordCount,
          }),
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error.message)
        }

        set({ isSaving: false, lastSaved: new Date() })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '保存章节失败',
          isSaving: false,
        })
        throw error
      }
    },

    // 创建章节
    createChapter: async (data) => {
      set({ isLoading: true, error: null })
      try {
        const { projectId, ...chapterData } = data
        const response = await fetch(`/api/projects/${projectId}/chapters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chapterData),
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error.message)
        }

        const newChapter = normalizeChapter(result.data.chapter)

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

    // 删除章节
    deleteChapter: async (projectId: string, id: string) => {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch(`/api/projects/${projectId}/chapters/${id}`, {
          method: 'DELETE',
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error.message)
        }

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

    // 清除错误
    clearError: () => {
      set({ error: null })
    },

    // 清空当前项目关联的章节状态
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
