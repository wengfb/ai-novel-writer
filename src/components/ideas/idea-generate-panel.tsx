'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sparkles, Shuffle, Loader2, RefreshCw,
  ChevronLeft, ChevronRight, Check,
  Globe, User, Target, Flag, Lightbulb, TrendingUp, Play,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { IdeaItem } from '@/types'

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

const FIELD_ICONS: Record<string, React.ReactNode> = {
  genre: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 flex-shrink-0">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  ),
  worldBuilding: <Globe className="h-3.5 w-3.5 flex-shrink-0" />,
  protagonist: <User className="h-3.5 w-3.5 flex-shrink-0" />,
  coreConflict: <Target className="h-3.5 w-3.5 flex-shrink-0" />,
  mainGoal: <Flag className="h-3.5 w-3.5 flex-shrink-0" />,
  highConcept: <Lightbulb className="h-3.5 w-3.5 flex-shrink-0" />,
  sublimation: <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />,
  openingHook: <Play className="h-3.5 w-3.5 flex-shrink-0" />,
}

const FIELD_LABELS: Record<string, string> = {
  genre: '题材',
  worldBuilding: '世界观',
  protagonist: '主角',
  coreConflict: '核心冲突',
  mainGoal: '主线目标',
  highConcept: '高概念梗概',
  sublimation: '内容升华',
  openingHook: '开篇切入点',
}

const FIELD_ORDER = ['genre', 'worldBuilding', 'protagonist', 'coreConflict', 'mainGoal', 'highConcept', 'sublimation', 'openingHook']

/**
 * 生成新创意面板 — 弹窗形式
 * 复用 Onboarding Step1 的筛选 UI 模式
 */
export function IdeaGeneratePanel({
  isGenerating, generatedCards,
  hasExamples, positiveExampleCount, negativeExampleCount,
  onGenerate, onClose, onSelectCard,
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

  const currentCard = generatedCards[currentIndex]

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shuffle className="h-5 w-5" />
            生成新创意
          </DialogTitle>
          <DialogDescription>
            {hasExamples && `AI 已学习 ${positiveExampleCount + negativeExampleCount} 个历史偏好，生成更精准`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 pb-4">
            {/* 筛选条件 — 仅生成前显示 */}
            {!hasGenerated && !isGenerating && (
              <div className="space-y-3">
                <div className="space-y-2.5 p-4 bg-muted/40 rounded-lg">
                  <FilterRow label="目标受众" options={AUDIENCE_OPTIONS} value={audience} onChange={setAudience} />
                  <FilterRow label="题材类型" options={GENRE_OPTIONS} value={genre} onChange={setGenre} />
                  <FilterRow label="故事基调" options={TONE_OPTIONS} value={tone} onChange={setTone} />
                </div>

                <div>
                  <span className="text-sm font-medium">自定义要求 <span className="text-muted-foreground text-xs">（可选）</span></span>
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
                    AI 已参考你 {positiveExampleCount} 个高分创意和 {negativeExampleCount} 个低分创意
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

            {/* 加载状态 */}
            {isGenerating && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">AI 正在为你构思 3 个创意方向...</p>
                {hasExamples && (
                  <p className="text-xs text-muted-foreground">
                    正在参考你的历史偏好进行生成
                  </p>
                )}
              </div>
            )}

            {/* 生成结果轮播 */}
            {hasGenerated && generatedCards.length > 0 && !isGenerating && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setHasGenerated(false)}
                    className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    ← 返回修改
                  </button>
                  <Button variant="ghost" size="icon" onClick={handleGenerate} title="重新生成">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                {/* 轮播指示器 */}
                <div className="flex items-center justify-center gap-2">
                  {generatedCards.map((_, index) => (
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

                {/* 卡片 */}
                {currentCard && (
                  <div className="relative px-8">
                    <Button
                      variant="outline" size="icon"
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg"
                      onClick={() => setCurrentIndex(prev => prev === 0 ? generatedCards.length - 1 : prev - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <Card className="cursor-pointer hover:shadow-lg" onClick={() => onSelectCard(currentCard)}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Badge variant="secondary" className="text-xs mb-1">{currentCard.genre}</Badge>
                            <CardTitle className="text-lg">{currentCard.title}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-1.5">
                        {FIELD_ORDER.filter(k => k !== 'genre').map((key) => {
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
                      variant="outline" size="icon"
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg"
                      onClick={() => setCurrentIndex(prev => prev === generatedCards.length - 1 ? 0 : prev + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="text-center text-sm text-muted-foreground">
                  方向 {currentIndex + 1} / {generatedCards.length}
                </div>

                {/* 选择按钮 */}
                <div className="flex justify-center">
                  <Button
                    onClick={() => currentCard && onSelectCard(currentCard)}
                    className="px-8"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    选择此创意
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// 筛选行组件
function FilterRow({
  label, options, value, onChange,
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
