import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { aiApi, type ContextInfo } from '@/lib/api/endpoints/ai'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface GenerateChapterParams {
  projectId: string
  chapterNumber: number
  chapterTitle: string
  chapterOutline: string
  targetWords?: number
  model?: string
}

export interface ContinueChapterParams {
  projectId: string
  chapterId: string
  currentContent: string
  targetWords?: number
  model?: string
}

interface AIState {
  // 对话相关
  messages: Message[]
  isGenerating: boolean
  error: string | null

  // 续写相关
  isContinuing: boolean
  continueProgress: string

  // 生成章节相关
  isGeneratingChapter: boolean
  chapterProgress: string

  // 上下文相关
  context: ContextInfo | null
  isLoadingContext: boolean

  // AbortController 管理
  abortController: AbortController | null

  // Actions
  sendMessage: (content: string, projectId: string, chapterId?: string) => Promise<void>
  generateChapter: (params: GenerateChapterParams, onProgress: (text: string) => void) => Promise<void>
  continueWriting: (params: ContinueChapterParams, onProgress: (text: string) => void) => Promise<void>
  cancelGeneration: () => void
  fetchContext: (projectId: string, chapterId: string) => Promise<void>
  clearMessages: () => void
  clearError: () => void
}

export const useAIStore = create<AIState>()(
  immer((set, get) => ({
    // 初始状态
    messages: [],
    isGenerating: false,
    error: null,
    isContinuing: false,
    continueProgress: '',
    isGeneratingChapter: false,
    chapterProgress: '',
    context: null,
    isLoadingContext: false,
    abortController: null,

    // AI 对话（流式）
    sendMessage: async (content: string, projectId: string, chapterId?: string) => {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
      }

      const assistantMessageId = (Date.now() + 1).toString()

      set((state) => {
        state.messages.push(userMessage)
        // 立即添加一个空的助手消息用于流式更新
        state.messages.push({
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        })
        state.isGenerating = true
        state.error = null
        state.abortController = new AbortController()
      })

      try {
        const abortController = get().abortController

        await aiApi.chat(
          { projectId, chapterId, message: content },
          (chunk) => {
            // 实时更新助手消息内容
            set((state) => {
              const message = state.messages.find(m => m.id === assistantMessageId)
              if (message) {
                message.content += chunk
              }
            })
          },
          abortController?.signal
        )

        set({
          isGenerating: false,
          abortController: null,
        })
      } catch (error) {
        // 如果出错，移除空的助手消息
        set((state) => {
          state.messages = state.messages.filter(m => m.id !== assistantMessageId)
          state.error = error instanceof Error ? error.message : 'AI 对话失败'
          state.isGenerating = false
          state.abortController = null
        })
      }
    },

    generateChapter: async (params, onProgress) => {
      set({
        isGeneratingChapter: true,
        error: null,
        chapterProgress: '',
        abortController: new AbortController()
      })

      try {
        const abortController = get().abortController

        await aiApi.generateChapter(
          params,
          (chunk) => {
            set((state) => {
              state.chapterProgress += chunk
            })
            onProgress(chunk)
          },
          abortController?.signal
        )

        set({
          isGeneratingChapter: false,
          chapterProgress: '',
          abortController: null
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '生成章节失败',
          isGeneratingChapter: false,
          chapterProgress: '',
          abortController: null,
        })
        throw error
      }
    },

    continueWriting: async (params, onProgress) => {
      set({
        isContinuing: true,
        error: null,
        continueProgress: '',
        abortController: new AbortController()
      })

      try {
        const abortController = get().abortController

        await aiApi.continueChapter(
          params,
          (chunk) => {
            set((state) => {
              state.continueProgress += chunk
            })
            onProgress(chunk)
          },
          abortController?.signal
        )

        set({
          isContinuing: false,
          continueProgress: '',
          abortController: null
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'AI 续写失败',
          isContinuing: false,
          continueProgress: '',
          abortController: null,
        })
        throw error
      }
    },

    // 取消生成
    cancelGeneration: () => {
      const { abortController } = get()
      if (abortController) {
        abortController.abort()
      }
      set({
        isGenerating: false,
        isContinuing: false,
        isGeneratingChapter: false,
        continueProgress: '',
        chapterProgress: '',
        abortController: null,
      })
    },

    // 获取上下文信息
    fetchContext: async (projectId: string, chapterId: string) => {
      set({ isLoadingContext: true, error: null })
      try {
        const context = await aiApi.getContext(projectId, chapterId)
        set({ context, isLoadingContext: false })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '获取上下文失败',
          isLoadingContext: false,
        })
      }
    },

    clearMessages: () => {
      set({ messages: [] })
    },

    clearError: () => {
      set({ error: null })
    },
  }))
)
