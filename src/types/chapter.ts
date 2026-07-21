/** 章节类型 */
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
