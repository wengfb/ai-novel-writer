'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Sparkles, Shuffle, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

interface OnboardingStep1WelcomeProps {
  onNext: (idea: string) => void
  onSwitchToManual?: () => void
}

export function OnboardingStep1Welcome({ onNext, onSwitchToManual }: OnboardingStep1WelcomeProps) {
  const [idea, setIdea] = useState('')
  const [isRandomLoading, setIsRandomLoading] = useState(false)
  const [audience, setAudience] = useState('')
  const [genre, setGenre] = useState('')
  const [tone, setTone] = useState('')
  const activeFilterCount = [audience, genre, tone].filter(Boolean).length
  const minLength = 10

  const handleNext = () => {
    if (idea.trim().length >= minLength) {
      onNext(idea.trim())
    }
  }

  const handleRandomIdea = async () => {
    setIsRandomLoading(true)
    try {
      const response = await fetch('/api/ai/random-story-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audience, genre, tone }),
      })
      const result = await response.json()
      if (result.success && result.data?.idea) {
        setIdea(result.data.idea)
      } else {
        toast.error('生成失败，请重试')
      }
    } catch {
      toast.error('网络错误，请重试')
    } finally {
      setIsRandomLoading(false)
    }
  }

  const isValid = idea.trim().length >= minLength

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* 标题区域 */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            你想写个什么故事？
          </h1>
          <p className="text-lg text-muted-foreground">
            告诉我你的想法，AI 将帮你构思完整的故事框架
          </p>
        </div>

        {/* 输入区域 */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="idea" className="text-base">
                故事想法 <span className="text-muted-foreground text-sm">（至少 {minLength} 字）</span>
              </Label>
              <div className="flex items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRandomIdea}
                  disabled={isRandomLoading}
                  className="rounded-r-none border-r-0"
                >
                  <Shuffle className="mr-1.5 h-3.5 w-3.5" />
                  {isRandomLoading ? '生成中...' : '随机生成'}
                  {activeFilterCount > 0 && (
                    <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-l-none px-1.5"
                      disabled={isRandomLoading}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={6}
                    className="w-72 p-3 space-y-3"
                    onClick={(e) => e.stopPropagation()}
                  >
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
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <Textarea
              id="idea"
              placeholder="例如：一个现代程序员穿越到修仙世界，发现修炼功法可以用代码优化..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="min-h-[200px] text-base resize-none"
              autoFocus
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {idea.length < minLength
                  ? `还需要 ${minLength - idea.length} 字`
                  : '✓ 字数充足'}
              </span>
              <span>{idea.length} 字</span>
            </div>
          </div>

          {/* 示例提示 */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <p className="text-sm font-medium">提示：可以包含以下内容</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>故事类型（修仙、都市、科幻、玄幻等）</li>
              <li>主角设定（身份、性格、特殊能力）</li>
              <li>核心冲突（主角要面对什么挑战）</li>
              <li>故事亮点（独特的设定或创意）</li>
            </ul>
          </div>
        </div>

        {/* 按钮区域 */}
        <div className="flex flex-col items-center gap-4">
          <Button
            size="lg"
            onClick={handleNext}
            disabled={!isValid}
            className="px-8"
          >
            开始创作
            <Sparkles className="ml-2 h-4 w-4" />
          </Button>
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
  )
}

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
