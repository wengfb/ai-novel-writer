/** 伏笔类型 */
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

/** 伏笔创建参数 */
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
