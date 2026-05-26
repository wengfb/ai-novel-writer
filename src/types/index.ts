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
  outlineMode: 'full' | 'progressive'
  planningRange?: number
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
  isKeyChapter: boolean
  plotType?: 'setup' | 'conflict' | 'climax' | 'resolution'
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
  importance: number
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
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
  // 分层管理
  importance: number // 1-10
  scope: 'global' | 'regional' | 'local'
  category: 'core_rule' | 'detail' | 'background'
  isEvolvable: boolean
  // 层级关系
  parentId?: string
  // 约束和规则
  constraints?: string
  exceptions?: string
  evolutionSpace?: string
  // 关联
  relatedTo?: string
  references?: string
  // 使用统计
  usageCount: number
  lastUsedAt?: Date
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
  planningMode: 'full' | 'progressive'
  planningRange?: number
  isFlexible: boolean
  confidence: number
  emotionalGoal?: string
  plotFunction: '推进' | '转折' | '铺垫' | '高潮' | '过渡'
  tensionLevel: number
  createdAt: Date
  updatedAt: Date
}

// AI生成相关类型
export interface GenerationParams {
  type: 'chapter' | 'outline' | 'character' | 'dialogue' | 'world'
  model?: string
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
  error?: string
}

// 上下文包类型
export interface ContextPackage {
  fullChapters: Chapter[]
  chapterSummaries: { chapterNumber: number; summary: string }[]
  characters: Character[]
  worldElements: WorldElement[]
  foreshadowings?: Foreshadowing[]
  outlines?: { order: number; title: string; description?: string | null; status: string; emotionalGoal?: string | null; plotFunction: string; tensionLevel: number }[]
  metadata: {
    totalChapters: number
    currentChapter: number
    genre: string
    style?: string
  }
}

// 伏笔类型
export interface Foreshadowing {
  id: string
  projectId: string
  title: string
  description: string
  type: 'plot' | 'character' | 'world' | 'mystery'
  importance: number
  plantedInChapterId?: string
  plantedContent?: string
  plantedAt?: Date
  expectedChapterNumber?: number
  resolvedInChapterId?: string
  resolvedContent?: string
  resolvedAt?: Date
  status: 'planned' | 'planted' | 'resolved' | 'abandoned'
  relatedCharacters?: string
  relatedElements?: string
  tags?: string
  reminderChapterNumber?: number
  createdAt: Date
  updatedAt: Date
}

// 角色快照类型
export interface CharacterSnapshot {
  id: string
  characterId: string
  chapterId?: string
  chapterNumber: number
  age?: number
  appearance?: string
  personality?: string
  powerLevel?: string
  skills?: string
  items?: string
  status?: string
  relationships?: string
  mentalState?: string
  motivation?: string
  majorEvents?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// 伏笔创建参数
export interface CreateForeshadowingParams {
  title: string
  description: string
  type: 'plot' | 'character' | 'world' | 'mystery'
  importance?: number
  expectedChapterNumber?: number
  relatedCharacters?: string[]
  relatedElements?: string[]
  tags?: string[]
}

// 角色快照创建参数
export interface CreateCharacterSnapshotParams {
  characterId: string
  chapterNumber: number
  age?: number
  appearance?: string
  personality?: string
  powerLevel?: string
  skills?: string[]
  items?: string[]
  status?: string
  relationships?: Record<string, string>
  mentalState?: string
  motivation?: string
  majorEvents?: string[]
  notes?: string
}

// 世界观元素快照类型
export interface WorldElementSnapshot {
  id: string
  elementId: string
  chapterId?: string
  chapterNumber: number
  description: string
  attributes?: string
  constraints?: string
  changeReason?: string
  changeType?: 'expansion' | 'modification' | 'evolution'
  affectedCharacters?: string
  affectedPlots?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// 世界观元素创建参数
export interface CreateWorldElementParams {
  type: 'location' | 'history' | 'magic' | 'organization' | 'item' | 'other'
  name: string
  description: string
  importance?: number
  scope?: 'global' | 'regional' | 'local'
  category?: 'core_rule' | 'detail' | 'background'
  isEvolvable?: boolean
  parentId?: string
  attributes?: Record<string, any>
  constraints?: Array<{ description: string; rule: string }>
  exceptions?: Array<{ condition: string; description: string }>
  evolutionSpace?: string
}

// 世界观快照创建参数
export interface CreateWorldElementSnapshotParams {
  elementId: string
  chapterNumber: number
  description: string
  attributes?: Record<string, any>
  constraints?: Array<{ description: string; rule: string }>
  changeReason?: string
  changeType?: 'expansion' | 'modification' | 'evolution'
  affectedCharacters?: string[]
  affectedPlots?: string
  notes?: string
}
