'use client'

/**
 * Bootstrap 审核阶段：左侧步骤 + 中间专家对话 + 右侧结构化预览
 */

import { useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  CheckCircle2,
  ChevronRight,
  SkipForward,
  XCircle,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StoryIdeaCard } from '@/types'
import type { StepKey, StepState } from './types'
import { STEP_DEFS } from './constants'
import { StepResultPreview, extractArray } from './step-result-preview'
import {
  DraftCoCreationShell,
  DraftPanelFrame,
  pickDraftToolPayload,
} from '@/components/ai/draft-co-creation-shell'
import { UnifiedChat } from '@/components/chat/unified-chat'
import {
  STEP_AGENT_ID,
  STEP_SYSTEM_SLOT,
  STEP_WELCOME,
  buildOnboardingChatContextAppend,
  buildStepOpeningMessage,
} from '@/lib/ai/onboarding/bootstrap-chat'

interface ReviewPhaseProps {
  idea: StoryIdeaCard
  projectTitle: string
  targetWords: number
  pace: 'fast' | 'medium' | 'slow'
  pov: 'first_person' | 'third_person' | 'multiple_pov'
  userPreferences?: { audience?: string; tone?: string }
  steps: StepState[]
  activeStep: StepKey
  getStep: (key: StepKey) => StepState
  switchToStep: (key: StepKey) => void
  updateStep: (key: StepKey, update: Partial<StepState>) => void
  skipCurrent: () => void
  skipAll: () => void
  goNext: () => void
  onConfirmExtracted: (stepKey: StepKey, data: Record<string, unknown>) => void
  /** 可选：一键整步生成（快路径，保留旧 API） */
  onQuickGenerate?: (stepKey: StepKey) => void
}

export function ReviewPhase({
  idea,
  projectTitle,
  targetWords,
  pace,
  pov,
  userPreferences,
  steps,
  activeStep,
  getStep,
  switchToStep,
  updateStep,
  skipCurrent,
  skipAll,
  goNext,
  onConfirmExtracted,
  onQuickGenerate,
}: ReviewPhaseProps) {
  const step = getStep(activeStep)
  const def = STEP_DEFS.find((d) => d.key === activeStep)!
  const stepIdx = STEP_DEFS.findIndex((d) => d.key === activeStep)
  const welcome = STEP_WELCOME[activeStep]

  const priorSummary = useMemo(
    () => buildPriorSummary(activeStep, getStep),
    // steps 变化时重算前置摘要
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeStep, steps]
  )

  const chatContext = useMemo(
    () => ({
      idea,
      projectTitle,
      targetWords,
      pace,
      pov,
      audience: userPreferences?.audience,
      tone: userPreferences?.tone,
      priorSummary,
    }),
    [idea, projectTitle, targetWords, pace, pov, userPreferences, priorSummary]
  )

  const contextAppend = useMemo(
    () =>
      `${buildOnboardingChatContextAppend(activeStep, chatContext)}\n\n当本步骤已有可用草稿，或作者确认了修改时，调用 updateOnboardingDraft 同步右侧预览。只同步已确认内容；不要要求作者点击整理、应用或确认。`,
    [activeStep, chatContext]
  )

  const openingMessage = useMemo(
    () => buildStepOpeningMessage(activeStep, chatContext),
    [activeStep, chatContext]
  )

  const handleDraftToolCall = useCallback(
    (toolName: string, result: unknown) => {
      const payload = pickDraftToolPayload(toolName, 'updateOnboardingDraft', result, 'data')
      if (!payload) return
      onConfirmExtracted(activeStep, normalizeDraftData(activeStep, payload))
    },
    [activeStep, onConfirmExtracted]
  )

  return (
    <DraftCoCreationShell
      leftRail={
        <div className="w-40 shrink-0 space-y-1 overflow-y-auto border-r bg-muted/20 p-3 min-h-0">
          {STEP_DEFS.map((d) => {
            const s = getStep(d.key)
            const isActive = d.key === activeStep
            return (
              <button
                key={d.key}
                type="button"
                disabled={s.status === 'pending' && d.key !== activeStep}
                onClick={() => switchToStep(d.key)}
                className={cn(
                  'flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm transition-colors',
                  isActive && 'bg-primary/10 ring-1 ring-primary/30',
                  s.status === 'done' && !isActive && 'cursor-pointer hover:bg-muted',
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
                {isActive ? <ChevronRight className="ml-auto h-3 w-3 shrink-0" /> : null}
              </button>
            )
          })}
        </div>
      }
      chatHeader={
        <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
          <div className="rounded-full bg-primary/10 p-1.5">{def.icon}</div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold">{def.label}</h3>
            <p className="text-xs text-muted-foreground">
              第 {stepIdx + 1}/{STEP_DEFS.length} 步 · 专家对话
            </p>
          </div>
          {onQuickGenerate && step.status !== 'done' ? (
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-xs"
              onClick={() => onQuickGenerate(activeStep)}
            >
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              一键生成
            </Button>
          ) : null}
        </div>
      }
      chat={
        step.status === 'skipped' ? (
          <div className="flex flex-1 flex-col items-center justify-center space-y-3 px-4 py-12 text-center">
            <SkipForward className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">{def.label}已跳过</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateStep(activeStep, { status: 'pending', data: null })}
            >
              重新对话
            </Button>
          </div>
        ) : (
          <UnifiedChat
            key={activeStep}
            agentId={STEP_AGENT_ID[activeStep]}
            systemSlot={STEP_SYSTEM_SLOT[activeStep]}
            sessionKey={`onboarding-${activeStep}`}
            showSettings={false}
            contextAppend={contextAppend}
            autoSendMessage={step.status === 'done' ? undefined : openingMessage}
            welcomeTitle={welcome.title}
            welcomeSubtitle={welcome.subtitle}
            draftTarget="onboarding"
            draftStep={activeStep}
            onToolCallComplete={handleDraftToolCall}
            className="h-full min-h-0 overflow-hidden"
          />
        )
      }
      draftPanel={
        <DraftPanelFrame
          title="本步结果"
          description="对话内容会在 AI 回复后自动同步为结构化结果。"
          empty={
            !(step.status === 'done' && step.data) ? (
              <div className="space-y-2 py-6 text-center text-xs text-muted-foreground">
                <p>等待专家回复后，这里会自动更新。</p>
              </div>
            ) : undefined
          }
          footer={
            <>
              {step.status === 'done' ? (
                <Button
                  variant="outline"
                  className="w-full"
                  size="sm"
                  onClick={() => {
                    updateStep(activeStep, { status: 'pending', data: null, error: null })
                  }}
                >
                  重新对话修订
                </Button>
              ) : null}
              <div className="flex justify-between gap-2">
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={skipCurrent}>
                    跳过
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={skipAll}
                    className="text-muted-foreground"
                  >
                    跳过后续
                  </Button>
                </div>
                <Button
                  onClick={goNext}
                  size="sm"
                  disabled={step.status !== 'done' && step.status !== 'skipped'}
                  className="px-4"
                >
                  {stepIdx < STEP_DEFS.length - 1 ? '继续 →' : '完成创建'}
                </Button>
              </div>
            </>
          }
        >
          {step.status === 'done' && step.data ? (
            <StepResultPreview stepKey={activeStep} data={step.data} idea={idea} />
          ) : null}
        </DraftPanelFrame>
      }
    />
  )
}

function normalizeDraftData(stepKey: StepKey, data: Record<string, unknown>): Record<string, unknown> {
  switch (stepKey) {
    case 'architecture':
      return { architecture: data }
    case 'characters':
      return { characters: { characters: data.characters ?? [] } }
    case 'world':
      return { worldSettings: { worldSettings: data.worldSettings ?? [] } }
    case 'foreshadowings':
      return { foreshadowings: { foreshadowings: data.foreshadowings ?? [] } }
    default:
      return data
  }
}

function buildPriorSummary(activeStep: StepKey, getStep: (k: StepKey) => StepState): string {
  const parts: string[] = []
  const order: StepKey[] = [
    'architecture',
    'characters',
    'world',
    'volume',
    'foreshadowings',
    'styleAnchor',
  ]
  for (const key of order) {
    if (key === activeStep) break
    const s = getStep(key)
    if (s.status !== 'done' || !s.data) continue
    parts.push(summarizeStep(key, s.data))
  }
  return parts.join('\n\n')
}

function summarizeStep(key: StepKey, data: Record<string, unknown>): string {
  switch (key) {
    case 'architecture': {
      const arch = (data as any).architecture || data
      return `【架构】梗概：${String(arch.storySummary || '').slice(0, 400)}\n冲突：${arch.mainConflict || ''}`
    }
    case 'characters': {
      const chars = extractArray((data as any).characters?.characters || (data as any).characters)
      return `【角色】${chars.map((c: any) => `${c.name}(${c.role || ''})`).join('、')}`
    }
    case 'world': {
      const ws = extractArray((data as any).worldSettings?.worldSettings || (data as any).worldSettings)
      return `【世界观】${ws.map((w: any) => w.name).join('、')}`
    }
    case 'volume': {
      const chs = extractArray((data as any).chapters?.chapters || (data as any).chapters)
      const outline = String((data as any).overallOutline || '').slice(0, 300)
      return `【大纲】总纲：${outline}\n开篇章：${chs.map((c: any) => `第${c.chapterNumber}章 ${c.title}`).join('；')}`
    }
    case 'foreshadowings': {
      const fs = extractArray(
        (data as any).foreshadowings?.foreshadowings || (data as any).foreshadowings
      )
      return `【伏笔】${fs.map((f: any) => f.title).join('、')}`
    }
    default:
      return ''
  }
}
