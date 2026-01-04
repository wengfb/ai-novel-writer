// 项目类型
export interface Project {
  id: string
  title: string
  description?: string
  genre: string
  tags?: string
  status: 'draft' | 'writing' | 'completed'
  coverImage?: string
  totalWords: number
  chapterCount: number
  createdAt: Date
  updatedAt: Date
}

// 章节类型
export interface Chapter {
  id: string
  projectId: string
  chapterNumber: number
  title: string
  content: string
  wordCount: number
  summary?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// 角色类型
export interface Character {
  id: string
  projectId: string
  name: string
  nickname?: string
  age?: number
  gender?: string
  appearance?: string
  personality?: string
  backstory?: string
  motivation?: string
  dialogueStyle?: string
  relationships?: string
  characterArc?: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

// 世界观元素类型
export interface WorldElement {
  id: string
  projectId: string
  type: 'location' | 'history' | 'magic' | 'organization' | 'item' | 'other'
  name: string
  description: string
  attributes?: string
  relatedTo?: string
  references?: string
  createdAt: Date
  updatedAt: Date
}

// 大纲类型
export interface Outline {
  id: string
  projectId: string
  type: 'volume' | 'chapter' | 'scene'
  order: number
  title: string
  description?: string
  targetWords?: number
  parentId?: string
  chapterId?: string
  status: 'planned' | 'writing' | 'completed'
  createdAt: Date
  updatedAt: Date
}

// AI生成相关类型
export interface GenerationParams {
  type: 'chapter' | 'outline' | 'character' | 'dialogue' | 'world'
  model: 'gemini-2.5-flash' | 'gemini-2.5-pro'
  prompt: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

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
}

// 上下文包类型
export interface ContextPackage {
  fullChapters: Chapter[]
  chapterSummaries: { chapterNumber: number; summary: string }[]
  characters: Character[]
  worldElements: WorldElement[]
  metadata: {
    totalChapters: number
    currentChapter: number
    genre: string
    style?: string
  }
}
