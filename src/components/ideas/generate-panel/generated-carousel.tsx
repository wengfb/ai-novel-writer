'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Check, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { IdeaItem } from '@/types'
import { FIELD_ICONS, FIELD_LABELS, FIELD_ORDER } from './constants'

interface GeneratedCardsCarouselProps {
  cards: IdeaItem[]
  currentIndex: number
  setCurrentIndex: (index: number | ((prev: number) => number)) => void
  onBack: () => void
  onRegenerate: () => void
  onSelectCard: (card: IdeaItem) => void
}

/** 生成结果轮播 */
export function GeneratedCardsCarousel({
  cards,
  currentIndex,
  setCurrentIndex,
  onBack,
  onRegenerate,
  onSelectCard,
}: GeneratedCardsCarouselProps) {
  const currentCard = cards[currentIndex]
  if (!currentCard) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          ← 返回修改
        </button>
        <Button variant="ghost" size="icon" onClick={onRegenerate} title="重新生成">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

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

      <div className="relative px-8">
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg"
          onClick={() =>
            setCurrentIndex((prev) => (prev === 0 ? cards.length - 1 : prev - 1))
          }
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Card className="cursor-pointer hover:shadow-lg" onClick={() => onSelectCard(currentCard)}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Badge variant="secondary" className="text-xs mb-1">
                  {currentCard.genre}
                </Badge>
                <CardTitle className="text-lg">{currentCard.title}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {FIELD_ORDER.filter((k) => k !== 'genre').map((key) => {
              const value = (currentCard as any)[key]
              if (!value) return null
              return (
                <div key={key} className="flex items-start gap-1.5 text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground font-medium shrink-0">
                    {FIELD_ICONS[key]}
                    {FIELD_LABELS[key]}：
                  </span>
                  <span className="leading-relaxed line-clamp-2">{value}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg"
          onClick={() =>
            setCurrentIndex((prev) => (prev === cards.length - 1 ? 0 : prev + 1))
          }
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        方向 {currentIndex + 1} / {cards.length}
      </div>

      <div className="flex justify-center">
        <Button onClick={() => onSelectCard(currentCard)} className="px-8">
          <Check className="mr-2 h-4 w-4" />
          选择此创意
        </Button>
      </div>
    </div>
  )
}
