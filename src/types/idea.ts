/** 故事创意卡片（随机生成） */
export interface StoryIdeaCard {
  id: string
  title: string
  genre: string
  worldBuilding: string
  protagonist: string
  coreConflict: string
  mainGoal: string
  highConcept: string
  sublimation: string
  openingHook: string
}

/** 创意中心 — 创意条目 */
export interface IdeaItem extends StoryIdeaCard {
  status: 'draft' | 'favorited' | 'converted' | 'archived'
  source?: {
    audience?: string
    genre?: string
    tone?: string
    customRequirements?: string
    positiveExampleIds?: string[]
    negativeExampleIds?: string[]
  }
  convertedToProjectId?: string
  rating: number | null
  commentCount: number
  aiGenerated: boolean
  createdAt: string
  updatedAt: string
}

/** 创意中心 — 评论 */
export interface IdeaComment {
  id: string
  ideaId: string
  content: string
  createdAt: string
}
