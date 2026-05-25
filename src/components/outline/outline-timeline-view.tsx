'use client'

import { useMemo } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { OutlineTimelineCard } from './outline-timeline-card'
import type { Outline } from '@/lib/store/outline-store'
import type { StatusFilter } from './outline-toolbar'
import { BookOpen, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OutlineTimelineViewProps {
  outlines: Outline[]
  statusFilter: StatusFilter
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
  onSelectOutline: (outline: Outline) => void
  onCreateOutline: () => void
}

export function OutlineTimelineView({
  outlines,
  statusFilter,
  expandedIds,
  onToggleExpand,
  onSelectOutline,
  onCreateOutline,
}: OutlineTimelineViewProps) {
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
        <BookOpen className="h-12 w-12 opacity-20" />
        <div className="text-center">
          <p className="text-sm font-medium">还没有大纲</p>
          <p className="text-xs mt-1">使用工具栏的「新建大纲」或「AI 生成」来创建第一个大纲节点</p>
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
      <div className="p-6 space-y-8">
        {filteredOutlines.map((volume) => (
          <VolumeSection
            key={volume.id}
            volume={volume}
            statusFilter={statusFilter}
            expandedIds={expandedIds}
            onToggleExpand={onToggleExpand}
            onSelectOutline={onSelectOutline}
          />
        ))}
      </div>
    </ScrollArea>
  )
}

function VolumeSection({
  volume,
  statusFilter,
  expandedIds,
  onToggleExpand,
  onSelectOutline,
}: {
  volume: Volume
  statusFilter: StatusFilter
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
  onSelectOutline: (outline: Outline) => void
}) {
  const filterChild = (node: Outline): boolean => {
    if (statusFilter === 'all') return true
    if (node.status === statusFilter) return true
    return node.children?.some(filterChild) ?? false
  }

  const filteredChapters = (volume.children || []).filter(filterChild)

  if (statusFilter !== 'all' && !filterChild(volume) && filteredChapters.length === 0) {
    return null
  }

  const isVolumeExpanded = expandedIds.has(volume.id)
  const isVolumeDimmed = statusFilter !== 'all' && volume.status !== statusFilter

  return (
    <div className="space-y-4">
      {/* Volume header */}
      <div className="flex items-center gap-3 pb-2 border-b-2 border-blue-200 dark:border-blue-800">
        <div className="rounded-lg bg-blue-500/10 p-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold">{volume.title}</h2>
          {volume.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">{volume.description}</p>
          )}
        </div>
      </div>

      {/* Volume card */}
      <OutlineTimelineCard
        outline={volume}
        isExpanded={isVolumeExpanded}
        isDimmed={isVolumeDimmed}
        onToggleExpand={() => onToggleExpand(volume.id)}
        onClick={() => onSelectOutline(volume)}
      />

      {/* Chapters */}
      {isVolumeExpanded && (
        <div className="ml-10 space-y-4">
          {filteredChapters.map((chapter) => (
            <ChapterSection
              key={chapter.id}
              chapter={chapter}
              statusFilter={statusFilter}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onSelectOutline={onSelectOutline}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ChapterSection({
  chapter,
  statusFilter,
  expandedIds,
  onToggleExpand,
  onSelectOutline,
}: {
  chapter: Chapter
  statusFilter: StatusFilter
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
  onSelectOutline: (outline: Outline) => void
}) {
  const scenes = (chapter.children || []).filter((s) => s.type === 'scene')
  const filterScene = (node: Outline): boolean => {
    if (statusFilter === 'all') return true
    return node.status === statusFilter
  }
  const filteredScenes = scenes.filter(filterScene)

  const isChapterExpanded = expandedIds.has(chapter.id)
  const isChapterDimmed = statusFilter !== 'all' && chapter.status !== statusFilter

  if (statusFilter !== 'all' && !filterScene(chapter) && filteredScenes.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <OutlineTimelineCard
        outline={chapter}
        isExpanded={isChapterExpanded}
        isDimmed={isChapterDimmed}
        onToggleExpand={() => onToggleExpand(chapter.id)}
        onClick={() => onSelectOutline(chapter)}
      />

      {/* Scenes */}
      {isChapterExpanded && filteredScenes.length > 0 && (
        <div className="ml-10 space-y-2">
          {filteredScenes.map((scene) => (
            <OutlineTimelineCard
              key={scene.id}
              outline={scene}
              isExpanded={false}
              isDimmed={statusFilter !== 'all' && scene.status !== statusFilter}
              onToggleExpand={() => onToggleExpand(scene.id)}
              onClick={() => onSelectOutline(scene)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Local type alias for cleaner code
type Volume = Outline
type Chapter = Outline
