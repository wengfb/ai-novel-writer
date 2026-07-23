'use client'

/**
 * Bootstrap 审核阶段：左侧步骤 + 中间专家对话（UnifiedChat）+ 右侧结构化预览
 */

import { useCallback, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  CheckCircle2,
  ChevronRight,
  SkipForward,
  XCircle,
  AlertTriangle,
  Sparkles,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StoryIdeaCard } from '@/types'
import type { StepKey, StepState } from './types'
import { STEP_DEFS } from './constants'
import { StepResultPreview, extractArray } from './step-result-preview'
import { UnifiedChat, type UnifiedChatApi } from '@/components/chat/unified-chat'
import {
  STEP_AGENT_ID,
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
  onGeneratingChange?: (generating: boolean) => void
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
  onGeneratingChange,
  onQuickGenerate,
}: ReviewPhaseProps) {
  const step = getStep(activeStep)
  const def = STEP_DEFS.find((d) => d.key === activeStep)!
  const stepIdx = STEP_DEFS.findIndex((d) => d.key === activeStep)
  const welcome = STEP_WELCOME[activeStep]
  const chatApiRef = useRef<UnifiedChatApi | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)

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
    () => buildOnboardingChatContextAppend(activeStep, chatContext),
    [activeStep, chatContext]
  )

  const openingMessage = useMemo(
    () => buildStepOpeningMessage(activeStep, chatContext),
    [activeStep, chatContext]
  )

  const handleExtract = useCallback(async () => {
    const text = chatApiRef.current?.getConversationText() || ''
    if (text.trim().length < 40) {
      setExtractError('对话内容太少，请先与专家多聊几句再确认。')
      return
    }
    if (chatApiRef.current?.isRunning()) {
      setExtractError('助手仍在回复中，请稍后再确认。')
      return
    }

    setExtracting(true)
    setExtractError(null)
    onGeneratingChange?.(true)
    try {
      const prior = collectPriorForExtract(activeStep, getStep)
      const res = await fetch('/api/onboarding/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepKey: activeStep,
          conversationText: text,
          idea,
          projectTitle,
          targetWords,
          pace,
          pov,
          audience: userPreferences?.audience,
          tone: userPreferences?.tone,
          prior,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        throw new Error(json.error?.message || '结构化提取失败')
      }
      onConfirmExtracted(activeStep, json.data.data as Record<string, unknown>)
    } catch (e) {
      setExtractError((e as Error).message)
    } finally {
      setExtracting(false)
      onGeneratingChange?.(false)
    }
  }, [
    activeStep,
    getStep,
    idea,
    projectTitle,
    targetWords,
    pace,
    pov,
    userPreferences,
    onConfirmExtracted,
    onGeneratingChange,
  ])

  return (
    <div className="flex h-full min-h-0 max-h-full overflow-hidden">
      {/* 步骤导航 */}
      <div className="w-40 shrink-0 border-r bg-muted/20 p-3 space-y-1 overflow-y-auto min-h-0">
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
                'w-full flex items-center gap-2 px-2 py-2 rounded text-left text-sm transition-colors',
                isActive && 'bg-primary/10 ring-1 ring-primary/30',
                s.status === 'done' && !isActive && 'hover:bg-muted cursor-pointer',
                s.status === 'pending' && !isActive && 'text-muted-foreground',
                s.status === 'skipped' && 'text-muted-foreground line-through'
              )}
            >
              <span className="shrink-0">
                {s.status === 'loading' || (isActive && extracting) ? (
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
              {isActive && <ChevronRight className="h-3 w-3 ml-auto shrink-0" />}
            </button>
          )
        })}
      </div>

      {/* 主区：对话 + 预览 */}
      <div className="flex-1 flex min-w-0 min-h-0 overflow-hidden">
        {/* 对话（未确认时主展示；已确认仍可回看） */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden border-r">
          <div className="flex items-center gap-2 px-4 py-2 border-b shrink-0">
            <div className="p-1.5 bg-primary/10 rounded-full">{def.icon}</div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold truncate">{def.label}</h3>
              <p className="text-xs text-muted-foreground">
                第 {stepIdx + 1}/{STEP_DEFS.length} 步 · 专家对话
              </p>
            </div>
            {onQuickGenerate && step.status !== 'done' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs shrink-0"
                onClick={() => onQuickGenerate(activeStep)}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                一键生成
              </Button>
            )}
          </div>

          {step.status === 'skipped' ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-3 text-center px-4">
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
            <div className="flex-1 min-h-0 overflow-hidden">
              <UnifiedChat
                key={activeStep}
                agentId={STEP_AGENT_ID[activeStep]}
                sessionKey={`onboarding-${activeStep}`}
                showSettings={false}
                contextAppend={contextAppend}
                autoSendMessage={step.status === 'done' ? undefined : openingMessage}
                welcomeTitle={welcome.title}
                welcomeSubtitle={welcome.subtitle}
                chatApiRef={chatApiRef}
                className="h-full min-h-0 overflow-hidden"
              />
            </div>
          )}
        </div>

        {/* 右侧：确认 / 预览 */}
        <div className="w-[320px] shrink-0 flex flex-col min-h-0 overflow-hidden bg-muted/10">
          <div className="px-4 py-3 border-b shrink-0">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="h-4 w-4" />
              本步结果
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              对话满意后点「整理并确认」，会提取结构化数据供创建项目使用。
            </p>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
            {extractError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive space-y-1">
                <div className="flex items-center gap-1 font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  提取失败
                </div>
                <p>{extractError}</p>
              </div>
            )}

            {step.status === 'done' && step.data ? (
              <StepResultPreview stepKey={activeStep} data={step.data} idea={idea} />
            ) : (
              <div className="text-xs text-muted-foreground space-y-2 py-6 text-center">
                <p>尚未确认本步结果。</p>
                <p>在左侧与专家讨论，然后点下方按钮整理。</p>
              </div>
            )}

            {extracting && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在整理结构化结果…
              </div>
            )}
          </div>

          <div className="border-t p-3 space-y-2 shrink-0">
            {step.status !== 'done' && step.status !== 'skipped' && (
              <Button
                className="w-full"
                onClick={handleExtract}
                disabled={extracting}
              >
                {extracting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    整理中…
                  </>
                ) : (
                  '整理并确认本步'
                )}
              </Button>
            )}

            {step.status === 'done' && (
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={() => {
                  updateStep(activeStep, { status: 'pending', data: null, error: null })
                  setExtractError(null)
                }}
              >
                重新对话修订
              </Button>
            )}

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
          </div>
        </div>
      </div>
    </div>
  )
}

function buildPriorSummary(
  activeStep: StepKey,
  getStep: (k: StepKey) => StepState
): string {
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
      const fs = extractArray((data as any).foreshadowings?.foreshadowings || (data as any).foreshadowings)
      return `【伏笔】${fs.map((f: any) => f.title).join('、')}`
    }
    default:
      return ''
  }
}

function collectPriorForExtract(
  activeStep: StepKey,
  getStep: (k: StepKey) => StepState
) {
  const arch = getStep('architecture')
  const chars = getStep('characters')
  const world = getStep('world')
  const vol = getStep('volume')

  const architecture = (arch.data as any)?.architecture || arch.data
  const characters = extractArray((chars.data as any)?.characters?.characters || (chars.data as any)?.characters)
  const worldSettings = extractArray(
    (world.data as any)?.worldSettings?.worldSettings || (world.data as any)?.worldSettings
  )
  const chapters = extractArray((vol.data as any)?.chapters?.chapters || (vol.data as any)?.chapters)

  return {
    architecture,
    characters,
    worldSettings,
    chapters,
    overallOutline: (vol.data as any)?.overallOutline,
    plannedTotalChapters: (vol.data as any)?.plannedTotalChapters,
  }
}
