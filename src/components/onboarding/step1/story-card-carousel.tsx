'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StoryIdeaCard } from '@/types'
import { StoryIdeaCardComponent } from './story-idea-card'

export function StoryCardCarousel({
  cards,
  selectedId,
  onSelect,
}: {
  cards: StoryIdeaCard[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? cards.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === cards.length - 1 ? 0 : prev + 1))
  }

  const currentCard = cards[currentIndex]
  if (!currentCard) return null

  return (
    <div className="space-y-4">
      {/* 轮播指示器 */}
      <div className="flex items-center justify-center gap-2">
        {cards.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              'h-2 rounded-full transition-all',
              index === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-muted'
            )}
          />
        ))}
      </div>

      {/* 卡片容器 */}
      <div className="relative">
        {/* 左箭头 */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 rounded-full shadow-lg"
          onClick={handlePrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* 卡片 */}
        <div className="px-8">
          <StoryIdeaCardComponent
            card={currentCard}
            isSelected={selectedId === currentCard.id}
            onSelect={() => onSelect(currentCard.id)}
          />
        </div>

        {/* 右箭头 */}
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 rounded-full shadow-lg"
          onClick={handleNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 位置信息 */}
      <div className="text-center text-sm text-muted-foreground">
        方向 {currentIndex + 1} / {cards.length}
      </div>
    </div>
  )
}
