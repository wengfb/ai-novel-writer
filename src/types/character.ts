/** 角色类型 */
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

/** 角色快照类型 */
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

/** 角色快照创建参数 */
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
