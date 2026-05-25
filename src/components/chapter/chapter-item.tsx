'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { FileText, Trash2 } from 'lucide-react'
import type { Chapter } from '@/lib/store/chapter-store'

interface ChapterItemProps {
  chapter: Chapter
  isActive: boolean
  onClick: () => void
  onDelete: (chapter: Chapter) => void
}

export function ChapterItem({ chapter, isActive, onClick, onDelete }: ChapterItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

  return (
    <>
      <div className={`group flex items-center w-full rounded-md transition-colors ${
        isActive ? 'bg-secondary' : 'hover:bg-muted'
      }`}>
        <Button
          variant={isActive ? 'secondary' : 'ghost'}
          className="flex-1 justify-start h-auto py-2 pr-1"
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
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 mr-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            setShowDeleteDialog(true)
          }}
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「第 {chapter.chapterNumber} 章 {chapter.title}」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(chapter)}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
