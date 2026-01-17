"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"

interface TextEditorProps {
  chapterId: string
  initialContent?: string
  onSave: (content: string) => void
}

export function TextEditor({
  chapterId,
  initialContent = "",
  onSave,
}: TextEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [wordCount, setWordCount] = useState(initialContent.length)

  const handleContentChange = (value: string) => {
    setContent(value)
    setWordCount(value.length)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-6">
        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="开始创作您的故事..."
          className="min-h-[600px] literary-body text-base resize-none"
        />
      </div>

      <div className="border-t border-border/50 p-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          字数：{wordCount.toLocaleString()}
        </div>
        <Button onClick={() => onSave(content)}>
          <Save className="h-4 w-4 mr-2" />
          保存
        </Button>
      </div>
    </div>
  )
}
