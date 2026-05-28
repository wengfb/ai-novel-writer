import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { aiApi, type ContextInfo, type GenerateChapterResult } from '@/lib/api/endpoints/ai'
import { useChapterStore } from './chapter-store'

export interface GenerateChapterParams {
  projectId: string
  chapterNumber: number
  chapterTitle?: string
  chapterOutline?: string
  targetWords?: number
  model?: string
  emotionalGoal?: string
  plotFunction?: string
  tensionLevel?: number
}

export interface ContinueChapterParams {
  projectId: string
  chapterId: string
  currentContent: string
  targetWords?: number
  model?: string
}

export interface RewriteParams {
  projectId: string
  chapterId: string
  selectedText: string
  style: string
  fullChapterContent: string
  model?: string
}

interface AIState {
  // 对话相关错误（仅保留错误状态）
  error: string | null

  // 续写相关
  isContinuing: boolean
  continueProgress: string

  // 生成章节相关
  isGeneratingChapter: boolean
  generatingChapterId: string | null
  chapterProgress: string

  // 上下文相关
  context: ContextInfo | null
  isLoadingContext: boolean

  // 局部重绘相关
  isRewriting: boolean
  rewriteProgress: string
  rewriteResult: { originalText: string; rewrittenText: string } | null

  // AbortController 管理
  abortController: AbortController | null

  // 上下文定制
  contextCustomization: {
    excludedCharacterIds: string[]
    excludedElementIds: string[]
  }

  // Actions
  generateChapter: (params: GenerateChapterParams) => Promise<GenerateChapterResult>
  continueWriting: (params: ContinueChapterParams, onProgress: (text: string) => void) => Promise<void>
  rewriteText: (params: RewriteParams, onProgress: (text: string) => void) => Promise<void>
  cancelGeneration: () => void
  fetchContext: (projectId: string, chapterId: string) => Promise<void>
  toggleCharacterInclusion: (characterId: string) => void
  toggleElementInclusion: (elementId: string) => void
  resetContextCustomization: () => void
  clearError: () => void
  clearRewriteResult: () => void
}

export const useAIStore = create<AIState>()(
  immer((set, get) => ({
    // 初始状态
    error: null,
    isContinuing: false,
    continueProgress: '',
    isGeneratingChapter: false,
    generatingChapterId: null,
    chapterProgress: '',
    context: null,
    isLoadingContext: false,
    isRewriting: false,
    rewriteProgress: '',
    rewriteResult: null,
    abortController: null,
    contextCustomization: {
      excludedCharacterIds: [],
      excludedElementIds: [],
    },

    generateChapter: async (params) => {
      set({
        isGeneratingChapter: true,
        generatingChapterId: null,
        error: null,
        chapterProgress: '',
        abortController: new AbortController()
      })

      let generatedChapterId = ''
      let accumulatedContent = ''

      try {
        const abortController = get().abortController

        const result = await aiApi.generateChapter(
          params,
          (chapterId) => {
            // 收到 chapterId 后立即创建本地章节并设为当前
            generatedChapterId = chapterId
            set({ generatingChapterId: chapterId })
            const chapterStore = useChapterStore.getState()

            // 将章节添加到本地列表（初始空内容，CSS 伪元素负责显示尾部光标）
            chapterStore.addChapterLocally({
              id: chapterId,
              projectId: params.projectId,
              chapterNumber: params.chapterNumber,
              title: params.chapterTitle || `第${params.chapterNumber}章`,
              content: '<p></p>',
              wordCount: 0,
              status: 'draft' as const,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          },
          (chunk) => {
            // 流式更新：累积内容，简单 <p> + <br> 包裹，不拆段落
            set((state) => {
              state.chapterProgress += chunk
            })
            if (generatedChapterId) {
              accumulatedContent += (accumulatedContent ? '\n\n' : '') + chunk
              const simpleHtml = '<p>' + accumulatedContent
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n/g, '<br>') + '</p>'
              useChapterStore.getState().updateChapterContent(generatedChapterId, simpleHtml)
            }
          },
          abortController?.signal
        )

        // 生成完成，用服务端返回的最终内容更新
        if (generatedChapterId) {
          useChapterStore.getState().updateChapterContent(generatedChapterId, result.content)
        }

        set({
          isGeneratingChapter: false,
          generatingChapterId: null,
          chapterProgress: '',
          abortController: null
        })

        return result
      } catch (error) {
        // 生成失败时从本地列表中移除占位章节
        if (generatedChapterId) {
          useChapterStore.getState().removeChapterLocally(generatedChapterId)
        }
        set({
          error: error instanceof Error ? error.message : '生成章节失败',
          isGeneratingChapter: false,
          generatingChapterId: null,
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

    rewriteText: async (params, onProgress) => {
      set({
        isRewriting: true,
        error: null,
        rewriteProgress: '',
        rewriteResult: null,
        abortController: new AbortController()
      })

      try {
        const abortController = get().abortController

        const result = await aiApi.rewrite(
          params,
          (chunk) => {
            set((state) => {
              state.rewriteProgress += chunk
            })
            onProgress(chunk)
          },
          abortController?.signal
        )

        set({
          isRewriting: false,
          rewriteProgress: '',
          rewriteResult: {
            originalText: params.selectedText,
            rewrittenText: result.rewrittenText,
          },
          abortController: null,
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'AI 改写失败',
          isRewriting: false,
          rewriteProgress: '',
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
        isContinuing: false,
        isGeneratingChapter: false,
        generatingChapterId: null,
        isRewriting: false,
        continueProgress: '',
        chapterProgress: '',
        rewriteProgress: '',
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

    toggleCharacterInclusion: (characterId: string) => {
      set((state) => {
        const excluded = state.contextCustomization.excludedCharacterIds
        if (excluded.includes(characterId)) {
          state.contextCustomization.excludedCharacterIds = excluded.filter(id => id !== characterId)
        } else {
          state.contextCustomization.excludedCharacterIds = [...excluded, characterId]
        }
      })
    },

    toggleElementInclusion: (elementId: string) => {
      set((state) => {
        const excluded = state.contextCustomization.excludedElementIds
        if (excluded.includes(elementId)) {
          state.contextCustomization.excludedElementIds = excluded.filter(id => id !== elementId)
        } else {
          state.contextCustomization.excludedElementIds = [...excluded, elementId]
        }
      })
    },

    resetContextCustomization: () => {
      set({
        contextCustomization: {
          excludedCharacterIds: [],
          excludedElementIds: [],
        },
      })
    },

    clearError: () => {
      set({ error: null })
    },

    clearRewriteResult: () => {
      set({ rewriteResult: null })
    },
  }))
)
