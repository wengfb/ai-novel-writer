'use client'

import { useWorldElements } from '@/hooks/use-world-elements'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Plus, Box, MapPin, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface WorldElementListProps {
  projectId: string
  onCreateElement?: () => void
}

export function WorldElementList({ projectId, onCreateElement }: WorldElementListProps) {
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
        <div className="space-y-2 p-2">
          {worldElements.length === 0 ? (
            <div className="text-center text-muted-foreground py-4 text-sm">
              暂无世界观元素
            </div>
          ) : (
            worldElements.map((element) => (
              <div
                key={element.id}
                className="p-3 rounded-md border bg-card hover:bg-accent cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-2">
                  {getIcon(element.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium text-sm truncate">{element.name}</h4>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {getTypeLabel(element.type)}
                      </Badge>
                    </div>
                    {element.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {element.description}
                      </p>
                    )}
                  </div>
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
