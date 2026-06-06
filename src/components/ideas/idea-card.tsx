'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Star, MessageSquare, Lightbulb, ArrowRight } from 'lucide-react'
import type { IdeaItem } from '@/types'

interface IdeaCardProps {
  idea: IdeaItem
  isSelected: boolean
  onSelect: (idea: IdeaItem) => void
}

const statusBadgeMap: Record<string, { label: string; className: string } | null> = {
  draft: null,
  favorited: { label: '收藏', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  converted: { label: '已用', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
  archived: { label: '归档', className: 'bg-muted text-muted-foreground' },
}

export function IdeaCard({ idea, isSelected, onSelect }: IdeaCardProps) {
  const statusBadge = statusBadgeMap[idea.status]

  return (
    <button
      type="button"
      className={cn(
        'w-full text-left p-3 transition-colors hover:bg-muted/50 border-b last:border-b-0',
        isSelected && 'bg-muted'
      )}
      onClick={() => onSelect(idea)}
    >
      <div className="space-y-1.5">
        {/* 标题行 */}
        <div className="flex items-start gap-2">
          <Lightbulb className={cn(
            'h-4 w-4 mt-0.5 shrink-0',
            isSelected ? 'text-yellow-500' : 'text-muted-foreground'
          )} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{idea.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {idea.highConcept}
            </p>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="flex items-center gap-2 ml-6">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
            {idea.genre}
          </Badge>
          {idea.ratingCount > 0 ? (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              {idea.avgRating.toFixed(1)}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground/50">未评分</span>
          )}
          {idea.commentCount > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {idea.commentCount}
            </span>
          )}
          {statusBadge && (
            <Badge className={cn('text-[10px] px-1.5 py-0 h-5', statusBadge.className)}>
              {statusBadge.label}
            </Badge>
          )}
        </div>
      </div>
    </button>
  )
}
