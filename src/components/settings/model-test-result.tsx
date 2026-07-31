'use client'

/**
 * 模型连通性测试结果行内展示
 */

import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ModelTestStatus = {
  ok: boolean
  message: string
  detail?: string
} | null

interface ModelTestResultProps {
  result: ModelTestStatus
  className?: string
}

export function ModelTestResult({ result, className }: ModelTestResultProps) {
  if (!result) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-start gap-2 rounded-md border px-3 py-2 text-xs leading-5',
        result.ok
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          : 'border-destructive/30 bg-destructive/10 text-destructive',
        className
      )}
    >
      {result.ok ? (
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      )}
      <div className="min-w-0">
        <p className="font-medium">{result.message}</p>
        {result.detail && <p className="mt-0.5 break-words opacity-90">{result.detail}</p>}
      </div>
    </div>
  )
}
