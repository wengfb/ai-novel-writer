'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  BookOpen,
  FileText,
  Clapperboard,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import type { Outline } from '@/lib/store/outline-store'
import { cn } from '@/lib/utils'

interface OutlineTimelineCardProps {
  outline: Outline
  isExpanded: boolean
  isDimmed: boolean
  onToggleExpand: () => void
  onClick: () => void
}

const typeConfig = {
  volume: { icon: BookOpen, label: '卷', borderColor: 'border-l-blue-500', bgColor: 'bg-blue-500/10', textColor: 'text-blue-600' },
  chapter: { icon: FileText, label: '章', borderColor: 'border-l-green-500', bgColor: 'bg-green-500/10', textColor: 'text-green-600' },
  scene: { icon: Clapperboard, label: '场景', borderColor: 'border-l-orange-500', bgColor: 'bg-orange-500/10', textColor: 'text-orange-600' },
}

const statusConfig = {
  planned: { label: '计划中', variant: 'secondary' as const },
  writing: { label: '写作中', variant: 'default' as const },
  completed: { label: '已完成', variant: 'outline' as const },
}

const plotFunctionConfig: Record<string, { label: string; color: string }> = {
  '推进': { label: '推进', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  '转折': { label: '转折', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  '铺垫': { label: '铺垫', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  '高潮': { label: '高潮', color: 'bg-red-100 text-red-700 border-red-300' },
  '过渡': { label: '过渡', color: 'bg-green-100 text-green-700 border-green-300' },
}

function getTensionLabel(level: number): string {
  if (level <= 3) return '舒缓'
  if (level <= 6) return '适中'
  if (level <= 8) return '紧张'
  return '极高'
}

function getTensionColor(level: number): string {
  if (level <= 3) return 'bg-emerald-500'
  if (level <= 6) return 'bg-yellow-500'
  if (level <= 8) return 'bg-orange-500'
  return 'bg-red-500'
}

export function OutlineTimelineCard({
  outline,
  isExpanded,
  isDimmed,
  onToggleExpand,
  onClick,
}: OutlineTimelineCardProps) {
  const config = typeConfig[outline.type]
  const Icon = config.icon
  const status = statusConfig[outline.status]
  const hasChildren = outline.children && outline.children.length > 0
  const isExpandable = hasChildren || outline.type === 'chapter'
  const isScene = outline.type === 'scene'

  return (
    <div className={cn('relative', isDimmed && 'opacity-50')}>
      {/* Timeline connector line */}
      {!isScene && (
        <div className="absolute left-6 top-10 bottom-0 w-px bg-border" />
      )}

      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-md',
          config.borderColor,
          'border-l-4',
          isScene ? 'ml-12' : 'ml-0',
          isScene ? 'max-w-xl' : 'max-w-2xl'
        )}
        onClick={onClick}
      >
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center gap-2">
            {/* Expand toggle */}
            {isExpandable && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleExpand() }}
                className="p-0.5 hover:bg-muted rounded shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            )}

            {/* Type icon */}
            <div className={cn('rounded-md p-1.5 shrink-0', config.bgColor)}>
              <Icon className={cn('h-3.5 w-3.5', config.textColor)} />
            </div>

            {/* Title */}
            <h3 className={cn('font-semibold flex-1', isScene ? 'text-sm' : 'text-base')}>
              {outline.title}
            </h3>

            {/* 创作意图紧凑指示器（折叠时也可见） */}
            {outline.type === 'chapter' && outline.plotFunction && (
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0',
                  outline.plotFunction === '推进' && 'border-blue-300 text-blue-600 bg-blue-50',
                  outline.plotFunction === '转折' && 'border-purple-300 text-purple-600 bg-purple-50',
                  outline.plotFunction === '铺垫' && 'border-slate-300 text-slate-600 bg-slate-50',
                  outline.plotFunction === '高潮' && 'border-red-300 text-red-600 bg-red-50',
                  outline.plotFunction === '过渡' && 'border-green-300 text-green-600 bg-green-50'
                )}
              >
                {outline.plotFunction}
              </span>
            )}
            {outline.type === 'chapter' && outline.tensionLevel != null && outline.tensionLevel > 0 && (
              <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                T{outline.tensionLevel}
              </span>
            )}

            {/* Status badge */}
            <Badge variant={status.variant} className="text-xs shrink-0">
              {status.label}
            </Badge>

            {/* Chapter word count */}
            {outline.chapter && (
              <span className="text-xs text-muted-foreground shrink-0">
                {outline.chapter.wordCount.toLocaleString()} 字
              </span>
            )}
          </div>
        </CardHeader>

        {/* Expandable content */}
        {isExpanded && (
          <CardContent className="px-4 pb-4 pt-0">
            <div className="ml-8 space-y-3">
              {outline.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {outline.description}
                </p>
              )}

              {/* 创作意图字段 */}
              {outline.type === 'chapter' && (outline.plotFunction || outline.tensionLevel || outline.emotionalGoal) && (
                <div className="flex flex-wrap items-center gap-2">
                  {outline.plotFunction && plotFunctionConfig[outline.plotFunction] && (
                    <Badge
                      variant="outline"
                      className={cn('text-xs font-normal', plotFunctionConfig[outline.plotFunction].color)}
                    >
                      {plotFunctionConfig[outline.plotFunction].label}
                    </Badge>
                  )}
                  {outline.tensionLevel != null && outline.tensionLevel > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">张力</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }, (_, i) => (
                          <div
                            key={i}
                            className={cn(
                              'w-1.5 h-3 rounded-sm',
                              i < outline.tensionLevel ? getTensionColor(outline.tensionLevel) : 'bg-muted'
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {outline.tensionLevel}/10 {getTensionLabel(outline.tensionLevel)}
                      </span>
                    </div>
                  )}
                  {outline.emotionalGoal && (
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                      情感：{outline.emotionalGoal}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {outline.targetWords && (
                  <span>目标字数：{outline.targetWords.toLocaleString()}</span>
                )}
                {outline.chapter && (
                  <span>章节号：第 {outline.chapter.chapterNumber} 章</span>
                )}
                <span>置信度</span>
                <Progress
                  value={outline.confidence * 10}
                  className="w-20 h-2"
                />
                <span>{outline.confidence}/10</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
