'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { OnboardingStep3PreviewProps, StepKey, StepState, StepStatus } from './step3/types'
import { STEP_DEFS } from './step3/constants'
import { extractArray } from './step3/step-result-preview'
import { ConfigPhase } from './step3/config-phase'
import { CompletePhase } from './step3/complete-phase'
import { ReviewPhase } from './step3/review-phase'
import { normalizeProjectGenre } from '@/lib/ai/onboarding/normalize'
import { projectsApi } from '@/lib/api/endpoints/projects'

// ============ 主组件 ============

export function OnboardingStep3Preview({
  idea,
  ideaId,
  userPreferences,
  onComplete,
  onBack,
  onGeneratingChange,
  onPhaseChange,
  resumeProgress,
}: OnboardingStep3PreviewProps) {
  const defaultTitle = idea.title || `${idea.genre || '新'}小说`
  const [projectTitle, setProjectTitle] = useState(
    resumeProgress ? defaultTitle : defaultTitle
  )
  const [targetWords, setTargetWords] = useState(1000000)
  const [pace, setPace] = useState<'fast' | 'medium' | 'slow'>('medium')
  const [pov, setPov] = useState<'first_person' | 'third_person' | 'multiple_pov'>(
    (userPreferences?.pov as any) || 'third_person'
  )

  const doneSteps = resumeProgress?.doneSteps || []
  const firstPending = STEP_DEFS.find((d) => !doneSteps.includes(d.key))?.key || 'architecture'

  const [phase, setPhase] = useState<'config' | 'review' | 'complete'>(
    resumeProgress ? 'review' : 'config'
  )
  const [activeStep, setActiveStep] = useState<StepKey>(firstPending)

  useEffect(() => {
    onPhaseChange?.(phase)
  }, [phase, onPhaseChange])

  const [steps, setSteps] = useState<StepState[]>(
    STEP_DEFS.map((d) => ({
      key: d.key,
      status: doneSteps.includes(d.key) ? ('done' as StepStatus) : ('pending' as StepStatus),
      data: null,
      error: null,
    }))
  )
  /** 配置确认后即创建；续建则沿用已有 id */
  const [projectId, setProjectId] = useState<string | null>(resumeProgress?.projectId ?? null)
  const projectIdRef = useRef(projectId)
  useEffect(() => {
    projectIdRef.current = projectId
  }, [projectId])

  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)

  const getStep = useCallback((key: StepKey) => steps.find((s) => s.key === key)!, [steps])

  const updateStep = useCallback((key: StepKey, update: Partial<StepState>) => {
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, ...update } : s)))
  }, [])

  const persistProgress = useCallback((done: StepKey[], pid?: string | null) => {
    const id = pid ?? projectIdRef.current
    if (!id) return
    localStorage.setItem(`init-progress-${id}`, JSON.stringify(done))
    fetch(`/api/projects/${id}/init-progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doneSteps: done }),
    }).catch(() => {})
  }, [])

  /** 确保已有项目壳；新建时落库并初始化空进度 */
  const ensureProjectShell = useCallback(async (): Promise<string> => {
    if (projectIdRef.current) return projectIdRef.current

    const title = projectTitle.trim()
    if (!title) throw new Error('请填写项目名称')

    const res = await projectsApi.create({
      title,
      description: idea.highConcept || idea.coreConflict || '',
      genre: normalizeProjectGenre(idea.genre || userPreferences?.genre || '其他'),
      status: 'draft',
      pov,
    })
    const pid = res.data?.project?.id
    if (!pid) throw new Error('创建项目失败：未返回项目 ID')

    setProjectId(pid)
    projectIdRef.current = pid
    persistProgress([], pid)

    // 若从创意中心开书，尽早关联，避免中途退出后创意与项目脱节
    if (ideaId) {
      fetch(`/api/ideas/${ideaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'converted', convertedToProjectId: pid }),
      }).catch(() => {})
    }

    return pid
  }, [projectTitle, idea, userPreferences?.genre, pov, ideaId, persistProgress])

  const handleConfirmExtracted = useCallback(
    (stepKey: StepKey, data: Record<string, unknown>) => {
      setSteps((prev) => {
        const next = prev.map((s) =>
          s.key === stepKey
            ? { ...s, status: 'done' as StepStatus, data, error: null }
            : s
        )
        const unique = next.filter((s) => s.status === 'done').map((s) => s.key)
        persistProgress(unique)
        return next
      })
    },
    [persistProgress]
  )

  const quickGenerate = async (stepKey: StepKey) => {
    updateStep(stepKey, { status: 'loading', error: null })
    onGeneratingChange?.(true)
    try {
      const def = STEP_DEFS.find((d) => d.key === stepKey)!
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

  const getRequestContext = useCallback(
    (stepKey: StepKey) => {
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
            architecture: {
              storySummary: archData?.storySummary,
              mainConflict: archData?.mainConflict,
            },
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
              chapterNumber: c.chapterNumber,
              title: c.title,
              summary: c.summary || '',
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
    },
    [idea, targetWords, pace, userPreferences, getStep, pov]
  )

  const saveCurrentProgress = (completedKey: StepKey) => {
    const done = steps
      .filter((s) => s.status === 'done' || s.key === completedKey)
      .map((s) => s.key)
    const unique = [...new Set([...done, completedKey])]
    persistProgress(unique)
  }

  const skipCurrent = () => {
    updateStep(activeStep, { status: 'skipped' })
    goNext()
  }

  const skipAll = async () => {
    setSteps((prev) =>
      prev.map((s) =>
        s.status === 'pending' || s.status === 'loading'
          ? { ...s, status: 'skipped' as StepStatus }
          : s
      )
    )
    await finalize()
  }

  const goNext = () => {
    const idx = STEP_DEFS.findIndex((d) => d.key === activeStep)
    const next = STEP_DEFS[idx + 1]
    if (next) {
      setActiveStep(next.key)
    } else {
      void finalize()
    }
  }

  const switchToStep = (key: StepKey) => {
    const step = getStep(key)
    if (
      step.status === 'done' ||
      step.status === 'loading' ||
      step.status === 'pending' ||
      step.status === 'skipped'
    ) {
      const firstIncomplete = STEP_DEFS.find((d) => {
        const s = getStep(d.key)
        return s.status === 'pending' || s.status === 'loading'
      })?.key
      const keyIdx = STEP_DEFS.findIndex((d) => d.key === key)
      const lockIdx = firstIncomplete
        ? STEP_DEFS.findIndex((d) => d.key === firstIncomplete)
        : STEP_DEFS.length
      if (keyIdx <= lockIdx || step.status === 'done' || step.status === 'skipped') {
        setActiveStep(key)
      }
    }
  }

  /** 把已确认步骤写入已有项目（项目壳应已存在） */
  const finalize = async () => {
    onGeneratingChange?.(true)
    setConfigError(null)
    try {
      const pid = await ensureProjectShell()

      const results: Record<string, unknown> = {}
      const completedSteps: StepKey[] = []
      steps.forEach((s) => {
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

      const res = await fetch(`/api/projects/${pid}/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results }),
      })
      const json = await res.json()
      if (json.success) {
        persistProgress(completedSteps, pid)
        setProjectId(pid)
        setPhase('complete')
        setTimeout(() => onComplete(pid), 1200)
      } else {
        throw new Error(json.error?.message || '写入项目失败')
      }
    } catch (e) {
      console.error('Finalize failed:', e)
      setConfigError(e instanceof Error ? e.message : '写入项目失败')
    } finally {
      onGeneratingChange?.(false)
    }
  }

  /** 配置页：先建项目再进审核 */
  const handleStartReview = async () => {
    setIsCreatingProject(true)
    setConfigError(null)
    onGeneratingChange?.(true)
    try {
      await ensureProjectShell()
      setPhase('review')
    } catch (e) {
      setConfigError(e instanceof Error ? e.message : '创建项目失败')
    } finally {
      setIsCreatingProject(false)
      onGeneratingChange?.(false)
    }
  }

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
          onSkipAll={() => void skipAll()}
          onStart={() => void handleStartReview()}
          isBusy={isCreatingProject}
          error={configError}
        />
      </div>
    )
  }

  if (phase === 'complete') {
    return (
      <div className="h-full min-h-0 overflow-hidden">
        <CompletePhase steps={steps} />
      </div>
    )
  }

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
        skipAll={() => void skipAll()}
        goNext={goNext}
        onConfirmExtracted={handleConfirmExtracted}
        onQuickGenerate={quickGenerate}
      />
    </div>
  )
}
