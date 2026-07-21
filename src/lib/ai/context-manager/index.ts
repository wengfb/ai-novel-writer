/**
 * 上下文管理器
 * 负责管理长文本生成的上下文，使用滑动窗口 + 摘要策略
 * 支持根据小说类型动态调整上下文权重
 */
import type {
  Chapter,
  Character,
  WorldElement,
  Foreshadowing,
  ContextPackage,
} from '@/types'
import {
  getMaxTokens,
  getContextRatios,
  estimateTokens as estimateTokensImpl,
} from './rules'
import {
  getRecentFullChapters,
  getChapterSummaries,
  getRelevantCharacters,
  getRelevantWorldElements,
  getRelevantForeshadowings,
} from './selectors'
import { formatContextForPrompt as formatContextForPromptImpl } from './format'
import {
  generateChapterSummary as generateChapterSummaryImpl,
  summarizeProjectChapters as summarizeProjectChaptersImpl,
} from './summary'

export class ContextManager {
  /** 构建上下文包 */
  buildContext(params: {
    currentChapter: number
    allChapters: Chapter[]
    characters: Character[]
    worldElements: WorldElement[]
    foreshadowings?: Foreshadowing[]
    outlines?: {
      order: number
      title: string
      description?: string | null
      status: string
      emotionalGoal?: string | null
      plotFunction: string
      tensionLevel: number
    }[]
    genre: string
    style?: string
    pov?: string
    contextMaxTokens?: number
    projectId?: string
  }): ContextPackage {
    const {
      currentChapter,
      allChapters,
      characters,
      worldElements,
      foreshadowings,
      outlines,
      genre,
      style,
      pov,
      contextMaxTokens,
      projectId,
    } = params

    const maxTokens = getMaxTokens(contextMaxTokens)
    const ratios = getContextRatios(genre)

    const fullChapters = getRecentFullChapters(
      allChapters,
      currentChapter,
      Math.floor(maxTokens * ratios.chapter)
    )

    const chapterSummaries = getChapterSummaries(
      allChapters,
      currentChapter,
      fullChapters.length
    )

    const relevantCharacters = getRelevantCharacters(characters, allChapters, currentChapter)
    const relevantWorld = getRelevantWorldElements(worldElements, allChapters, currentChapter)
    const relevantForeshadowings = foreshadowings
      ? getRelevantForeshadowings(foreshadowings, currentChapter)
      : undefined

    return {
      fullChapters,
      chapterSummaries,
      characters: relevantCharacters,
      worldElements: relevantWorld,
      foreshadowings: relevantForeshadowings,
      outlines,
      metadata: {
        totalChapters: allChapters.length,
        currentChapter,
        genre,
        style,
        pov,
        projectId,
      },
    }
  }

  estimateTokens(text: string): number {
    return estimateTokensImpl(text)
  }

  generateChapterSummary(
    chapterContent: string,
    chapterTitle?: string,
    characterNames?: string[]
  ): Promise<string> {
    return generateChapterSummaryImpl(chapterContent, chapterTitle, characterNames)
  }

  summarizeProjectChapters(projectId: string): Promise<number> {
    return summarizeProjectChaptersImpl(projectId)
  }

  formatContextForPrompt(context: ContextPackage): string {
    return formatContextForPromptImpl(context)
  }
}

let contextManager: ContextManager | null = null

export function getContextManager(): ContextManager {
  if (!contextManager) {
    contextManager = new ContextManager()
  }
  return contextManager
}
