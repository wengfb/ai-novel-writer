'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { StoryIdeaCard } from '@/types'
import { OnboardingIdeaCoCreation } from './onboarding-idea-co-creation'
import { OnboardingPathChooser, type NewProjectPath } from './onboarding-path-chooser'
import { OnboardingStep3Preview } from './onboarding-step3-preview'
import type { OnboardingContext } from '@/lib/store/ui-store'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

type WizardPhase = 'choose' | 'co-create' | 'setup'

interface ProjectOnboardingPanelProps {
  context?: OnboardingContext | null
  onComplete: (projectId: string) => void
  onCancel?: () => void
  onSwitchToManual?: () => void
  /** 「用已有创意」：跳转创意中心，在详情页点开书 */
  onPickExistingIdea?: () => void
  showHeader?: boolean
  className?: string
}

function initialPhase(context?: OnboardingContext | null): WizardPhase {
  if (context?.mode === 'resume' || context?.mode === 'prefill') return 'setup'
  return 'choose'
}

/** 项目引导 — 中间区全页向导 */
export function ProjectOnboardingPanel({
  context,
  onComplete,
  onCancel,
  onSwitchToManual,
  onPickExistingIdea,
  showHeader = true,
  className,
}: ProjectOnboardingPanelProps) {
  const resumeProject = context?.mode === 'resume' ? context.resumeProject : undefined
  const prefillIdea = context?.mode === 'prefill' ? context.prefillIdea : undefined
  const resumeIdea = resumeProject ? buildIdeaFromProject(resumeProject) : null
  const [resumeProgress, setResumeProgress] = useState<{
    projectId: string
    doneSteps: StepKey[]
  } | undefined>(undefined)
  const [progressLoaded, setProgressLoaded] = useState(!resumeProject)

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
    return () => {
      cancelled = true
    }
  }, [resumeProject?.id])

  const effectiveIdea = prefillIdea || resumeIdea

  const [phase, setPhase] = useState<WizardPhase>(() => initialPhase(context))
  const [setupPhase, setSetupPhase] = useState<'config' | 'review' | 'complete'>(
    resumeProject ? 'review' : 'config'
  )
  const [selectedIdea, setSelectedIdea] = useState<StoryIdeaCard | null>(effectiveIdea)
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | undefined>(context?.prefillIdeaId)
  const [isGenerating, setIsGenerating] = useState(false)
  const [userPreferences, setUserPreferences] = useState<{
    audience?: string
    genre?: string
    tone?: string
  }>(resumeProject ? { genre: resumeProject.genre } : {})
  /** 进入 setup 前的路径，用于「返回」 */
  const [setupOrigin, setSetupOrigin] = useState<'co-create' | 'prefill' | 'resume'>(() => {
    if (context?.mode === 'resume') return 'resume'
    if (context?.mode === 'prefill') return 'prefill'
    return 'co-create'
  })

  const enterSetupFromCoCreate = (idea: StoryIdeaCard, ideaId: string) => {
    setSelectedIdea(idea)
    setSelectedIdeaId(ideaId)
    setUserPreferences({ genre: idea.genre })
    setSetupOrigin('co-create')
    setSetupPhase('config')
    setPhase('setup')
  }

  const handlePathSelect = (path: NewProjectPath) => {
    if (path === 'manual') {
      onSwitchToManual?.()
      return
    }
    if (path === 'pick-idea') {
      onPickExistingIdea?.()
      return
    }
    setPhase('co-create')
  }

  const handleSetupBack = () => {
    if (resumeProject || setupOrigin === 'resume') return
    if (setupOrigin === 'prefill') {
      // 从创意中心开书：返回创意中心更自然
      onPickExistingIdea?.() ?? onCancel?.()
      return
    }
    setSelectedIdea(null)
    setSelectedIdeaId(undefined)
    setPhase('co-create')
  }

  const handleComplete = (projectId: string) => {
    setIsGenerating(false)
    onComplete(projectId)
    setPhase('choose')
    setSetupPhase('config')
    setSelectedIdea(null)
    setUserPreferences({})
  }

  const headerSubtitle = (() => {
    if (resumeProject) return '继续未完成的初始化步骤'
    if (phase === 'choose') return '选择开书方式'
    if (phase === 'co-create') return '和 AI 确认创意后再进入项目审核'
    if (setupPhase === 'config') return '确认项目信息'
    if (setupPhase === 'review') return '审核并生成设定'
    if (setupPhase === 'complete') return '初始化完成'
    return ''
  })()

  const showCancelInHeader =
    showHeader && onCancel && phase === 'choose' && !resumeProject

  return (
    <div className={cn('flex h-full min-h-0 flex-col overflow-hidden bg-background', className)}>
      {showHeader ? (
        <div className="flex shrink-0 items-center gap-3 border-b px-4 py-3 sm:px-6">
          {showCancelInHeader ? (
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 gap-1.5"
              disabled={isGenerating}
              onClick={onCancel}
            >
              <ArrowLeft className="h-4 w-4" />
              取消创建
            </Button>
          ) : null}
          <div className="min-w-0">
            <h1 className="text-lg font-semibold">
              {resumeProject ? '继续初始化项目' : '新建项目'}
            </h1>
            <p className="text-sm text-muted-foreground">{headerSubtitle}</p>
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="flex h-full min-h-0 flex-col">
          {phase === 'choose' ? (
            <div className="relative flex h-full min-h-0 flex-col">
              {onCancel && !showHeader ? (
                <div className="absolute left-4 top-4 z-10 sm:left-6 sm:top-6">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={onCancel}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    取消
                  </Button>
                </div>
              ) : null}
              <OnboardingPathChooser onSelect={handlePathSelect} />
            </div>
          ) : null}

          {phase === 'co-create' ? (
            <OnboardingIdeaCoCreation
              onConfirmed={(idea, ideaId) => enterSetupFromCoCreate(idea, ideaId)}
              onCancel={() => setPhase('choose')}
              onSwitchToManual={onSwitchToManual}
            />
          ) : null}

          {phase === 'setup' && selectedIdea && progressLoaded ? (
            <div
              className={cn(
                setupPhase === 'review'
                  ? 'h-full min-h-0 w-full'
                  : 'mx-auto w-full max-w-5xl overflow-y-auto p-6'
              )}
            >
              <OnboardingStep3Preview
                idea={selectedIdea}
                ideaId={selectedIdeaId}
                userPreferences={userPreferences}
                onComplete={handleComplete}
                onBack={resumeProject || setupOrigin === 'resume' ? undefined : handleSetupBack}
                onGeneratingChange={setIsGenerating}
                onPhaseChange={setSetupPhase}
                resumeProgress={resumeProgress}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function buildIdeaFromProject(project: {
  title: string
  genre: string
  description: string
}): StoryIdeaCard {
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
