/** 叙事人称类型 */
export type PovType = 'first_person' | 'third_person' | 'multiple_pov'

export const POV_OPTIONS: { value: PovType; label: string; description: string }[] = [
  { value: 'first_person', label: '第一人称', description: '以"我"的视角叙述，代入感强' },
  { value: 'third_person', label: '第三人称', description: '以"他/她"的视角叙述，视角灵活' },
  { value: 'multiple_pov', label: '多视角', description: '切换多个人物的视角叙述' },
]

/** 项目类型（与 Prisma Project 对齐，前端统一从此处导入） */
export interface Project {
  id: string
  title: string
  description: string | null
  genre: string
  tags: string | null
  status: 'draft' | 'writing' | 'completed' | 'archived'
  coverImage: string | null
  totalWords: number
  /** 与数据库字段 chapterCount 一致 */
  chapterCount: number
  pov: PovType
  outlineMode: 'full' | 'progressive'
  planningRange: number | null
  createdAt: Date
  updatedAt: Date
}

/** 创建项目参数 */
export interface CreateProjectParams {
  title: string
  description?: string
  genre: string
  status?: 'draft' | 'writing' | 'completed'
  pov?: PovType
}
