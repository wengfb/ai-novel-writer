'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Sparkles } from 'lucide-react'

interface OnboardingStep1WelcomeProps {
  onNext: (idea: string) => void
}

export function OnboardingStep1Welcome({ onNext }: OnboardingStep1WelcomeProps) {
  const [idea, setIdea] = useState('')
  const minLength = 10

  const handleNext = () => {
    if (idea.trim().length >= minLength) {
      onNext(idea.trim())
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
            <Label htmlFor="idea" className="text-base">
              故事想法 <span className="text-muted-foreground text-sm">（至少 {minLength} 字）</span>
            </Label>
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
            <p className="text-sm font-medium">💡 提示：可以包含以下内容</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>故事类型（修仙、都市、科幻、玄幻等）</li>
              <li>主角设定（身份、性格、特殊能力）</li>
              <li>核心冲突（主角要面对什么挑战）</li>
              <li>故事亮点（独特的设定或创意）</li>
            </ul>
          </div>
        </div>

        {/* 按钮区域 */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleNext}
            disabled={!isValid}
            className="px-8"
          >
            开始创作
            <Sparkles className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
