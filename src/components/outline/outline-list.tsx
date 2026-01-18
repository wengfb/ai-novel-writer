'use client'

import { useState } from 'react'
import { useOutlines, useCurrentOutline } from '@/hooks/use-outlines'
import { OutlineItem } from './outline-item'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { Outline } from '@/lib/store/outline-store'

interface OutlineListProps {
  projectId: string
  onCreateOutline?: (parentId?: string | null, type?: 'volume' | 'chapter' | 'scene') => void
  onEditOutline?: (outline: Outline) => void
  onDeleteOutline?: (outline: Outline) => void
}

export function OutlineList({ projectId, onCreateOutline, onEditOutline, onDeleteOutline }: OutlineListProps) {
  const { outlines, isLoading } = useOutlines(projectId)
  const { currentOutline, setCurrentOutline } = useCurrentOutline()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleSelect = (outline: Outline) => {
    setSelectedId(outline.id)
    setCurrentOutline(outline)
  }

  const handleEdit = (outline: Outline) => {
    if (onEditOutline) {
      onEditOutline(outline)
    }
  }

  const handleDelete = (outline: Outline) => {
    if (onDeleteOutline) {
      onDeleteOutline(outline)
    }
  }

  const handleCreateChild = (parentId: string, type: 'volume' | 'chapter' | 'scene') => {
    if (onCreateOutline) {
      onCreateOutline(parentId, type)
    }
  }

  if (isLoading) {
    return <OutlineListSkeleton />
  }

  if (outlines.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 py-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onCreateOutline?.()}
          >
            <Plus className="mr-2 h-4 w-4" />
            新建大纲
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <p className="text-sm">暂无大纲</p>
            <p className="text-xs mt-1">点击上方按钮创建第一个大纲</p>
          </div>
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 顶部工具栏 */}
      <div className="px-3 py-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onCreateOutline?.()}
        >
          <Plus className="mr-2 h-4 w-4" />
          新建大纲
        </Button>
      </div>

      {/* 大纲列表 */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {outlines.map((outline) => (
            <OutlineItem
              key={outline.id}
              outline={outline}
              level={0}
              isActive={selectedId === outline.id}
              onSelect={handleSelect}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCreateChild={handleCreateChild}
            />
          ))}
        </div>
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
