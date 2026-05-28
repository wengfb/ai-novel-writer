"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useChapterStore } from '@/lib/store/chapter-store'
import { useProjectStore } from '@/lib/store/project-store'
import { useAIStore } from '@/lib/store/ai-store'
import { useAutoSave } from '@/hooks/use-auto-save'
import { cn } from '@/lib/utils'
import { RewriteBubbleMenu } from './rewrite-bubble-menu'

interface SelectionState {
  text: string
  from: number
  to: number
}

export function TextEditor() {
  const { currentChapter, updateChapterContent, saveChapter, isSaving } = useChapterStore()
  const currentProject = useProjectStore(s => s.currentProject)
  const isRewriting = useAIStore(s => s.isRewriting)
  const rewriteResult = useAIStore(s => s.rewriteResult)
  const isGeneratingChapter = useAIStore(s => s.isGeneratingChapter)
  const generatingChapterId = useAIStore(s => s.generatingChapterId)
  const [content, setContent] = useState(currentChapter?.content || '')
  const [selection, setSelection] = useState<SelectionState | null>(null)

  // 标记是否为外部触发的 setContent（切换章节 / AI 流式），跳过 onUpdate 避免竞态
  const isExternalUpdate = useRef(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '请选择或创建章节后开始写作...',
      }),
    ],
    content: currentChapter?.content || '<p>开始你的创作...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none dark:prose-invert max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      if (isExternalUpdate.current) return
      const newContent = editor.getHTML()
      setContent(newContent)
      if (currentChapter) {
        updateChapterContent(currentChapter.id, newContent)
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to, empty } = editor.state.selection
      if (!empty) {
        const text = editor.state.doc.textBetween(from, to)
        setSelection({ text, from, to })
      } else {
        setSelection(null)
      }
    },
  })

  // 自动保存
  const { isSaving: autoSaving, lastSaved } = useAutoSave(
    content,
    async () => {
      if (currentChapter) {
        await saveChapter(currentChapter.id)
      }
    },
    2000
  )

  // 合并：切换章节 + AI 流式更新，统一通过此 effect 同步到编辑器
  useEffect(() => {
    if (!editor || !currentChapter) return
    if (editor.getHTML() !== currentChapter.content) {
      isExternalUpdate.current = true
      editor.commands.setContent(currentChapter.content, { emitUpdate: false })
      isExternalUpdate.current = false
    }
  }, [currentChapter, editor])

  const handleRewriteClose = useCallback(() => {
    setSelection(null)
  }, [])

  // 控制 BubbleMenu 的显示
  const shouldShowBubbleMenu = useCallback(
    ({ editor: _editor }: { editor: any; state: any }) => {
      if (!_editor.state.selection.empty) return true
      if (isRewriting || rewriteResult) return true
      return false
    },
    [isRewriting, rewriteResult]
  )

  if (!editor) {
    return null
  }

  const canShowRewrite = selection && currentChapter && currentProject
  const isCurrentChapterGenerating = isGeneratingChapter && generatingChapterId === currentChapter?.id

  return (
    <div className={cn(
      "relative w-full max-w-screen-lg mx-auto min-h-[500px]",
      isCurrentChapterGenerating && "editor-generating"
    )}>
      {/* 保存状态指示器 */}
      {(isSaving || autoSaving) && (
        <div className="absolute top-2 right-2 text-xs text-muted-foreground">
          保存中...
        </div>
      )}
      {lastSaved && !isSaving && !autoSaving && (
        <div className="absolute top-2 right-2 text-xs text-muted-foreground">
          已保存 {lastSaved.toLocaleTimeString()}
        </div>
      )}

      {editor && (
        <BubbleMenu editor={editor} shouldShow={shouldShowBubbleMenu}>
          {canShowRewrite ? (
            <RewriteBubbleMenu
              editor={editor}
              projectId={currentProject!.id}
              chapterId={currentChapter!.id}
              fullChapterContent={content}
              selectionFrom={selection.from}
              selectionTo={selection.to}
              onClose={handleRewriteClose}
            />
          ) : null}
        </BubbleMenu>
      )}

      <EditorContent editor={editor} className="min-h-[500px]" />
    </div>
  )
}
