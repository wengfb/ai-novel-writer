'use client'

import { useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ChevronRight, ChevronDown } from 'lucide-react'
import type { Outline } from '@/lib/store/outline-store'
import type { StatusFilter } from '../outline-toolbar'
import { cn } from '@/lib/utils'
import { typeConfig } from './type-config'
import { TreeSceneNode } from './scene-node'

export function TreeChapterRow({
  chapter,
  scenes,
  onSelectOutline,
  statusFilter,
}: {
  chapter: Outline
  scenes: Outline[]
  onSelectOutline: (outline: Outline) => void
  statusFilter: StatusFilter
}) {
  const config = typeConfig.chapter
  const Icon = config.icon
  const [expanded, setExpanded] = useState(false)
  const hasScenes = scenes.length > 0

  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg border cursor-pointer',
                'hover:shadow-md transition-all min-w-[130px]',
                config.borderColor,
                config.bgColor
              )}
              onClick={() => onSelectOutline(chapter)}
            >
              <Icon className={cn('h-4 w-4', config.textColor)} />
              <span className="font-medium text-sm truncate max-w-[100px]">{chapter.title}</span>
              {hasScenes && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpanded(!expanded)
                  }}
                  className="p-0.5 hover:bg-muted rounded shrink-0"
                >
                  {expanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <div className="space-y-1 text-sm max-w-[240px]">
              <p className="font-medium">{chapter.title}</p>
              {chapter.description && (
                <p className="text-muted-foreground">{chapter.description}</p>
              )}
              {chapter.chapter && <p>字数：{chapter.chapter.wordCount.toLocaleString()}</p>}
              {chapter.plotFunction && <p>情节功能：{chapter.plotFunction}</p>}
              {chapter.tensionLevel != null && chapter.tensionLevel > 0 && (
                <p>张力等级：{chapter.tensionLevel}/10</p>
              )}
              {chapter.emotionalGoal && (
                <p className="text-muted-foreground">情感目标：{chapter.emotionalGoal}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>

      {hasScenes && (
        <>
          <div className="w-6 h-px bg-border mx-2" />
          <div className="flex flex-col gap-2">
            {scenes
              .filter((s) => statusFilter === 'all' || s.status === statusFilter)
              .map((scene) => (
                <TreeSceneNode
                  key={scene.id}
                  scene={scene}
                  onSelect={() => onSelectOutline(scene)}
                />
              ))}
          </div>
        </>
      )}
    </div>
  )
}
