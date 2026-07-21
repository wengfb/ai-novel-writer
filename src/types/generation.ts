import type { Chapter } from './chapter'
import type { Character } from './character'
import type { WorldElement } from './world'
import type { Foreshadowing } from './foreshadowing'

/** AI 生成请求参数 */
export interface GenerationParams {
  type: 'chapter' | 'outline' | 'character' | 'dialogue' | 'world'
  model?: string
  prompt: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

/** AI 生成结果 */
export interface GenerationResult {
  output: string
  tokensUsed?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  cost?: number
  duration: number
  status: 'success' | 'error' | 'partial'
  error?: string
}

/** 上下文包类型 */
export interface ContextPackage {
  fullChapters: Chapter[]
  chapterSummaries: { chapterNumber: number; summary: string }[]
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
  metadata: {
    totalChapters: number
    currentChapter: number
    genre: string
    style?: string
    pov?: string
    projectId?: string
  }
}
