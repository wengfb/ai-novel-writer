'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Outline } from '@/lib/store/outline-store'
import { cn } from '@/lib/utils'
import { typeConfig } from './type-config'

export function TreeSceneNode({
  scene,
  onSelect,
}: {
  scene: Outline
  onSelect: () => void
}) {
  const config = typeConfig.scene
  const Icon = config.icon

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'flex items-center gap-1.5 px-2 py-2 rounded-md border cursor-pointer',
            'hover:shadow-sm transition-all',
            config.borderColor,
            config.bgColor
          )}
          onClick={onSelect}
        >
          <Icon className={cn('h-3.5 w-3.5', config.textColor)} />
          <span className="text-xs font-medium truncate max-w-[80px]">{scene.title}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right">
        <div className="space-y-1 text-sm">
          <p className="font-medium">{scene.title}</p>
          {scene.description && <p className="text-muted-foreground">{scene.description}</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
