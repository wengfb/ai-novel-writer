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
    <button
      type="button"
      className="group relative text-left rounded-xl border bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
      onClick={onSelect}
    >
      <span
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-destructive/10 rounded-lg z-10 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(idea.id)
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation()
            onDelete(idea.id)
          }
        }}
      >
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
      </span>

      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {idea.genre}
            </Badge>
            {statusBadge && (
              <Badge className={cn('text-[10px] px-1.5 py-0', statusBadge.className)}>
                {statusBadge.label}
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-sm leading-snug line-clamp-1">{idea.title}</h3>
        </div>

        <div className="flex items-start gap-1.5">
          <Target className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
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
            <span className="text-[10px] text-muted-foreground/50 ml-auto">AI 生成</span>
          ) : (
            <span className="text-[10px] text-amber-600/70 ml-auto">已编辑</span>
          )}
        </div>
      </div>
    </button>
  )
}
