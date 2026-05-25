'use client'

import { useChapters, useCurrentChapter } from '@/hooks/use-chapters'
import { ChapterItem } from './chapter-item'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useChapterStore } from '@/lib/store/chapter-store'
import { toast } from 'sonner'

interface ChapterListProps {
  projectId: string
  onCreateChapter?: () => void
}

export function ChapterList({ projectId, onCreateChapter }: ChapterListProps) {
  const { chapters, isLoading } = useChapters(projectId)
  const { currentChapter, setCurrentChapter } = useCurrentChapter()
  const deleteChapter = useChapterStore((s) => s.deleteChapter)
  const fetchChapters = useChapterStore((s) => s.fetchChapters)

  const handleDelete = async (chapter: { id: string }) => {
    try {
      await deleteChapter(projectId, chapter.id)
      toast.success('章节已删除')
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除失败'
      toast.error(message)
      // 重新获取列表以恢复正确状态
      fetchChapters(projectId)
    }
  }

  if (isLoading) {
    return <ChapterListSkeleton />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onCreateChapter}
        >
          <Plus className="mr-2 h-4 w-4" />
          新建章节
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {chapters.map((chapter) => (
            <ChapterItem
              key={chapter.id}
              chapter={chapter}
              isActive={currentChapter?.id === chapter.id}
              onClick={() => setCurrentChapter(chapter)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function ChapterListSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}
