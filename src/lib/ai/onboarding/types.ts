import type { StoryIdeaCard } from '@/types'

// ============ 管线参数 ============

/** Bootstrap 输入参数 */
export interface BootstrapParams {
  projectTitle: string
  idea: StoryIdeaCard
  targetWords: number
  pace: 'fast' | 'medium' | 'slow'
  audience?: string
  tone?: string
  model?: string
}

/** 章节计算结果 */
export interface ChapterCalculation {
  chapterCount: number
  volumeCount: number
  chaptersPerVolume: number
  avgChapterWords: number
}

// ============ 步骤 1：故事架构 ============

export interface ActStructure {
  act: number
  chapterRange: [number, number]
  description: string
  /** 该幕的情感走向 */
  emotionalArc: string
}

export interface VolumePlan {
  volumeNumber: number
  title: string
  description: string
  chapterRange: [number, number]
}

export interface StoryArchitecture {
  storySummary: string
  mainConflict: string
  suggestedTotalWords: number
  wordCountRationale: string
  /** 三幕/四幕结构 */
  actStructure: ActStructure[]
  /** 分卷方案 */
  volumePlan: VolumePlan[]
  /** 主题线索——sublimation 如何在故事中展开 */
  thematicThread: string
}

// ============ 步骤 2：角色群像 ============

export interface CharacterRelationship {
  targetName: string
  relation: string
  description: string
}

export interface GeneratedCharacter {
  name: string
  role: string
  description: string
  personality: string | string[]
  goal: string
  characterArc: string
  dialogueStyle: string
  relationships: CharacterRelationship[]
  /** 角色在故事中首次出现的大致阶段 */
  firstAppearance: string
}

export interface CharacterEnsemble {
  characters: GeneratedCharacter[]
}

// ============ 步骤 3：世界观 ============

export interface WorldConstraint {
  description: string
  rule: string
}

export interface WorldException {
  condition: string
  description: string
}

export interface GeneratedWorldElement {
  type: string
  name: string
  description: string
  importance: number
  scope: 'global' | 'regional' | 'local'
  category: 'core_rule' | 'detail' | 'background'
  constraints: WorldConstraint[]
  exceptions: WorldException[]
  /** 关联的角色名或世界元素名 */
  relatedTo: string[]
  isEvolvable: boolean
  evolutionSpace: string
}

export interface WorldSettings {
  worldSettings: GeneratedWorldElement[]
}

// ============ 步骤 4：分章大纲 ============

export interface GeneratedChapter {
  chapterNumber: number
  title: string
  summary: string
  emotionalGoal: string
  plotFunction: string
  tensionLevel: number
  keyEvents: string[]
  characters: string[]
  estimatedWords: number
  /** 所属幕 (1/2/3) */
  act: number
  /** 因果链：本章因何而来 */
  causalFrom: string
  /** 因果链：本章导致什么 */
  causalTo: string
}

export interface ChapterOutline {
  chapters: GeneratedChapter[]
  suggestedTotalWords: number
  wordCountRationale: string
  /** 张力曲线描述 */
  tensionArcSummary: string
}

// ============ 步骤 5：伏笔系统 ============

export interface GeneratedForeshadowing {
  title: string
  description: string
  type: 'plot' | 'character' | 'world' | 'mystery'
  importance: number
  /** 在哪个章节埋下伏笔 */
  plantedInChapterNumber: number
  /** 预期哪个章节回收 */
  expectedChapterNumber: number
  relatedCharacters: string[]
  relatedElements: string[]
}

export interface ForeshadowingPlan {
  foreshadowings: GeneratedForeshadowing[]
}

// ============ 步骤 6：风格锚点 ============

export interface StyleAnchorResult {
  content: string
  wordCount: number
}

// ============ 聚合结果 ============

/** 管线完整输出（数据库写入前） */
export interface PipelineResult {
  architecture: StoryArchitecture
  characters: CharacterEnsemble
  worldSettings: WorldSettings
  chapters: ChapterOutline
  foreshadowings: ForeshadowingPlan
  styleAnchor: StyleAnchorResult
}

// ============ SSE 进度事件 ============

export type PipelineStep =
  | 'architecture'
  | 'characters'
  | 'world'
  | 'chapters'
  | 'foreshadowings'
  | 'styleAnchor'
  | 'validation'
  | 'writing'
  | 'done'

export interface PipelineProgressEvent {
  type: 'start' | 'progress' | 'step_complete' | 'step_error' | 'validation' | 'writing' | 'done'
  step: PipelineStep
  progress: number
  message?: string
  summary?: Record<string, unknown>
  data?: Record<string, unknown>
  error?: string
  attempt?: number
}

// ============ 校验结果 ============

export interface ValidationWarning {
  field: string
  message: string
  severity: 'low' | 'medium' | 'high'
}

export interface ValidationResult {
  errors: ValidationWarning[]
  warnings: ValidationWarning[]
  passed: boolean
}
