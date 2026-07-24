'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { StoryIdeaCard } from '@/types'
import { OnboardingStep1Welcome } from './onboarding-step1-welcome'
import { OnboardingStep3Preview } from './onboarding-step3-preview'
import type { OnboardingContext } from '@/lib/store/ui-store'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface ProjectOnboardingPanelProps {
  context?: OnboardingContext | null
  onComplete: (projectId: string) => void
  onCancel?: () => void
  onSwitchToManual?: () => void
  className?: string
}

/** 项目引导 — 中间区全页向导 */
export function ProjectOnboardingPanel({
  context,
  onComplete,
  onCancel,
  onSwitchToManual,
  className,
}: ProjectOnboardingPanelProps) {
  const resumeProject = context?.mode === 'resume' ? context.resumeProject : undefined
  const prefillIdea = context?.mode === 'prefill' ? context.prefillIdea : undefined
  const resumeIdea = resumeProject ? buildIdeaFromProject(resumeProject) : null
  const [resumeProgress, setResumeProgress] = useState<{
    projectId: string; doneSteps: StepKey[]
  } | undefined>(undefined)
  // 进度加载标记：为 true 时暂不渲染 Step 2，避免闪烁
  const [progressLoaded, setProgressLoaded] = useState(!resumeProject)

  // 续建模式：异步从服务端加载进度
  useEffect(() => {
    if (!resumeProject) return
    let cancelled = false
    fetch(`/api/projects/${resumeProject.id}/init-progress`)
      .then(async (res) => {
        if (!res.ok) return { doneSteps: [] }
        return res.json()
      })
      .then((json) => {
        if (cancelled) return
        const doneSteps: StepKey[] = json.data?.doneSteps || json.doneSteps || []
        setResumeProgress({ projectId: resumeProject.id, doneSteps })
        setProgressLoaded(true)
      })
      .catch(() => {
        if (!cancelled) {
          setResumeProgress({ projectId: resumeProject.id, doneSteps: [] })
          setProgressLoaded(true)
        }
      })
    return () => { cancelled = true }
  }, [resumeProject?.id])

  const effectiveIdea = prefillIdea || resumeIdea

  const [step, setStep] = useState<1 | 2>(effectiveIdea ? 2 : 1)
  const [step2Phase, setStep2Phase] = useState<'config' | 'review' | 'complete'>(
    resumeProject ? 'review' : 'config'
  )
  const [selectedIdea, setSelectedIdea] = useState<StoryIdeaCard | null>(effectiveIdea)
  const [isGenerating, setIsGenerating] = useState(false)
  const [userPreferences, setUserPreferences] = useState<{
    audience?: string
    genre?: string
    tone?: string
  }>(resumeProject ? { genre: resumeProject.genre } : {})

  const handleStep1Next = (idea: StoryIdeaCard, preferences?: { audience?: string; genre?: string; tone?: string }) => {
    setSelectedIdea(idea)
    if (preferences) setUserPreferences(preferences)
    setStep(2)
  }

  const handleStep2Back = () => {
    setStep(1)
  }

  const handleComplete = (projectId: string) => {
    setIsGenerating(false)
    onComplete(projectId)
    setStep(1)
    setStep2Phase('config')
    setSelectedIdea(null)
    setUserPreferences({})
  }

  return (
    <div className={cn('flex h-full min-h-0 flex-col bg-background', className)}>
      <div className="flex shrink-0 items-center gap-3 border-b px-4 py-3 sm:px-6">
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 gap-1.5"
            disabled={isGenerating}
            onClick={onCancel}
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
        )}
        <div className="min-w-0">
          <h1 className="text-lg font-semibold">
            {resumeProject ? '继续初始化项目' : '新建项目向导'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === 1 && '设置偏好，让 AI 为你生成创意方向'}
            {step === 2 && step2Phase === 'config' && '确认项目信息'}
            {step === 2 && step2Phase === 'review' && '审核并生成设定'}
            {step === 2 && step2Phase === 'complete' && '初始化完成'}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className={cn('mx-auto max-w-4xl p-6', step === 1 ? 'block' : 'hidden')}>
          <OnboardingStep1Welcome onNext={handleStep1Next} onSwitchToManual={onSwitchToManual} />
        </div>

        {selectedIdea && progressLoaded && (
          <div className={cn('mx-auto max-w-5xl p-6', step === 2 ? 'block' : 'hidden')}>
            <OnboardingStep3Preview
              idea={selectedIdea}
              userPreferences={userPreferences}
              onComplete={handleComplete}
              onBack={resumeProject ? undefined : handleStep2Back}
              onGeneratingChange={setIsGenerating}
              onPhaseChange={setStep2Phase}
              resumeProgress={resumeProgress}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ============ 辅助函数 ============

/** 从项目数据重构 StoryIdeaCard */
function buildIdeaFromProject(project: { title: string; genre: string; description: string }): StoryIdeaCard {
  return {
    id: project.title,
    title: project.title,
    genre: project.genre,
    worldBuilding: '',
    protagonist: '',
    coreConflict: '',
    mainGoal: '',
    highConcept: project.description?.slice(0, 100) || project.title,
    sublimation: '',
    openingHook: '',
  }
}

type StepKey = 'architecture' | 'characters' | 'world' | 'volume' | 'foreshadowings' | 'styleAnchor'
