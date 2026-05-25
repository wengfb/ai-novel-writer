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
            {hasChildren && (
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
