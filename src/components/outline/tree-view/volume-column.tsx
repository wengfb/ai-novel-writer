'use client'

import type { Outline } from '@/lib/store/outline-store'
import type { StatusFilter } from '../outline-toolbar'
import { cn } from '@/lib/utils'
import { TreeVolumeNode } from './volume-node'
import { TreeChapterRow } from './chapter-row'

export function TreeVolumeColumn({
  volume,
  isFirst,
  chapters,
  isCollapsed,
  onToggleCollapse,
  onSelectOutline,
  statusFilter,
}: {
  volume: Outline
  isFirst: boolean
  chapters: Outline[]
  isCollapsed: boolean
  onToggleCollapse: () => void
  onSelectOutline: (outline: Outline) => void
  statusFilter: StatusFilter
}) {
  return (
    <div className={cn('flex items-start', !isFirst && 'ml-8')}>
      <div className="flex flex-col items-center">
        <TreeVolumeNode
          volume={volume}
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
          onSelect={onSelectOutline}
        />
      </div>

      {!isCollapsed && chapters.length > 0 && (
        <>
          <div className="flex items-center mx-4">
            <div className="h-px w-8 bg-border" />
          </div>

          <div className="flex flex-col gap-4">
            {chapters.map((chapter) => {
              const filteredScenes = (chapter.children || []).filter(
                (s) => statusFilter === 'all' || s.status === statusFilter
              )
              return (
                <TreeChapterRow
                  key={chapter.id}
                  chapter={chapter}
                  scenes={filteredScenes}
                  onSelectOutline={onSelectOutline}
                  statusFilter={statusFilter}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
