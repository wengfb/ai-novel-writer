"use client"

import { useState } from "react"
import { ChapterList } from "@/components/editor/chapter-list"
import { TextEditor } from "@/components/editor/text-editor"
import { AIAssistPanel } from "@/components/editor/ai-assist-panel"

// 模拟数据
const mockChapters = [
  { id: "1", title: "第一章：初入仙门", order: 1, wordCount: 3200 },
  { id: "2", title: "第二章：修炼之路", order: 2, wordCount: 2800 },
  { id: "3", title: "第三章：试炼开始", order: 3, wordCount: 3500 },
]

export function ChapterEditor() {
  const [activeChapterId, setActiveChapterId] = useState(mockChapters[0].id)

  const handleSave = (content: string) => {
    console.log("保存章节内容:", content)
    // TODO: 调用 API 保存
  }

  return (
    <div className="h-[calc(100vh-8rem)] grid grid-cols-[280px_1fr_320px]">
      <ChapterList
        chapters={mockChapters}
        activeChapterId={activeChapterId}
        onChapterSelect={setActiveChapterId}
      />
      <TextEditor chapterId={activeChapterId} onSave={handleSave} />
      <AIAssistPanel />
    </div>
  )
}
