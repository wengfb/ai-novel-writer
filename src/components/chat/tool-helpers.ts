/**
 * 聊天工具结果展示与写操作后的 store 刷新
 * 从旧 ai-chat 抽出，供统一 Chat 壳复用
 */

import type { ParsedToolInvocation } from '@/lib/ai/message-parser'
import { useChapterStore } from '@/lib/store/chapter-store'

export function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

/** 将工具执行结果格式化为可读摘要 */
export function formatToolOutput(output: unknown): string {
  if (typeof output === 'string') return output
  if (!output || typeof output !== 'object') return '工具已执行完成'

  const result = output as Record<string, unknown>
  if (result.ok === false && typeof result.error === 'string') return result.error

  const character = asRecord(result.character)
  if (typeof character.name === 'string') return `角色「${character.name}」已更新`

  const worldElement = asRecord(result.worldElement)
  if (typeof worldElement.name === 'string') return `世界观元素「${worldElement.name}」已更新`

  const chapter = asRecord(result.chapter)
  if (typeof chapter.title === 'string') return `章节「${chapter.title}」已更新`

  const project = asRecord(result.project)
  if (typeof project.title === 'string') return `已查询项目「${project.title}」的信息`

  const outline = asRecord(result.outline)
  if (typeof outline.title === 'string') return `大纲「${outline.title}」已更新`

  const foreshadowing = asRecord(result.foreshadowing)
  if (typeof foreshadowing.title === 'string') {
    return foreshadowing.status === 'resolved'
      ? `伏笔「${foreshadowing.title}」已回收`
      : `伏笔「${foreshadowing.title}」已记录`
  }

  if (Array.isArray(result.foreshadowings)) return `共 ${result.foreshadowings.length} 个伏笔`

  if (Array.isArray(result.issues)) {
    return result.issues.length > 0
      ? `发现 ${result.issues.length} 个不一致`
      : '未发现世界观不一致'
  }

  return '工具已执行完成'
}

/** 工具写操作成功后刷新对应前端 store */
export async function refreshToolState(
  toolPart: ParsedToolInvocation,
  projectId: string,
  fallbackChapterId: string | undefined,
  fetchCharacters: (projectId: string) => Promise<void>,
  fetchWorldElements: (projectId: string) => Promise<void>,
  fetchChapters: (projectId: string) => Promise<void>,
  fetchOutlines: (projectId: string) => Promise<void>
) {
  if (toolPart.toolName === 'createCharacter' || toolPart.toolName === 'updateCharacter') {
    await fetchCharacters(projectId)
    return
  }

  if (toolPart.toolName === 'createWorldElement' || toolPart.toolName === 'updateWorldElement') {
    await fetchWorldElements(projectId)
    return
  }

  if (toolPart.toolName === 'updateChapterContent') {
    await fetchChapters(projectId)

    const outputChapter = asRecord(asRecord(toolPart.output).chapter)
    const updatedChapterId =
      typeof outputChapter.id === 'string' ? outputChapter.id : fallbackChapterId
    const { chapters, setCurrentChapter } = useChapterStore.getState()
    const updatedChapter = chapters.find((chapter) => chapter.id === updatedChapterId)
    if (updatedChapter) setCurrentChapter(updatedChapter)
    return
  }

  if (toolPart.toolName === 'createChapter') {
    await fetchChapters(projectId)
    return
  }

  if (toolPart.toolName === 'createOutline' || toolPart.toolName === 'updateOutline') {
    await fetchOutlines(projectId)
  }
}
