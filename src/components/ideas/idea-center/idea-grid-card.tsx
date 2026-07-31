'use client'

import { Badge } from '@/components/ui/badge'
import { Trash2, Star, MessageSquare, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { IdeaItem } from '@/types'
import { statusBadgeMap } from './constants'

/** 创意中心网格卡片 */
export function IdeaGridCard({
  idea,
  onSelect,
  onDelete,
}: {
  idea: IdeaItem
  onSelect: () => void
  onDelete: (id: string) => void
}) {
  const statusBadge = statusBadgeMap[idea.status]

  return (
    // 外层用 article 承载布局；打开与删除是并列的两个 button，避免 button 嵌套与错误 accessible name。
    <article className="group relative rounded-xl border bg-card transition-all hover:border-primary/30 hover:shadow-md">
      <button
        type="button"
        aria-label={`删除创意：${idea.title}`}
        className="absolute top-2 right-2 z-10 cursor-pointer rounded-lg p-1.5 opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100 focus-visible:opacity-100"
        onClick={() => onDelete(idea.id)}
      >
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
      </button>

      <button
        type="button"
        aria-label={`打开创意：${idea.title}`}
        className="w-full cursor-pointer rounded-xl p-4 pr-10 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onSelect}
      >
        <div className="space-y-3">
          <div>
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                {idea.genre}
              </Badge>
              {statusBadge && (
                <Badge className={cn('px-1.5 py-0 text-[10px]', statusBadge.className)}>
                  {statusBadge.label}
                </Badge>
              )}
            </div>
            <h3 className="line-clamp-1 text-sm font-semibold leading-snug">{idea.title}</h3>
          </div>

          <div className="flex items-start gap-1.5">
            <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {idea.coreConflict}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            {idea.rating ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                {idea.rating}星
              </span>
            ) : (
              <span className="text-xs text-muted-foreground/50">未评分</span>
            )}
            {idea.commentCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                {idea.commentCount}
              </span>
            )}
            {idea.aiGenerated ? (
              <span className="ml-auto text-[10px] text-muted-foreground/50">AI 生成</span>
            ) : (
              <span className="ml-auto text-[10px] text-amber-600/70">已编辑</span>
            )}
          </div>
        </div>
      </button>
    </article>
  )
}
