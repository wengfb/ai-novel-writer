'use client'

/**
 * 监听会话中已完成的写工具，刷新角色/世界/章节/大纲 store
 */

import { useEffect, useRef } from 'react'
import { useThread } from '@assistant-ui/react'
import { isWriteOperation } from '@/lib/ai/tool-metadata'
import { useCharacterStore } from '@/lib/store/character-store'
import { useWorldStore } from '@/lib/store/world-store'
import { useChapterStore } from '@/lib/store/chapter-store'
import { useOutlineStore } from '@/lib/store/outline-store'
import { asRecord, refreshToolState } from './tool-helpers'

interface ToolStateRefresherProps {
  projectId: string
  chapterId?: string
}

export function ToolStateRefresher({ projectId, chapterId }: ToolStateRefresherProps) {
  const messages = useThread((t) => t.messages)
  const refreshedRef = useRef<Set<string>>(new Set())

  const fetchCharacters = useCharacterStore((s) => s.fetchCharacters)
  const fetchWorldElements = useWorldStore((s) => s.fetchWorldElements)
  const fetchChapters = useChapterStore((s) => s.fetchChapters)
  const fetchOutlines = useOutlineStore((s) => s.fetchOutlines)

  useEffect(() => {
    for (const message of messages) {
      if (message.role !== 'assistant') continue
      for (const part of message.content) {
        if (part.type !== 'tool-call') continue
        if (part.result === undefined) continue
        if (!isWriteOperation(part.toolName)) continue

        const output = asRecord(part.result)
        if (output.ok === false) continue

        const key = `${part.toolCallId}:done`
        if (refreshedRef.current.has(key)) continue
        refreshedRef.current.add(key)

        refreshToolState(
          {
            toolCallId: part.toolCallId,
            toolName: part.toolName,
            state: 'output-available',
            input: part.args,
            output: part.result,
          },
          projectId,
          chapterId,
          fetchCharacters,
          fetchWorldElements,
          fetchChapters,
          fetchOutlines
        ).catch((err) => {
          console.error('刷新工具调用结果失败:', err)
          refreshedRef.current.delete(key)
        })
      }
    }
  }, [
    messages,
    projectId,
    chapterId,
    fetchCharacters,
    fetchWorldElements,
    fetchChapters,
    fetchOutlines,
  ])

  return null
}
