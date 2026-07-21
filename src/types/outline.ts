/** 大纲类型 */
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
