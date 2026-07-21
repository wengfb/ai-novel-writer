'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Shuffle, RefreshCw, Loader2 } from 'lucide-react'
import type { StoryIdeaCard } from '@/types'
import { AUDIENCE_OPTIONS, GENRE_OPTIONS, TONE_OPTIONS } from './step1/constants'
import { FilterRow } from './step1/filter-row'
import { StoryCardCarousel } from './step1/story-card-carousel'

interface OnboardingStep1WelcomeProps {
  onNext: (idea: StoryIdeaCard, preferences?: { audience?: string; genre?: string; tone?: string }) => void
  onSwitchToManual?: () => void
}

export function OnboardingStep1Welcome({ onNext, onSwitchToManual }: OnboardingStep1WelcomeProps) {
  const [customRequirements, setCustomRequirements] = useState('')
  const [isRandomLoading, setIsRandomLoading] = useState(false)
  const [audience, setAudience] = useState('')
  const [genre, setGenre] = useState('')
  const [tone, setTone] = useState('')
  const [cards, setCards] = useState<StoryIdeaCard[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasGenerated, setHasGenerated] = useState(false)

  const activeFilterCount = [audience, genre, tone].filter(Boolean).length

  const handleRandomIdea = async () => {
    setIsRandomLoading(true)
    setError(null)
    setCards([])
    setSelectedId(null)

    try {
      const response = await fetch('/api/ai/random-story-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audience,
          genre,
          tone,
          customRequirements: customRequirements.trim() || undefined,
        }),
      })
      const result = await response.json()
      if (result.success && result.data?.cards && result.data.cards.length > 0) {
        setCards(result.data.cards)
        setHasGenerated(true)
      } else {
        setError(result.error || '生成失败，请重试')
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setIsRandomLoading(false)
    }
  }

  const handleNext = () => {
    const selected = cards.find(c => c.id === selectedId)
    if (selected) {
      onNext(selected, {
        audience: audience || undefined,
        genre: genre || undefined,
        tone: tone || undefined,
      })
    }
  }

  return (
    <div className="flex flex-col min-h-[600px] px-8 py-6">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* 标题区域 —— 仅生成前显示 */}
        {!hasGenerated && (
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="p-4 bg-primary/10 rounded-full">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              你想写个什么故事？
            </h1>
            <p className="text-muted-foreground">
              设置筛选条件，让 AI 随机生成 3 个创意方向供你选择
            </p>
          </div>
        )}

        {/* 筛选 + 自定义要求 —— 仅生成前显示 */}
        {!hasGenerated && (
          <div className="space-y-3">
            {/* 筛选选项平铺 */}
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

            {/* 自定义要求 */}
            <div>
              <span className="text-sm font-medium">自定义要求 <span className="text-muted-foreground text-xs">（可选）</span></span>
              <Textarea
                id="custom-requirements"
                placeholder="例如：我希望主角是女性，故事发生在现代都市，带一点悬疑元素..."
                value={customRequirements}
                onChange={(e) => setCustomRequirements(e.target.value)}
                className="mt-2 min-h-[80px] text-sm resize-none"
              />
            </div>

            {/* 随机生成按钮居中 */}
            <div className="flex justify-center">
              <Button
                type="button"
                size="lg"
                onClick={handleRandomIdea}
                disabled={isRandomLoading}
                className="px-8"
              >
                <Shuffle className="mr-2 h-4 w-4" />
                {isRandomLoading ? '生成中...' : '随机生成创意'}
                {activeFilterCount > 0 && (
                  <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20 text-xs">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* 生成后顶部工具栏 */}
        {hasGenerated && !isRandomLoading && (
          <>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setHasGenerated(false)}
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                ← 返回修改
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRandomIdea}
                disabled={isRandomLoading}
                title="重新生成"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              已为你生成 {cards.length} 个创意方向，请选择一个
            </p>
          </>
        )}

        {/* 加载状态 */}
        {isRandomLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">AI 正在为你构思 3 个创意方向...</p>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-center text-sm">
            <p>{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={handleRandomIdea}>
              重试
            </Button>
          </div>
        )}

        {/* 创意卡片轮播 */}
        {hasGenerated && cards.length > 0 && !isRandomLoading && (
          <StoryCardCarousel
            cards={cards}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        )}

        {/* 无结果提示 */}
        {hasGenerated && cards.length === 0 && !isRandomLoading && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <p>未能生成有效创意，请调整筛选条件后重试</p>
          </div>
        )}

        {/* 底部按钮 */}
        <div className="flex justify-between items-center pt-2">
          <div />
          <div className="flex flex-col items-end gap-2">
            {hasGenerated && cards.length > 0 && (
              <Button
                onClick={handleNext}
                disabled={!selectedId}
                size="lg"
                className="px-8"
              >
                下一步
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            )}
            {onSwitchToManual && (
              <button
                type="button"
                onClick={onSwitchToManual}
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                手动创建项目
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
