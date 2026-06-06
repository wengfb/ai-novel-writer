'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IdeaRatingProps {
  ideaId: string
  rating?: number | null
  onRate: (id: string, score: number) => Promise<void>
}

/**
 * 星级评分组件 — 1-5 星
 */
export function IdeaRating({
  ideaId, rating, onRate,
}: IdeaRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRate = async (score: number) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await onRate(ideaId, score)
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayRating = hoverRating || rating || 0

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = displayRating >= star

        return (
          <button
            key={star}
            type="button"
            disabled={isSubmitting}
            className={cn(
              'p-0.5 transition-colors hover:scale-110',
              isSubmitting && 'cursor-not-allowed opacity-60'
            )}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => handleRate(star)}
            title={`${star} 星`}
          >
            <Star
              className={cn(
                'h-6 w-6 transition-colors',
                isFilled
                  ? 'fill-yellow-500 text-yellow-500'
                  : 'text-muted-foreground/30'
              )}
            />
          </button>
        )
      })}
      <span className="text-xs text-muted-foreground ml-1 min-w-[3em]">
        {rating ? `${rating}星` : '暂无'}
      </span>
    </div>
  )
}
