"use client"

import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useChapterStore } from '@/lib/store/chapter-store'
import { useAutoSave } from '@/hooks/use-auto-save'

export function TextEditor() {
  const { currentChapter, updateChapterContent, saveChapter, isSaving } = useChapterStore()
  const [content, setContent] = useState(currentChapter?.content || '')

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

  if (!editor) {
    return null
  }

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
      <EditorContent editor={editor} className="min-h-[500px]" />
    </div>
  )
}