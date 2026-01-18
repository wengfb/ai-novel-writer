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

interface ChapterState {
  // 状态
  chapters: Chapter[]
  currentChapter: Chapter | null
  isLoading: boolean
  isSaving: boolean
  error: string | null
  lastSaved: Date | null

  // Actions
  fetchChapters: (projectId: string) => Promise<void>
  setCurrentChapter: (chapter: Chapter | null) => void
  updateChapterContent: (id: string, content: string) => void
  saveChapter: (id: string) => Promise<void>
  createChapter: (data: CreateChapterParams) => Promise<Chapter>
  deleteChapter: (id: string) => Promise<void>
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

    // 获取章节列表
    fetchChapters: async (projectId: string) => {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch(`/api/projects/${projectId}/chapters`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error.message)
        }

        set({ chapters: data.data.chapters, isLoading: false })
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

        const newChapter = result.data.chapter

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
    deleteChapter: async (id: string) => {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch(`/api/chapters/${id}`, {
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
  }))
)
