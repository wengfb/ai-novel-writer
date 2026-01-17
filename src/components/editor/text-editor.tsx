"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { cn } from "@/lib/utils"

export function TextEditor() {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '开始续写你的故事...',
      }),
    ],
    content: '<p>新东京的霓虹灯在雨后湿滑的路面上闪烁。Cipher 拉高了衣领，穿过拥挤的贫民窟街道...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none dark:prose-invert max-w-none',
      },
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className="relative w-full max-w-screen-lg mx-auto min-h-[500px]">
        <EditorContent editor={editor} className="min-h-[500px]" />
    </div>
  )
}