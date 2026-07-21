'use client'

import { useMemo, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { GitBranch, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Outline } from '@/lib/store/outline-store'
import type { StatusFilter } from './outline-toolbar'
import { TreeVolumeColumn } from './tree-view/volume-column'

interface OutlineTreeViewProps {
  outlines: Outline[]
  statusFilter: StatusFilter
  onSelectOutline: (outline: Outline) => void
  onCreateOutline: () => void
}

export function OutlineTreeView({
  outlines,
  statusFilter,
  onSelectOutline,
  onCreateOutline,
}: OutlineTreeViewProps) {
  const [collapsedVolumes, setCollapsedVolumes] = useState<Set<string>>(new Set())

  const filterNode = (node: Outline): boolean => {
    if (statusFilter === 'all') return true
    if (node.status === statusFilter) return true
    return node.children?.some(filterNode) ?? false
  }

  const filteredOutlines = useMemo(
    () => outlines.filter(filterNode),
    [outlines, statusFilter]
  )

  if (outlines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground gap-4">
        <GitBranch className="h-12 w-12 opacity-20" />
        <div className="text-center">
          <p className="text-sm font-medium">还没有大纲</p>
          <p className="text-xs mt-1">
            使用工具栏的「新建大纲」或「AI 生成」来创建第一个大纲节点
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onCreateOutline}>
          <Plus className="mr-1.5 h-4 w-4" />
          新建大纲
        </Button>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-6 flex gap-0 min-w-max">
        {filteredOutlines.map((volume, vi) => {
          const filteredChapters = (volume.children || []).filter(filterNode)
          const isCollapsed = collapsedVolumes.has(volume.id)

          return (
            <TreeVolumeColumn
              key={volume.id}
              volume={volume}
              isFirst={vi === 0}
              chapters={filteredChapters}
              isCollapsed={isCollapsed}
              onToggleCollapse={() => {
                setCollapsedVolumes((prev) => {
                  const next = new Set(prev)
                  if (next.has(volume.id)) next.delete(volume.id)
                  else next.add(volume.id)
                  return next
                })
              }}
              onSelectOutline={onSelectOutline}
              statusFilter={statusFilter}
            />
          )
        })}
      </div>
    </ScrollArea>
  )
}
