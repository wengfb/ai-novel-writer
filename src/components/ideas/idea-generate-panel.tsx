'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Shuffle, Loader2, Info } from 'lucide-react'
import type { IdeaItem } from '@/types'
import { AUDIENCE_OPTIONS, GENRE_OPTIONS, TONE_OPTIONS } from './generate-panel/constants'
import { FilterRow } from './generate-panel/filter-row'
import { GeneratedCardsCarousel } from './generate-panel/generated-carousel'

interface IdeaGeneratePanelProps {
  isGenerating: boolean
  generatedCards: IdeaItem[]
  hasExamples: boolean
  positiveExampleCount: number
  negativeExampleCount: number
  onGenerate: (prefs: {
    audience?: string
    genre?: string
    tone?: string
    customRequirements?: string
  }) => Promise<void>
  onClose: () => void
  onSelectCard: (card: IdeaItem) => void
}

/**
 * 生成新创意面板 — 弹窗形式
 * 复用 Onboarding Step1 的筛选 UI 模式
 */
export function IdeaGeneratePanel({
  isGenerating,
  generatedCards,
  hasExamples,
  positiveExampleCount,
  negativeExampleCount,
  onGenerate,
  onClose,
  onSelectCard,
}: IdeaGeneratePanelProps) {
  const [audience, setAudience] = useState('')
  const [genre, setGenre] = useState('')
  const [tone, setTone] = useState('')
  const [customRequirements, setCustomRequirements] = useState('')
  const [hasGenerated, setHasGenerated] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const activeFilterCount = [audience, genre, tone].filter(Boolean).length

  const handleGenerate = async () => {
    setHasGenerated(false)
    try {
      await onGenerate({
        audience: audience || undefined,
        genre: genre || undefined,
        tone: tone || undefined,
        customRequirements: customRequirements.trim() || undefined,
      })
      setHasGenerated(true)
      setCurrentIndex(0)
    } catch {
      // error handled by store
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shuffle className="h-5 w-5" />
            生成新创意
          </DialogTitle>
          <DialogDescription>
            {hasExamples &&
              `AI 已学习 ${positiveExampleCount + negativeExampleCount} 个历史偏好，生成更精准`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 pb-4">
            {!hasGenerated && !isGenerating && (
              <div className="space-y-3">
                <div className="space-y-2.5 p-4 bg-muted/40 rounded-lg">
                  <FilterRow
                    label="目标受众"
                    options={AUDIENCE_OPTIONS}
                    value={audience}
                    onChange={setAudience}
                  />
                  <FilterRow
                    label="题材类型"
                    options={GENRE_OPTIONS}
                    value={genre}
                    onChange={setGenre}
                  />
                  <FilterRow
                    label="故事基调"
                    options={TONE_OPTIONS}
                    value={tone}
                    onChange={setTone}
                  />
                </div>

                <div>
                  <span className="text-sm font-medium">
                    自定义要求 <span className="text-muted-foreground text-xs">（可选）</span>
                  </span>
                  <Textarea
                    placeholder="例如：我希望主角是女性，故事发生在现代都市..."
                    value={customRequirements}
                    onChange={(e) => setCustomRequirements(e.target.value)}
                    className="mt-2 min-h-[80px] text-sm resize-none"
                  />
                </div>

                {hasExamples && (
                  <div className="flex items-center gap-2 p-2 bg-blue-500/5 text-blue-600 rounded text-xs">
                    <Info className="h-3.5 w-3.5" />
                    AI 已参考你 {positiveExampleCount} 个高分创意和 {negativeExampleCount}{' '}
                    个低分创意
                  </div>
                )}

                <div className="flex justify-center">
                  <Button size="lg" onClick={handleGenerate} className="px-8">
                    <Shuffle className="mr-2 h-4 w-4" />
                    随机生成创意
                    {activeFilterCount > 0 && (
                      <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20 text-xs">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">AI 正在为你构思 3 个创意方向...</p>
                {hasExamples && (
                  <p className="text-xs text-muted-foreground">正在参考你的历史偏好进行生成</p>
                )}
              </div>
            )}

            {hasGenerated && generatedCards.length > 0 && !isGenerating && (
              <GeneratedCardsCarousel
                cards={generatedCards}
                currentIndex={currentIndex}
                setCurrentIndex={setCurrentIndex}
                onBack={() => setHasGenerated(false)}
                onRegenerate={handleGenerate}
                onSelectCard={onSelectCard}
              />
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
