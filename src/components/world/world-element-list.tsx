'use client'

import { useWorldElements } from '@/hooks/use-world-elements'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Plus, Box, MapPin, Zap, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type WorldElement } from '@/lib/store/world-store'

interface WorldElementListProps {
  projectId: string
  onCreateElement?: () => void
  onEditElement?: (element: WorldElement) => void
  onDeleteElement?: (element: WorldElement) => void
}

export function WorldElementList({
  projectId,
  onCreateElement,
  onEditElement,
  onDeleteElement
}: WorldElementListProps) {
  const { worldElements, isLoading } = useWorldElements(projectId)

  if (isLoading) {
    return <WorldElementListSkeleton />
  }

  // 防止 worldElements 为 undefined
  if (!worldElements) {
    return <WorldElementListSkeleton />
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'location':
        return <MapPin className="h-4 w-4 text-muted-foreground" />
      case 'system':
        return <Zap className="h-4 w-4 text-muted-foreground" />
      default:
        return <Box className="h-4 w-4 text-muted-foreground" />
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
      default:
        return '其他'
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onCreateElement}
        >
          <Plus className="mr-2 h-4 w-4" />
          新建世界观
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1.5 p-2 w-full box-border overflow-hidden">
          {worldElements.length === 0 ? (
            <div className="text-center text-muted-foreground py-4 text-sm">
              暂无世界观元素
            </div>
          ) : (
            worldElements.map((element) => (
              <div
                key={element.id}
                className="group relative flex items-center gap-1 px-2 py-1.5 rounded-md border bg-card hover:bg-accent transition-colors max-w-full overflow-hidden"
              >
                {getIcon(element.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 w-full max-w-full">
                    <h4 className="font-medium text-sm truncate flex-1 max-w-full">{element.name}</h4>
                    <Badge variant="secondary" className="text-xs shrink-0 text-[10px] px-1 py-0">
                      {getTypeLabel(element.type)}
                    </Badge>
                    {(onEditElement || onDeleteElement) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 -mr-1 shrink-0"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onEditElement && (
                            <DropdownMenuItem onClick={() => onEditElement(element)}>
                              <Pencil className="h-3.5 w-3.5 mr-2" />
                              编辑
                            </DropdownMenuItem>
                          )}
                          {onDeleteElement && (
                            <DropdownMenuItem
                              onClick={() => onDeleteElement(element)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              删除
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  {element.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-tight max-w-full">
                      {element.description}
                    </p>
                  )}
                </div>
              </div>
            ))
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
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  )
}
