'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'
import type { Chapter } from '@/lib/store/chapter-store'

interface ChapterItemProps {
  chapter: Chapter
  isActive: boolean
  onClick: () => void
}

export function ChapterItem({ chapter, isActive, onClick }: ChapterItemProps) {
  return (
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      className="w-full justify-start h-auto py-2"
      onClick={onClick}
    >
      <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
      <div className="flex-1 text-left min-w-0">
        <div className="font-medium text-sm">第 {chapter.chapterNumber} 章</div>
        <div className="text-xs text-muted-foreground truncate">
          {chapter.title}
        </div>
      </div>
      <Badge variant="outline" className="ml-2 flex-shrink-0">
        {chapter.wordCount}
      </Badge>
    </Button>
  )
}
