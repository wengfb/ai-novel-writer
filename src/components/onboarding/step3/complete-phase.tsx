'use client'

import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'
import type { StepState } from './types'
import { STEP_DEFS } from './constants'

interface CompletePhaseProps {
  steps: StepState[]
}

export function CompletePhase({ steps }: CompletePhaseProps) {
  const doneCount = steps.filter((s) => s.status === 'done').length
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-8 py-12 space-y-6 text-center">
      <CheckCircle2 className="h-16 w-16 text-green-500" />
      <h2 className="text-2xl font-bold">项目创建成功！</h2>
      <p className="text-muted-foreground">
        已生成 {doneCount}/{STEP_DEFS.length} 个模块，正在跳转到编辑器...
      </p>
      <div className="flex gap-2 flex-wrap">
        {steps
          .filter((s) => s.status === 'skipped')
          .map((s) => (
            <Badge key={s.key} variant="outline" className="text-xs">
              {STEP_DEFS.find((d) => d.key === s.key)?.label} 已跳过
            </Badge>
          ))}
      </div>
    </div>
  )
}
