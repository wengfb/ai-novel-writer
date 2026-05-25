'use client'

import { useState, useCallback } from 'react'
import { useOutlines } from '@/hooks/use-outlines'
import { OutlineToolbar } from './outline-toolbar'
import { OutlineTimelineView } from './outline-timeline-view'
import { OutlineTreeView } from './outline-tree-view'
import { OutlineDialog } from './outline-dialog'
import { OutlineGenerateDialog } from './outline-generate-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import type { Outline } from '@/lib/store/outline-store'
import type { ViewMode, StatusFilter } from './outline-toolbar'

interface OutlineVisualizationProps {
  projectId: string
}

export function OutlineVisualization({ projectId }: OutlineVisualizationProps) {
  const { outlines, isLoading, error, refetch } = useOutlines(projectId)

  const [viewMode, setViewMode] = useState<ViewMode>('timeline')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Default expand all
    return new Set()
  })

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingOutline, setEditingOutline] = useState<Outline | null>(null)
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)

  const handleSelectOutline = useCallback((outline: Outline) => {
    setEditingOutline(outline)
    setIsDialogOpen(true)
  }, [])

  const handleCreateOutline = useCallback(() => {
    setEditingOutline(null)
    setIsDialogOpen(true)
  }, [])

  const handleExpandAll = useCallback(() => {
    const allIds = new Set<string>()
    const collectIds = (nodes: Outline[]) => {
      for (const node of nodes) {
        allIds.add(node.id)
        if (node.children) collectIds(node.children)
      }
    }
    collectIds(outlines)
    setExpandedIds(allIds)
  }, [outlines])

  const handleCollapseAll = useCallback(() => {
    setExpandedIds(new Set())
  }, [])

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleGenerateComplete = useCallback(async () => {
    await refetch()
    setIsGenerateDialogOpen(false)
  }, [refetch])

  if (isLoading) {
    return <OutlineVisualizationSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground gap-4">
        <p className="text-sm text-destructive">加载大纲失败：{error}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          重试
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <OutlineToolbar
        viewMode={viewMode}
        statusFilter={statusFilter}
        onViewModeChange={setViewMode}
        onStatusFilterChange={setStatusFilter}
        onCreateOutline={handleCreateOutline}
        onGenerateOutline={() => setIsGenerateDialogOpen(true)}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
      />

      {viewMode === 'timeline' ? (
        <OutlineTimelineView
          outlines={outlines}
          statusFilter={statusFilter}
          expandedIds={expandedIds}
          onToggleExpand={handleToggleExpand}
          onSelectOutline={handleSelectOutline}
          onCreateOutline={handleCreateOutline}
        />
      ) : (
        <OutlineTreeView
          outlines={outlines}
          statusFilter={statusFilter}
          onSelectOutline={handleSelectOutline}
          onCreateOutline={handleCreateOutline}
        />
      )}

      <OutlineDialog
        projectId={projectId}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingOutline={editingOutline}
      />

      <OutlineGenerateDialog
        projectId={projectId}
        open={isGenerateDialogOpen}
        onOpenChange={setIsGenerateDialogOpen}
        onComplete={handleGenerateComplete}
      />
    </div>
  )
}

function OutlineVisualizationSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-3 border-b">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-[110px]" />
        <Skeleton className="h-8 w-40" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  )
}
