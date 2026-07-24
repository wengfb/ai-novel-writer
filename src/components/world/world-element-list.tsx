'use client'

import { useWorldElements } from '@/hooks/use-world-elements'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Plus, Box, MapPin, Zap, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { type WorldElement } from '@/lib/store/world-store'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/lib/store/ui-store'

interface WorldElementListProps {
  projectId: string
  onCreateElement?: () => void
  onSelectElement?: (element: WorldElement) => void
  onDeleteElement?: (element: WorldElement) => void
  selectedId?: string | null
}

export function WorldElementList({
  projectId,
  onCreateElement,
  onSelectElement,
  onDeleteElement,
  selectedId,
}: WorldElementListProps) {
  const { worldElements, isLoading } = useWorldElements(projectId)
  const worldEditPayload = useUIStore((s) => s.worldEditPayload)
  const activeId = selectedId ?? worldEditPayload?.element?.id ?? null

  if (isLoading || !worldElements) {
    return <WorldElementListSkeleton />
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'location':
        return <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      case 'system':
      case 'magic':
        return <Zap className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      default:
        return <Box className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'location':
        return '地点'
      case 'system':
        return '体系'
      case 'item':
        return '物品'
      case 'organization':
        return '组织'
      case 'history':
        return '历史'
      case 'magic':
        return '魔法'
      default:
        return '其他'
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-3 py-2">
        <Button variant="outline" size="sm" className="w-full" onClick={onCreateElement}>
          <Plus className="mr-2 h-4 w-4" />
          新建世界观
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {worldElements.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              暂无世界观元素
            </div>
          ) : (
            worldElements.map((element) => {
              const active = activeId === element.id
              return (
                <div
                  key={element.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectElement?.(element)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectElement?.(element)
                    }
                  }}
                  className={cn(
                    'group flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 transition-colors',
                    active
                      ? 'border-primary/40 bg-primary/10'
                      : 'bg-card hover:bg-accent'
                  )}
                >
                  {getIcon(element.type)}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-sm font-medium">{element.name}</span>
                      <Badge
                        variant="secondary"
                        className="shrink-0 px-1 py-0 text-[10px]"
                      >
                        {getTypeLabel(element.type)}
                      </Badge>
                    </div>
                  </div>
                  {onDeleteElement && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteElement(element)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function WorldElementListSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}
