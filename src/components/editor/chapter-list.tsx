"use client"

import { FileText, ChevronRight } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Chapter {
  id: string
  title: string
  order: number
  wordCount: number
}

interface ChapterListProps {
  chapters: Chapter[]
  activeChapterId?: string
  onChapterSelect: (chapterId: string) => void
}

export function ChapterList({
  chapters,
  activeChapterId,
  onChapterSelect,
}: ChapterListProps) {
  return (
    <div className="h-full flex flex-col border-r border-border/50">
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold">章节列表</h3>
        <p className="text-xs text-muted-foreground mt-1">
          共 {chapters.length} 章
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {chapters.map((chapter) => (
            <Button
              key={chapter.id}
              variant="ghost"
              className={cn(
                "w-full justify-start text-left h-auto py-3",
                activeChapterId === chapter.id && "bg-accent"
              )}
              onClick={() => onChapterSelect(chapter.id)}
            >
              <div className="flex items-start gap-2 w-full">
                <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{chapter.title}</div>
                  <div className="text-xs text-muted-foreground">
                    第 {chapter.order} 章 · {chapter.wordCount} 字
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
