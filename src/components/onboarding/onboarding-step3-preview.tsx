'use client'

import { useState, useCallback, useEffect } from 'react'
import type { OnboardingStep3PreviewProps, StepKey, StepState, StepStatus } from './step3/types'
import { STEP_DEFS } from './step3/constants'
import { extractArray } from './step3/step-result-preview'
import { ConfigPhase } from './step3/config-phase'
import { CompletePhase } from './step3/complete-phase'
import { ReviewPhase } from './step3/review-phase'

// ============ 主组件 ============

export function OnboardingStep3Preview({
  idea,
  userPreferences,
  onComplete,
  onBack,
  onGeneratingChange,
  onPhaseChange,
  resumeProgress,
}: OnboardingStep3PreviewProps) {
  const defaultTitle = idea.title || `${idea.genre || '新'}小说`
  const [projectTitle, setProjectTitle] = useState(defaultTitle)
  const [targetWords, setTargetWords] = useState(1000000)
  const [pace, setPace] = useState<'fast' | 'medium' | 'slow'>('medium')
  const [pov, setPov] = useState<'first_person' | 'third_person' | 'multiple_pov'>(
    (userPreferences?.pov as any) || 'third_person'
  )

  // 续建模式：恢复进度，直接进入审核流程
  const doneSteps = resumeProgress?.doneSteps || []
  const firstPending = STEP_DEFS.find(d => !doneSteps.includes(d.key))?.key || 'architecture'

  const [phase, setPhase] = useState<'config' | 'review' | 'complete'>(
    resumeProgress ? 'review' : 'config'
  )
  const [activeStep, setActiveStep] = useState<StepKey>(firstPending)

  // 通知父组件 phase 变化（用于调整模态框宽度）
  useEffect(() => {
    onPhaseChange?.(phase)
  }, [phase, onPhaseChange])

  const [steps, setSteps] = useState<StepState[]>(
    STEP_DEFS.map(d => ({
      key: d.key,
      status: doneSteps.includes(d.key) ? 'done' as StepStatus : 'pending' as StepStatus,
      data: null,
      error: null,
    }))
  )
  const [projectId, setProjectId] = useState<string | null>(null)
  void projectId

  // 获取当前步骤状态
  const getStep = useCallback((key: StepKey) => steps.find(s => s.key === key)!, [steps])

  // 更新步骤
  const updateStep = useCallback((key: StepKey, update: Partial<StepState>) => {
    setSteps(prev => prev.map(s => s.key === key ? { ...s, ...update } : s))
  }, [])

  // 对话确认后写入本步 data + 进度
  const handleConfirmExtracted = useCallback(
    (stepKey: StepKey, data: Record<string, unknown>) => {
      setSteps((prev) => {
        const next = prev.map((s) =>
          s.key === stepKey
            ? { ...s, status: 'done' as StepStatus, data, error: null }
            : s
        )
        const unique = next.filter((s) => s.status === 'done').map((s) => s.key)
        const pid = resumeProgress?.projectId
        if (pid) {
          localStorage.setItem(`init-progress-${pid}`, JSON.stringify(unique))
          fetch(`/api/projects/${pid}/init-progress`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doneSteps: unique }),
          }).catch(() => {})
        }
        return next
      })
    },
    [resumeProgress?.projectId]
  )

  // 可选快路径：仍走旧 generate API（一键整步）
  const quickGenerate = async (stepKey: StepKey) => {
    updateStep(stepKey, { status: 'loading', error: null })
    onGeneratingChange?.(true)
    try {
      const def = STEP_DEFS.find(d => d.key === stepKey)!
      const context = getRequestContext(stepKey)

      if (stepKey === 'styleAnchor') {
        const chars = getStep('characters')
        const world = getStep('world')
        const charList = extractArray((chars.data as any)?.characters)
        const worldList = extractArray((world.data as any)?.worldSettings)
        const res = await fetch('/api/ai/generate/style-anchor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: `${idea.genre}小说《${projectTitle}》，${idea.highConcept}`,
            genre: idea.genre,
            hint: userPreferences?.tone,
            characters: charList.map((c: any) => ({
              name: c.name,
              role: c.role,
              description: c.description?.slice(0, 100),
            })),
            worldSettings: worldList.map((w: any) => ({
              name: w.name,
              type: w.type,
              description: w.description?.slice(0, 100),
            })),
          }),
        })
        const json = await res.json()
        if (json.success) {
          updateStep(stepKey, {
            status: 'done',
            data: { content: json.data.content, wordCount: json.data.wordCount },
          })
          saveCurrentProgress(stepKey)
        } else throw new Error(json.error?.message)
        return
      }

      const res = await fetch(def.apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      })
      const json = await res.json()
      if (json.success) {
        updateStep(stepKey, { status: 'done', data: json.data })
        saveCurrentProgress(stepKey)
      } else {
        throw new Error(json.error?.message || '生成失败')
      }
    } catch (e) {
      updateStep(stepKey, { status: 'pending', error: (e as Error).message })
    } finally {
      onGeneratingChange?.(false)
    }
  }

  const getRequestContext = useCallback((stepKey: StepKey) => {
    const arch = getStep('architecture')
    const chars = getStep('characters')
    const world = getStep('world')
    const vol = getStep('volume')

    const base = {
      idea,
      targetWords,
      pace,
      pov,
      audience: userPreferences?.audience,
      tone: userPreferences?.tone,
    }

    switch (stepKey) {
      case 'architecture':
        return { ...base }

      case 'characters':
        return { ...base, architecture: (arch.data as any)?.architecture || arch.data }

      case 'world': {
        const archData = (arch.data as any)?.architecture || arch.data
        const charList = extractArray((chars.data as any)?.characters)
        return {
          ...base,
          architecture: { storySummary: archData?.storySummary, mainConflict: archData?.mainConflict },
          characters: charList.map((c: any) => ({ name: c.name, description: c.description })),
        }
      }

      case 'volume': {
        const archData = (arch.data as any)?.architecture || arch.data
        const charList = extractArray((chars.data as any)?.characters)
        const worldList = extractArray((world.data as any)?.worldSettings)
        return {
          ...base,
          architecture: archData,
          characters: charList.map((c: any) => ({ name: c.name, role: c.role })),
          worldSettings: worldList.map((w: any) => ({ name: w.name, type: w.type })),
        }
      }

      case 'foreshadowings': {
        const chData = vol.data as any
        const fCharList = extractArray((chars.data as any)?.characters)
        const fWorldList = extractArray((world.data as any)?.worldSettings)
        const chList = extractArray(chData?.chapters)
        return {
          chapters: chList.map((c: any) => ({
            chapterNumber: c.chapterNumber, title: c.title, summary: c.summary || '',
          })),
          characters: fCharList.map((c: any) => ({ name: c.name })),
          worldSettings: fWorldList.map((w: any) => ({ name: w.name })),
        }
      }

      case 'styleAnchor':
        return { idea, tone: userPreferences?.tone }

      default:
        return base
    }
  }, [idea, targetWords, pace, userPreferences, getStep, pov])

  // 每步完成时保存进度
  const saveCurrentProgress = (completedKey: StepKey) => {
    const done = steps
      .filter(s => s.status === 'done' || s.key === completedKey)
      .map(s => s.key)
    const unique = [...new Set([...done, completedKey])]
    const pid = resumeProgress?.projectId
    if (pid) {
      localStorage.setItem(`init-progress-${pid}`, JSON.stringify(unique))
      fetch(`/api/projects/${pid}/init-progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doneSteps: unique }),
      }).catch(() => { /* 非关键路径 */ })
    }
  }

  // 跳过当前步骤
  const skipCurrent = () => {
    updateStep(activeStep, { status: 'skipped' })
    goNext()
  }

  // 跳过后续全部
  const skipAll = async () => {
    setSteps(prev => prev.map(s =>
      s.status === 'pending' || s.status === 'loading' ? { ...s, status: 'skipped' as StepStatus } : s
    ))
    await finalize()
  }

  // 下一步
  const goNext = () => {
    const idx = STEP_DEFS.findIndex(d => d.key === activeStep)
    const next = STEP_DEFS[idx + 1]
    if (next) {
      setActiveStep(next.key)
    } else {
      finalize()
    }
  }

  // 切换到已完成步骤（或当前可对话步）
  const switchToStep = (key: StepKey) => {
    const step = getStep(key)
    if (step.status === 'done' || step.status === 'loading' || step.status === 'pending' || step.status === 'skipped') {
      // 只允许访问：已完成、已跳过、或第一个未完成步及之前
      const firstIncomplete = STEP_DEFS.find(d => {
        const s = getStep(d.key)
        return s.status === 'pending' || s.status === 'loading'
      })?.key
      const keyIdx = STEP_DEFS.findIndex(d => d.key === key)
      const lockIdx = firstIncomplete
        ? STEP_DEFS.findIndex(d => d.key === firstIncomplete)
        : STEP_DEFS.length
      if (keyIdx <= lockIdx || step.status === 'done' || step.status === 'skipped') {
        setActiveStep(key)
      }
    }
  }

  // 写入数据库
  const finalize = async () => {
    onGeneratingChange?.(true)
    try {
      const results: Record<string, unknown> = {}
      const completedSteps: StepKey[] = []
      steps.forEach(s => {
        if (s.status === 'done' && s.data) {
          completedSteps.push(s.key)
          results[s.key === 'volume' ? 'chapters' : s.key] = s.data
          if (s.key === 'architecture') results.architecture = (s.data as any)?.architecture || s.data
          if (s.key === 'volume') results.chapters = (s.data as any)?.chapters || s.data
        }
      })

      const styleAnchorData = getStep('styleAnchor')
      if (styleAnchorData.status === 'done' && styleAnchorData.data) {
        results.styleAnchor = styleAnchorData.data
      }

      const existingProjectId = resumeProgress?.projectId
      const endpoint = existingProjectId
        ? `/api/projects/${existingProjectId}/init`
        : '/api/onboarding/finalize'
      const body = existingProjectId
        ? { results }
        : { projectTitle, idea, results, pov }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        const pid = existingProjectId || json.data.projectId
        localStorage.setItem(`init-progress-${pid}`, JSON.stringify(completedSteps))
        fetch(`/api/projects/${pid}/init-progress`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doneSteps: completedSteps }),
        }).catch(() => { /* 非关键路径 */ })
        setProjectId(pid)
        setPhase('complete')
        setTimeout(() => onComplete(pid), 1200)
      }
    } catch (e) {
      console.error('Finalize failed:', e)
    } finally {
      onGeneratingChange?.(false)
    }
  }

  // ======== 配置阶段 ========
  if (phase === 'config') {
    return (
      <div className="h-full min-h-0 overflow-hidden">
        <ConfigPhase
          projectTitle={projectTitle}
          setProjectTitle={setProjectTitle}
          targetWords={targetWords}
          setTargetWords={setTargetWords}
          pace={pace}
          setPace={setPace}
          pov={pov}
          setPov={setPov}
          userPreferences={userPreferences}
          onBack={onBack}
          onSkipAll={skipAll}
          onStart={() => setPhase('review')}
        />
      </div>
    )
  }

  // ======== 完成阶段 ========
  if (phase === 'complete') {
    return (
      <div className="h-full min-h-0 overflow-hidden">
        <CompletePhase steps={steps} />
      </div>
    )
  }

  // ======== 审核阶段（对话式） ========
  return (
    <div className="h-full min-h-0 overflow-hidden">
      <ReviewPhase
        idea={idea}
        projectTitle={projectTitle}
        targetWords={targetWords}
        pace={pace}
        pov={pov}
        userPreferences={userPreferences}
        steps={steps}
        activeStep={activeStep}
        getStep={getStep}
        switchToStep={switchToStep}
        updateStep={updateStep}
        skipCurrent={skipCurrent}
        skipAll={skipAll}
        goNext={goNext}
        onConfirmExtracted={handleConfirmExtracted}
        onGeneratingChange={onGeneratingChange}
        onQuickGenerate={quickGenerate}
      />
    </div>
  )
}
