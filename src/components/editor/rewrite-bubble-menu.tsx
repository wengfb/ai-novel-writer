'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Moon, Smile, Minus, Plus, BookOpen, MessageCircle,
  Loader2, Check, X,
} from 'lucide-react'
import { useAIStore } from '@/lib/store/ai-store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Phase = 'selecting-style' | 'rewriting' | 'preview'

const REWRITE_STYLES = [
  { id: '更黑暗', label: '更黑暗', icon: Moon, desc: '阴郁深沉' },
  { id: '更幽默', label: '更幽默', icon: Smile, desc: '轻松诙谐' },
  { id: '更简练', label: '更简练', icon: Minus, desc: '简洁直接' },
  { id: '更详细', label: '更详细', icon: Plus, desc: '丰富具体' },
  { id: '更正式', label: '更正式', icon: BookOpen, desc: '严谨规范' },
  { id: '更口语化', label: '更口语化', icon: MessageCircle, desc: '自然生活化' },
] as const

interface RewriteBubbleMenuProps {
  editor: Editor
  projectId: string
  chapterId: string
  fullChapterContent: string
  selectionFrom: number
  selectionTo: number
  onClose: () => void
}

export function RewriteBubbleMenu({
  editor,
  projectId,
  chapterId,
  fullChapterContent,
  selectionFrom,
  selectionTo,
  onClose,
}: RewriteBubbleMenuProps) {
  const [phase, setPhase] = useState<Phase>('selecting-style')
  const [rewriteProgress, setRewriteProgress] = useState('')

  const rewriteText = useAIStore(s => s.rewriteText)
  const rewriteResult = useAIStore(s => s.rewriteResult)
  const clearRewriteResult = useAIStore(s => s.clearRewriteResult)
  const cancelGeneration = useAIStore(s => s.cancelGeneration)
  const error = useAIStore(s => s.error)

  // 监听改写结果变化，进入预览阶段
  useEffect(() => {
    if (rewriteResult && phase === 'rewriting') {
      setPhase('preview')
    }
  }, [rewriteResult, phase])

  // 监听错误，出错时关闭
  useEffect(() => {
    if (error && phase === 'rewriting') {
      onClose()
    }
  }, [error, phase, onClose])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      clearRewriteResult()
      setRewriteProgress('')
    }
  }, [clearRewriteResult])

  const handleStyleSelect = useCallback(
    async (style: string) => {
      const selectedText = editor.state.doc.textBetween(selectionFrom, selectionTo)

      if (!selectedText.trim()) return

      setPhase('rewriting')

      try {
        await rewriteText(
          {
            projectId,
            chapterId,
            selectedText,
            style,
            fullChapterContent,
          },
          (chunk) => {
            setRewriteProgress(prev => prev + chunk)
          }
        )
      } catch {
        // 错误已由 store 处理，直接关闭即可
        onClose()
      }
    },
    [projectId, chapterId, fullChapterContent, selectionFrom, selectionTo, editor, rewriteText, onClose]
  )

  const handleAccept = useCallback(() => {
    if (!rewriteResult) return

    const { rewrittenText } = rewriteResult

    // 替换选中文本（整个 chain 为一个 undo 步）
    editor
      .chain()
      .focus()
      .deleteRange({ from: selectionFrom, to: selectionTo })
      .insertContentAt(selectionFrom, rewrittenText)
      .run()

    clearRewriteResult()
    onClose()
  }, [editor, selectionFrom, selectionTo, rewriteResult, clearRewriteResult, onClose])

  const handleReject = useCallback(() => {
    cancelGeneration()
    clearRewriteResult()
    setRewriteProgress('')
    onClose()
  }, [cancelGeneration, clearRewriteResult, onClose])

  return (
    <div className="rounded-lg shadow-xl border bg-popover text-popover-foreground p-3 min-w-[300px] max-w-[420px]">
      {/* 阶段 1：风格选择 */}
      {phase === 'selecting-style' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">选择改写风格</span>
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {REWRITE_STYLES.map(s => (
              <button
                key={s.id}
                onClick={() => handleStyleSelect(s.id)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-md px-2 py-2',
                  'text-xs text-muted-foreground',
                  'hover:bg-accent hover:text-accent-foreground',
                  'transition-colors'
                )}
              >
                <s.icon className="h-4 w-4" />
                <span className="font-medium">{s.label}</span>
                <span className="text-[10px] opacity-60">{s.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 阶段 2：加载中 */}
      {phase === 'rewriting' && (
        <div className="flex flex-col items-center gap-2 py-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">正在重绘...</span>
          {rewriteProgress && (
            <span className="text-xs text-muted-foreground">
              已生成 {rewriteProgress.replace(/<[^>]*>/g, '').length} 字
            </span>
          )}
          <button
            onClick={handleReject}
            className="text-xs text-muted-foreground hover:text-foreground mt-1 transition-colors"
          >
            取消
          </button>
        </div>
      )}

      {/* 阶段 3：预览 */}
      {phase === 'preview' && rewriteResult && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">改写预览</span>
            <button
              onClick={handleReject}
              className="rounded-sm opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <ScrollArea className="max-h-[200px] mb-3">
            <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap pr-2">
              {rewriteResult.rewrittenText}
            </div>
          </ScrollArea>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleReject}>
              <X className="h-3.5 w-3.5 mr-1" />
              取消
            </Button>
            <Button size="sm" onClick={handleAccept}>
              <Check className="h-3.5 w-3.5 mr-1" />
              应用改写
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
