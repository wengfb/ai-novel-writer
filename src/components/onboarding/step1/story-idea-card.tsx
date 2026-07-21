'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StoryIdeaCard } from '@/types'
import { CARD_FIELD_ICONS, CARD_FIELD_LABELS, CARD_FIELD_ORDER } from './constants'

export function StoryIdeaCardComponent({
  card,
  isSelected,
  onSelect,
}: {
  card: StoryIdeaCard
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg h-full',
        isSelected && 'ring-2 ring-primary shadow-lg'
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">{card.genre || '未知'}</Badge>
              <span className="text-muted-foreground font-normal text-sm">
                方向 {card.id}
              </span>
            </div>
            <CardTitle className="text-lg leading-snug">{card.title || `方向 ${card.id}`}</CardTitle>
          </div>
          {isSelected && (
            <div className="p-1 bg-primary rounded-full flex-shrink-0">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {CARD_FIELD_ORDER.filter(key => key !== 'genre').map((key) => {
          const value = card[key]
          if (!value) return null
          return (
            <div key={key} className="flex items-start gap-1.5 text-xs">
              <span className="flex items-center gap-1 text-muted-foreground font-medium shrink-0">
                {CARD_FIELD_ICONS[key]}
                {CARD_FIELD_LABELS[key]}：
              </span>
              <span className="leading-relaxed line-clamp-2 min-w-0">
                {value}
              </span>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// 轮播组件
