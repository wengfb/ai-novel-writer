'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, ChevronDown } from 'lucide-react'
import type { Outline } from '@/lib/store/outline-store'
import { cn } from '@/lib/utils'
import { typeConfig } from './type-config'

export function TreeVolumeNode({
  volume,
  isCollapsed,
  onToggleCollapse,
  onSelect,
}: {
  volume: Outline
  isCollapsed: boolean
  onToggleCollapse: () => void
  onSelect: (outline: Outline) => void
}) {
  const config = typeConfig.volume
  const Icon = config.icon

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer',
            'hover:shadow-md transition-all min-w-[120px]',
            config.borderColor,
            config.bgColor
          )}
          onClick={() => onSelect(volume)}
        >
          <div className="flex items-center gap-2">
            <Icon className={cn('h-5 w-5', config.textColor)} />
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleCollapse()
              }}
              className="p-0.5 hover:bg-muted rounded"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
          <span className="font-semibold text-sm text-center">{volume.title}</span>
          <Badge variant="outline" className="text-xs">
            卷
          </Badge>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right">
        <div className="space-y-1 text-sm">
          <p className="font-medium">{volume.title}</p>
          {volume.description && <p className="text-muted-foreground">{volume.description}</p>}
          {volume.chapter && <p>字数：{volume.chapter.wordCount.toLocaleString()}</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
