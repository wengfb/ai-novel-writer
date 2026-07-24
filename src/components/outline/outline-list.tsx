'use client'

import { useOutlines, useCurrentOutline } from '@/hooks/use-outlines'
import { OutlineItem } from './outline-item'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Plus, Sparkles } from 'lucide-react'
import type { Outline } from '@/lib/store/outline-store'
import { useUIStore } from '@/lib/store/ui-store'

interface OutlineListProps {
  projectId: string
  onCreateOutline?: (parentId?: string | null, type?: 'volume' | 'chapter' | 'scene') => void
  onSelectOutline?: (outline: Outline) => void
  onDeleteOutline?: (outline: Outline) => void
  onGenerateOutline?: () => void
}

/** 左侧大纲树：仅导航与操作入口，详情在中间区 */
export function OutlineList({
  projectId,
  onCreateOutline,
  onSelectOutline,
  onDeleteOutline,
  onGenerateOutline,
}: OutlineListProps) {
  const { outlines, isLoading } = useOutlines(projectId)
  const { setCurrentOutline } = useCurrentOutline()
  const outlineEditPayload = useUIStore((s) => s.outlineEditPayload)
  const selectedId = outlineEditPayload?.editingOutline?.id ?? null

  const handleSelect = (outline: Outline) => {
    setCurrentOutline(outline)
    onSelectOutline?.(outline)
  }

  const handleCreateChild = (parentId: string, type: 'volume' | 'chapter' | 'scene') => {
    onCreateOutline?.(parentId, type)
  }

  if (isLoading) {
    return <OutlineListSkeleton />
  }

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-1.5 px-3 py-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onCreateOutline?.()}
        >
          <Plus className="mr-2 h-4 w-4" />
          新建大纲
        </Button>
        {onGenerateOutline && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={onGenerateOutline}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            AI 生成
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        {outlines.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center px-3 text-center text-muted-foreground">
            <p className="text-sm">暂无大纲</p>
            <p className="mt-1 text-xs">新建节点或使用 AI 生成</p>
          </div>
        ) : (
          <div className="box-border w-full space-y-1 overflow-hidden p-2">
            {outlines.map((outline) => (
              <OutlineItem
                key={outline.id}
                outline={outline}
                level={0}
                isActive={selectedId === outline.id}
                onSelect={handleSelect}
                onEdit={handleSelect}
                onDelete={onDeleteOutline}
                onCreateChild={handleCreateChild}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

function OutlineListSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}
