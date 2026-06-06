'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Shuffle, RefreshCw, Loader2, Check, ChevronLeft, ChevronRight, Globe, User, Target, Flag, Lightbulb, TrendingUp, Play, PenLine } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StoryIdeaCard } from '@/types'

const AUDIENCE_OPTIONS = [
  { value: '', label: '不限' },
  { value: '男频', label: '男频' },
  { value: '女频', label: '女频' },
]

const GENRE_OPTIONS = [
  { value: '', label: '不限' },
  { value: '玄幻修仙', label: '玄幻修仙' },
  { value: '都市', label: '都市' },
  { value: '科幻', label: '科幻' },
  { value: '悬疑灵异', label: '悬疑灵异' },
  { value: '历史', label: '历史' },
  { value: '游戏异界', label: '游戏异界' },
  { value: '末世', label: '末世' },
]

const TONE_OPTIONS = [
  { value: '', label: '不限' },
  { value: '热血爽文', label: '热血爽文' },
  { value: '轻松搞笑', label: '轻松搞笑' },
  { value: '正剧严肃', label: '正剧严肃' },
  { value: '悬疑惊悚', label: '悬疑惊悚' },
  { value: '温馨治愈', label: '温馨治愈' },
]

const POV_OPTIONS = [
  { value: '' as const, label: '不限' },
  { value: 'first_person' as const, label: '第一人称' },
  { value: 'third_person' as const, label: '第三人称' },
  { value: 'multiple_pov' as const, label: '多视角' },
]

type StoryIdeaFieldKey = Exclude<keyof StoryIdeaCard, 'id' | 'title'>

const CARD_FIELD_ICONS: Record<StoryIdeaFieldKey, React.ReactNode> = {
  genre: <BookOpenIcon className="h-3.5 w-3.5 flex-shrink-0" />,
  worldBuilding: <Globe className="h-3.5 w-3.5 flex-shrink-0" />,
  protagonist: <User className="h-3.5 w-3.5 flex-shrink-0" />,
  coreConflict: <Target className="h-3.5 w-3.5 flex-shrink-0" />,
  mainGoal: <Flag className="h-3.5 w-3.5 flex-shrink-0" />,
  highConcept: <Lightbulb className="h-3.5 w-3.5 flex-shrink-0" />,
  sublimation: <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />,
  openingHook: <Play className="h-3.5 w-3.5 flex-shrink-0" />,
}

const CARD_FIELD_LABELS: Record<StoryIdeaFieldKey, string> = {
  genre: '题材',
  worldBuilding: '世界观',
  protagonist: '主角',
  coreConflict: '核心冲突',
  mainGoal: '主线目标',
  highConcept: '高概念梗概',
  sublimation: '内容升华',
  openingHook: '开篇切入点',
}

// 显示顺序
const CARD_FIELD_ORDER: StoryIdeaFieldKey[] = [
  'genre',
  'worldBuilding',
  'protagonist',
  'coreConflict',
  'mainGoal',
  'highConcept',
  'sublimation',
  'openingHook',
]

// BookOpen 可能不存在于 lucide，使用替代方案
function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  )
}

interface OnboardingStep1WelcomeProps {
  onNext: (idea: StoryIdeaCard, preferences?: { audience?: string; genre?: string; tone?: string; pov?: string }) => void
  onSwitchToManual?: () => void
}

export function OnboardingStep1Welcome({ onNext, onSwitchToManual }: OnboardingStep1WelcomeProps) {
  const [customRequirements, setCustomRequirements] = useState('')
  const [isRandomLoading, setIsRandomLoading] = useState(false)
  const [audience, setAudience] = useState('')
  const [genre, setGenre] = useState('')
  const [tone, setTone] = useState('')
  const [pov, setPov] = useState('')
  const [cards, setCards] = useState<StoryIdeaCard[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasGenerated, setHasGenerated] = useState(false)

  const activeFilterCount = [audience, genre, tone, pov].filter(Boolean).length

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
          pov,
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
        pov: pov || undefined,
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
              <FilterRow
                label="叙事人称"
                options={POV_OPTIONS}
                value={pov}
                onChange={setPov}
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

// 筛选行组件
function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs text-muted-foreground shrink-0 mr-1">{label}</span>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-2.5 py-0.5 rounded-full text-xs border transition-colors',
            value === opt.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-transparent hover:bg-muted border-border'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// 单张故事创意卡片
function StoryIdeaCardComponent({
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
function StoryCardCarousel({
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
