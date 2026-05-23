import { apiClient } from '../client'
import { streamSSE } from '@/lib/utils/sse-parser'
import type { GenerateChapterParams, ContinueChapterParams, RewriteParams } from '@/lib/store/ai-store'

export interface GenerateChapterResult {
  chapterId: string
  content: string
  wordCount: number
}

/**
 * AI 续写章节参数（扩展）
 */
export interface ContinueChapterParamsExtended extends ContinueChapterParams {
  targetWords?: number
  model?: string
}

/**
 * AI 对话参数
 */
export interface ChatParams {
  projectId: string
  chapterId?: string
  message: string
  history?: Array<{ role: string; content: string }>
}

export interface ContextInfo {
  projectId: string
  chapterId: string
  totalTokens: number
  characters: Array<{
    id: string
    name: string
    role: string
  }>
  worldElements: Array<{
    id: string
    name: string
    type: string
  }>
  previousChapters: Array<{
    id: string
    chapterNumber: number
    title: string
    summary: string
  }>
}

/**
 * AI API 封装
 */
export const aiApi = {
  /**
   * AI 对话（流式）
   */
  async chat(
    params: ChatParams,
    onProgress: (content: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    let fullResponse = ''

    await streamSSE(
      '/api/ai/chat',
      params,
      (content) => {
        fullResponse += content
        onProgress(content)
      },
      () => {},
      (error) => {
        throw new Error(error)
      },
      signal
    )

    return fullResponse
  },

  /**
   * 流式生成章节
   */
  async generateChapter(
    params: GenerateChapterParams,
    onProgress: (content: string) => void,
    signal?: AbortSignal
  ): Promise<GenerateChapterResult> {
    let result: GenerateChapterResult | null = null

    await streamSSE(
      '/api/ai/generate/chapter',
      params,
      onProgress,
      (data) => {
        result = data
      },
      (error) => {
        throw new Error(error)
      },
      signal
    )

    if (!result) {
      if (signal?.aborted) {
        throw new DOMException('章节生成已取消', 'AbortError')
      }
      throw new Error('生成章节失败：未收到完成结果')
    }

    return result
  },

  /**
   * 续写章节
   */
  async continueChapter(
    params: ContinueChapterParams,
    onProgress: (content: string) => void,
    signal?: AbortSignal
  ): Promise<{ content: string; wordCount: number }> {
    let result: any = null

    await streamSSE(
      '/api/ai/continue',
      params,
      onProgress,
      (data) => {
        result = data
      },
      (error) => {
        throw new Error(error)
      },
      signal
    )

    return result
  },

  /**
   * 局部重绘（流式）
   */
  async rewrite(
    params: RewriteParams,
    onProgress: (content: string) => void,
    signal?: AbortSignal
  ): Promise<{ rewrittenText: string }> {
    let result: any = null

    await streamSSE(
      '/api/ai/rewrite',
      params,
      onProgress,
      (data) => {
        result = data
      },
      (error) => {
        throw new Error(error)
      },
      signal
    )

    if (!result) {
      if (signal?.aborted) {
        throw new DOMException('改写已取消', 'AbortError')
      }
      throw new Error('改写失败：未收到完成结果')
    }

    return result
  },

  /**
   * 获取上下文信息
   */
  async getContext(projectId: string, chapterId: string): Promise<ContextInfo> {
    const response = await fetch(
      `/api/ai/context?projectId=${projectId}&chapterId=${chapterId}`
    )
    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error.message)
    }

    return data.data
  },
}
