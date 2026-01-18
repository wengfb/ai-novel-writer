'use client'

import { useEffect } from 'react'
import { useAIStore } from '@/lib/store/ai-store'
import { useChapterStore } from '@/lib/store/chapter-store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Box, FileText } from 'lucide-react'

export function ContextPanel() {
  const { currentChapter } = useChapterStore()
  const { context, isLoadingContext, fetchContext } = useAIStore()

  // 当章节切换时，重新获取上下文
  useEffect(() => {
    if (currentChapter) {
      fetchContext(currentChapter.projectId, currentChapter.id)
    }
  }, [currentChapter?.id])

  if (!currentChapter) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>请先选择章节</p>
      </div>
    )
  }

  if (isLoadingContext) {
    return <ContextPanelSkeleton />
  }

  if (!context) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>无法加载上下文信息</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Token 使用量 */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">当前上下文</h3>
          <Badge variant="outline">{context.totalTokens.toLocaleString()} tokens</Badge>
        </div>

        {/* 当前章节 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">当前章节</h4>
          </div>
          <div className="text-sm text-muted-foreground">
            第 {currentChapter.chapterNumber} 章：{currentChapter.title}
          </div>
        </div>

        {/* 活跃角色 */}
        {context.characters.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">活跃角色</h4>
            </div>
            <div className="space-y-2">
              {context.characters.map((character) => (
                <div
                  key={character.id}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                >
                  <span className="text-sm">{character.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {character.role}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 世界观元素 */}
        {context.worldElements.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Box className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">相关世界观</h4>
            </div>
            <div className="space-y-2">
              {context.worldElements.map((element) => (
                <div
                  key={element.id}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                >
                  <span className="text-sm">{element.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {element.type}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}

function ContextPanelSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  )
}
