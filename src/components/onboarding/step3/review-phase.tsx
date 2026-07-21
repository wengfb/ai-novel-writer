'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Loader2,
  CheckCircle2,
  ChevronRight,
  SkipForward,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StoryIdeaCard } from '@/types'
import type { StepKey, StepState } from './types'
import { STEP_DEFS } from './constants'
import { StepResultPreview } from './step-result-preview'

interface ReviewPhaseProps {
  idea: StoryIdeaCard
  steps: StepState[]
  activeStep: StepKey
  feedback: string
  setFeedback: (v: string) => void
  feedbackRef: React.RefObject<HTMLInputElement | null>
  getStep: (key: StepKey) => StepState
  switchToStep: (key: StepKey) => void
  generateStep: (key: StepKey) => void
  updateStep: (key: StepKey, update: Partial<StepState>) => void
  handleFeedback: () => void
  skipCurrent: () => void
  skipAll: () => void
  goNext: () => void
}

export function ReviewPhase({
  idea,
  activeStep,
  feedback,
  setFeedback,
  feedbackRef,
  getStep,
  switchToStep,
  generateStep,
  updateStep,
  handleFeedback,
  skipCurrent,
  skipAll,
  goNext,
}: ReviewPhaseProps) {
  const step = getStep(activeStep)
  const def = STEP_DEFS.find((d) => d.key === activeStep)!
  const stepIdx = STEP_DEFS.findIndex((d) => d.key === activeStep)

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-44 shrink-0 border-r bg-muted/20 p-4 space-y-1">
        {STEP_DEFS.map((d) => {
          const s = getStep(d.key)
          const isActive = d.key === activeStep
          return (
            <button
              key={d.key}
              type="button"
              disabled={s.status === 'pending'}
              onClick={() => switchToStep(d.key)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-2 rounded text-left text-sm transition-colors',
                isActive && 'bg-primary/10 ring-1 ring-primary/30',
                s.status === 'done' && !isActive && 'hover:bg-muted cursor-pointer',
                s.status === 'pending' && !isActive && 'text-muted-foreground',
                s.status === 'skipped' && 'text-muted-foreground line-through'
              )}
            >
              <span className="shrink-0">
                {s.status === 'loading' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : s.status === 'done' ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                ) : s.status === 'skipped' ? (
                  <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <span className="block h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30" />
                )}
              </span>
              <span className="truncate">{d.label}</span>
              {isActive && <ChevronRight className="h-3 w-3 ml-auto" />}
            </button>
          )
        })}
      </div>

      <div className="flex-1 flex flex-col px-6 py-6 min-h-0 overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-full">{def.icon}</div>
          <div>
            <h3 className="text-lg font-semibold">{def.label}</h3>
            <p className="text-sm text-muted-foreground">
              第 {stepIdx + 1}/{STEP_DEFS.length} 步
            </p>
          </div>
        </div>

        {step.status === 'loading' && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-4 min-h-0">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">AI 正在生成{def.label}...</p>
          </div>
        )}

        {step.error && step.status !== 'loading' && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-destructive font-medium">生成失败</p>
            <p className="text-sm text-muted-foreground">{step.error}</p>
            <Button onClick={() => generateStep(activeStep)}>重新生成</Button>
          </div>
        )}

        {step.status === 'done' && step.data && (
          <div className="space-y-4" style={{ flex: '1 1 0', minHeight: 0, overflowY: 'auto' }}>
            <StepResultPreview stepKey={activeStep} data={step.data} idea={idea} />
          </div>
        )}

        {step.status === 'skipped' && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-3 text-center">
            <SkipForward className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">{def.label}已跳过</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              项目创建后可在对应页面补充此模块
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                updateStep(activeStep, { status: 'pending' })
                generateStep(activeStep)
              }}
            >
              重新生成
            </Button>
          </div>
        )}

        {(step.status === 'done' || step.status === 'skipped') && (
          <div className="space-y-3 pt-4 border-t mt-4">
            {step.status === 'done' && (
              <div className="flex gap-2">
                <Input
                  ref={feedbackRef}
                  placeholder="提出修改意见，AI 将基于反馈调整..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFeedback()}
                  className="text-sm"
                />
                <Button variant="outline" onClick={handleFeedback} disabled={!feedback.trim()}>
                  发送
                </Button>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={skipCurrent}>
                  跳过此步
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipAll}
                  className="text-muted-foreground"
                >
                  <SkipForward className="mr-1 h-3.5 w-3.5" />
                  跳过后续全部
                </Button>
              </div>
              <Button onClick={goNext} size="sm" className="px-6">
                {stepIdx < STEP_DEFS.length - 1 ? '保留并继续 →' : '完成，创建项目'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
