"use client"

import { useEffect, useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useChapterStore } from '@/lib/store/chapter-store'
import { useProjectStore } from '@/lib/store/project-store'
import { useAIStore } from '@/lib/store/ai-store'
import { useAutoSave } from '@/hooks/use-auto-save'
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
  const [content, setContent] = useState(currentChapter?.content || '')
  const [selection, setSelection] = useState<SelectionState | null>(null)

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

  // 当切换章节时更新编辑器内容
  useEffect(() => {
    if (!editor) {
      return
    }

    if (currentChapter) {
      editor.commands.setContent(currentChapter.content, { emitUpdate: true })
    } else {
      editor.commands.clearContent(true)
    }
  }, [currentChapter, editor])

  // 当章节内容变化时更新编辑器（用于 AI 生成）
  useEffect(() => {
    if (currentChapter && editor) {
      const currentEditorContent = editor.getHTML()
      if (currentEditorContent !== currentChapter.content) {
        editor.commands.setContent(currentChapter.content, { emitUpdate: true })
      }
    }
  }, [currentChapter, editor])

  const handleRewriteClose = useCallback(() => {
    setSelection(null)
  }, [])

  // 控制 BubbleMenu 的显示
  const shouldShowBubbleMenu = useCallback(
    ({ editor: _editor }: { editor: any; state: any }) => {
      // 选中文本时显示
      if (!_editor.state.selection.empty) return true
      // 正在改写或预览时保持显示
      if (isRewriting || rewriteResult) return true
      return false
    },
    [isRewriting, rewriteResult]
  )

  if (!editor) {
    return null
  }

  // 判断是否可以显示改写菜单
  const canShowRewrite = selection && currentChapter && currentProject

  return (
    <div className="relative w-full max-w-screen-lg mx-auto min-h-[500px]">
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

      {/* BubbleMenu：文本选中时显示改写菜单 */}
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
