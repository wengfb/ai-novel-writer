"use client"

import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { cn } from "@/lib/utils"
import { useChapterStore } from '@/lib/store/chapter-store'
import { useAutoSave } from '@/hooks/use-auto-save'

export function TextEditor() {
  const { currentChapter, updateChapterContent, saveChapter, isSaving } = useChapterStore()
  const [content, setContent] = useState(currentChapter?.content || '')
  const [aiGeneratedContent, setAiGeneratedContent] = useState('')

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '开始续写你的故事...',
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
    async (newContent) => {
      if (currentChapter) {
        await saveChapter(currentChapter.id)
      }
    },
    2000
  )

  // 当切换章节时更新编辑器内容
  useEffect(() => {
    if (currentChapter && editor) {
      editor.commands.setContent(currentChapter.content)
      setContent(currentChapter.content)
    }
  }, [currentChapter?.id, editor])

  // 当章节内容变化时更新编辑器（用于 AI 生成）
  useEffect(() => {
    if (currentChapter && editor && currentChapter.content !== content) {
      // 只有当内容真的不同时才更新，避免循环
      const currentEditorContent = editor.getHTML()
      if (currentEditorContent !== currentChapter.content) {
        editor.commands.setContent(currentChapter.content)
        setContent(currentChapter.content)
      }
    }
  }, [currentChapter?.content])

  // 追加 AI 生成的内容
  useEffect(() => {
    if (aiGeneratedContent && editor) {
      const currentContent = editor.getHTML()
      const newContent = currentContent + aiGeneratedContent
      editor.commands.setContent(newContent)
      setContent(newContent)
      if (currentChapter) {
        updateChapterContent(currentChapter.id, newContent)
      }
      setAiGeneratedContent('')
    }
  }, [aiGeneratedContent, editor, currentChapter, updateChapterContent])

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