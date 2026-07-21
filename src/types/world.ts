/** 世界观元素类型 */
export interface WorldElement {
  id: string
  projectId: string
  type: 'location' | 'history' | 'magic' | 'organization' | 'item' | 'other'
  name: string
  description: string
  attributes?: string
  importance: number // 1-10
  scope: 'global' | 'regional' | 'local'
  category: 'core_rule' | 'detail' | 'background'
  isEvolvable: boolean
  parentId?: string
  constraints?: string
  exceptions?: string
  evolutionSpace?: string
  relatedTo?: string
  references?: string
  usageCount: number
  lastUsedAt?: Date
  createdAt: Date
  updatedAt: Date
}

/** 世界观元素快照类型 */
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

/** 世界观元素创建参数 */
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

/** 世界观快照创建参数 */
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
