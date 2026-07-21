'use client'

import { AlertTriangle } from 'lucide-react'
import type { ChapterCalculation } from '@/lib/ai/onboarding/types'
import { WORD_COUNT_DEVIATION_WARNING_THRESHOLD } from './constants'

export function DiffWarningBanner({ calc }: { calc: ChapterCalculation }) {
  if (calc.deviationPercent == null || Math.abs(calc.deviationPercent) <= WORD_COUNT_DEVIATION_WARNING_THRESHOLD) {
    return (
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>计划章节：{calc.chapterCount}章</span>
        <span>分卷数：{calc.volumeCount}卷</span>
        <span>每章均字：{calc.avgChapterWords}字</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>计划章节：{calc.chapterCount}章</span>
        <span>分卷数：{calc.volumeCount}卷</span>
        <span>每章均字：{calc.avgChapterWords}字</span>
      </div>
      <div className="flex items-center gap-2 p-2 rounded bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span>
          AI 建议总字数为 {calc.suggestedTotalWords?.toLocaleString() || '?'} 字，
          与你设定的 {calc.targetWords?.toLocaleString() || '?'} 字
          偏差 {calc.deviationPercent > 0 ? '+' : ''}{calc.deviationPercent}%。
          后续章节规划将以 AI 建议为准，如需调整请在下方输入反馈。
        </span>
      </div>
    </div>
  )
}
