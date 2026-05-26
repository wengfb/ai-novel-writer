'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, Check, Sparkles, Target, User, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreativeDirection {
  id: string
  title: string
  genre: string
  mainConflict: string
  protagonist: {
    name: string
    description: string
  }
  ending: 'open' | 'tragedy' | 'comedy'
  highlights: string[]
  style?: string
}

interface OnboardingStep2BrainstormProps {
  userIdea: string
  onNext: (direction: CreativeDirection) => void
  onBack: () => void
}

export function OnboardingStep2Brainstorm({
  userIdea,
  onNext,
  onBack
}: OnboardingStep2BrainstormProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [directions, setDirections] = useState<CreativeDirection[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const generatingRef = useRef(false)

  // 生成创意方向
  const generateDirections = useCallback(async () => {
    if (generatingRef.current) return
    generatingRef.current = true
    setIsGenerating(true)
    setError(null)
    setDirections([])
    setSelectedId(null)

    const promptText = `你是一个专业的小说创意顾问。用户提供了一个故事想法：

${userIdea}

请基于这个想法，生成 3 个不同的创意方向。每个方向应该：
1. 有独特的切入角度和创新点
2. 包含明确的核心冲突（主角 vs 什么）
3. 设定清晰的主角形象（性格、背景、目标）
4. 提供结局走向建议（开放式/悲剧/喜剧）
5. 突出 2-3 个故事亮点

要求：
- 3 个方向应该风格差异明显（如：热血、黑暗、轻松）
- 每个方向都要有吸引力和可行性
- 标题要简洁有力（4-8 个字）

请以 JSON 格式输出，格式如下：
{
  "directions": [
    {
      "id": "1",
      "title": "故事标题",
      "genre": "修仙|都市|科幻|玄幻|言情|武侠|历史|其他",
      "mainConflict": "核心冲突描述（50-100字）",
      "protagonist": {
        "name": "主角名",
        "description": "主角描述（性格、背景、目标，50-100字）"
      },
      "ending": "open|tragedy|comedy",
      "highlights": ["亮点1", "亮点2", "亮点3"],
      "style": "热血|黑暗|轻松|悬疑|浪漫"
    }
  ]
}`

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              parts: [
                {
                  type: 'text',
                  text: promptText,
                },
              ],
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error('生成失败')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = '' // 累积所有内容

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // 解析 SSE 消息
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)
                // 使用 Vercel AI SDK 的 UIMessageChunk 格式
                if (parsed.type === 'text-delta' && parsed.delta) {
                  fullContent += parsed.delta
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      }

      // 流式传输完成后，从累积的内容中提取 JSON
      try {
        // 提取 JSON 代码块
        const jsonMatch = fullContent.match(/```json\n([\s\S]*?)\n```/) ||
                         fullContent.match(/\{[\s\S]*"directions"[\s\S]*\}/)

        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0]
          const jsonData = JSON.parse(jsonStr)

          if (jsonData.directions && Array.isArray(jsonData.directions) && jsonData.directions.length > 0) {
            setDirections(jsonData.directions)
          } else {
            throw new Error('JSON 格式不正确或没有生成创意方向')
          }
        } else {
          throw new Error('未找到 JSON 数据')
        }
      } catch (e) {
        console.error('解析 JSON 失败:', e)
        console.log('完整内容:', fullContent)
        throw new Error('未能生成有效的创意方向')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试')
    } finally {
      generatingRef.current = false
      setIsGenerating(false)
    }
  }, [userIdea])

  // 组件加载时自动开始生成创意方向
  useEffect(() => {
    generateDirections()
  }, [generateDirections])

  const handleNext = () => {
    const selected = directions.find(d => d.id === selectedId)
    if (selected) {
      onNext(selected)
    }
  }

  return (
    <div className="flex flex-col min-h-[600px] px-8 py-6">
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* 标题区域 */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">AI 为你构思了 3 个创意方向</h2>
          <p className="text-muted-foreground">
            选择一个你最感兴趣的方向，或点击重新生成
          </p>
        </div>

        {/* 加载状态 */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">AI 正在为你构思创意方向...</p>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-center">
            {error}
          </div>
        )}

        {/* 创意方向卡片 - 轮播展示 */}
        {directions.length > 0 && (
          <>
            <DirectionCarousel
              directions={directions}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />

            {/* 底部按钮 */}
            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={onBack}>
                返回修改
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={generateDirections}
                  disabled={isGenerating}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  重新生成
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!selectedId}
                  size="lg"
                  className="px-8"
                >
                  下一步
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// 创意方向卡片组件
function DirectionCard({
  direction,
  isSelected,
  onSelect
}: {
  direction: CreativeDirection
  isSelected: boolean
  onSelect: () => void
}) {
  const endingIcons = {
    open: '🌟',
    tragedy: '💔',
    comedy: '😊'
  }

  const endingLabels = {
    open: '开放式',
    tragedy: '悲剧',
    comedy: '喜剧'
  }

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg h-full flex flex-col',
        isSelected && 'ring-2 ring-primary shadow-lg'
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg mb-2 line-clamp-2">{direction.title}</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">{direction.genre}</Badge>
              {direction.style && (
                <Badge variant="outline" className="text-xs">{direction.style}</Badge>
              )}
            </div>
          </div>
          {isSelected && (
            <div className="p-1 bg-primary rounded-full flex-shrink-0">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-1 flex flex-col">
        {/* 核心冲突 */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Target className="h-3.5 w-3.5 flex-shrink-0" />
            核心冲突
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
            {direction.mainConflict}
          </p>
        </div>

        {/* 主角 */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium">
            <User className="h-3.5 w-3.5 flex-shrink-0" />
            主角：{direction.protagonist.name}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {direction.protagonist.description}
          </p>
        </div>

        {/* 结局走向 */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">结局：</span>
          <span>
            {endingIcons[direction.ending]} {endingLabels[direction.ending]}
          </span>
        </div>

        {/* 亮点 */}
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2 text-xs font-medium">
            <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />
            故事亮点
          </div>
          <ul className="space-y-1">
            {direction.highlights.slice(0, 3).map((highlight, index) => (
              <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-primary flex-shrink-0">•</span>
                <span className="line-clamp-2">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

// 轮播组件
function DirectionCarousel({
  directions,
  selectedId,
  onSelect
}: {
  directions: CreativeDirection[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? directions.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === directions.length - 1 ? 0 : prev + 1))
  }

  const currentDirection = directions[currentIndex]

  return (
    <div className="space-y-4">
      {/* 轮播指示器 */}
      <div className="flex items-center justify-center gap-2">
        {directions.map((_, index) => (
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
        <div className="px-12">
          <DirectionCard
            direction={currentDirection}
            isSelected={selectedId === currentDirection.id}
            onSelect={() => onSelect(currentDirection.id)}
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

      {/* 方向信息 */}
      <div className="text-center text-sm text-muted-foreground">
        方向 {currentIndex + 1} / {directions.length}
      </div>
    </div>
  )
}
