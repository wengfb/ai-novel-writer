import type { Chapter, Character, WorldElement, Foreshadowing } from '@/types'
import {
  scoreCharacters,
  scoreWorldElements,
  scoreForeshadowings,
} from '@/lib/ai/relevance-scorer'
import { estimateTokens } from './rules'

/** 获取最近 N 章完整内容（按 Token 预算从近到远） */
export function getRecentFullChapters(
  chapters: Chapter[],
  currentIndex: number,
  maxTokens: number
): Chapter[] {
  const result: Chapter[] = []
  let usedTokens = 0

  for (let i = currentIndex - 1; i >= 0; i--) {
    const chapter = chapters[i]
    if (!chapter || !chapter.content) continue

    const chapterTokens = estimateTokens(chapter.content)

    if (usedTokens + chapterTokens > maxTokens) {
      if (result.length === 0 && chapterTokens <= maxTokens) {
        result.unshift(chapter)
      }
      break
    }

    result.unshift(chapter)
    usedTokens += chapterTokens
  }

  return result
}

/** 获取更早章节的摘要 */
export function getChapterSummaries(
  chapters: Chapter[],
  currentIndex: number,
  excludeCount: number
): { chapterNumber: number; summary: string }[] {
  const result: { chapterNumber: number; summary: string }[] = []

  for (let i = 0; i < currentIndex - excludeCount; i++) {
    const chapter = chapters[i]
    if (chapter && chapter.summary) {
      result.push({
        chapterNumber: chapter.chapterNumber,
        summary: chapter.summary,
      })
    }
  }

  return result
}

export function getRelevantCharacters(
  characters: Character[],
  allChapters: Chapter[],
  currentChapterIndex: number
): Character[] {
  return scoreCharacters(characters, allChapters, currentChapterIndex)
}

export function getRelevantWorldElements(
  worldElements: WorldElement[],
  allChapters: Chapter[],
  currentChapterIndex: number
): WorldElement[] {
  return scoreWorldElements(worldElements, allChapters, currentChapterIndex)
}

export function getRelevantForeshadowings(
  foreshadowings: Foreshadowing[],
  currentChapterNumber: number
): Foreshadowing[] {
  return scoreForeshadowings(foreshadowings, currentChapterNumber)
}
