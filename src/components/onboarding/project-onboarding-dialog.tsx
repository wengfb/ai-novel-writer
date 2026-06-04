'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { cn } from '@/lib/utils'
import type { StoryIdeaCard } from '@/types'
import { OnboardingStep1Welcome } from './onboarding-step1-welcome'
import { OnboardingStep3Preview } from './onboarding-step3-preview'

interface ProjectOnboardingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (projectId: string) => void
  onSwitchToManual?: () => void
  /** 续建模式：从已有项目续建，直接跳到审核流程 */
  resumeProject?: { id: string; title: string; genre: string; description: string }
}

export function ProjectOnboardingDialog({
  open,
  onOpenChange,
  onComplete,
  onSwitchToManual,
  resumeProject,
}: ProjectOnboardingDialogProps) {
  // 续建模式：从项目数据重构 idea 卡 + 加载已保存进度
  const resumeIdea = resumeProject ? buildIdeaFromProject(resumeProject) : null
  const resumeProgress = resumeProject ? loadResumeProgress(resumeProject.id) : undefined

  const [step, setStep] = useState<1 | 2>(resumeProject ? 2 : 1)
  const [step2Phase, setStep2Phase] = useState<'config' | 'review' | 'complete'>(
    resumeProject ? 'review' : 'config'
  )
  const [selectedIdea, setSelectedIdea] = useState<StoryIdeaCard | null>(resumeIdea)
  const [isGenerating, setIsGenerating] = useState(false)
  const [userPreferences, setUserPreferences] = useState<{
    audience?: string
    genre?: string
    tone?: string
  }>(resumeProject ? { genre: resumeProject.genre } : {})

  // 生成中拦截关闭事件，防止误触模态框外或 Esc 导致关闭
  const handleOpenChange = (next: boolean) => {
    if (!next && isGenerating) return
    onOpenChange(next)
  }

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
    onOpenChange(false)
    // 重置状态
    setStep(1)
    setStep2Phase('config')
    setSelectedIdea(null)
    setUserPreferences({})
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn(
        (step === 1 || step2Phase === 'config') ? 'sm:max-w-lg' : 'max-w-[62vw] sm:max-w-[62vw]',
        'h-[70vh] p-0 overflow-hidden'
      )}>
        <VisuallyHidden>
          <DialogTitle>项目创建向导</DialogTitle>
          <DialogDescription>
            {step === 1 && '设置偏好，让 AI 为你生成创意方向'}
            {step === 2 && '确认项目信息并开始创作'}
          </DialogDescription>
        </VisuallyHidden>

        <div className={step === 1 ? 'block' : 'hidden'}>
          <OnboardingStep1Welcome onNext={handleStep1Next} onSwitchToManual={onSwitchToManual} />
        </div>

        {selectedIdea && (
          <div className={step === 2 ? 'block' : 'hidden'}>
            <OnboardingStep3Preview
              idea={selectedIdea}
              userPreferences={userPreferences}
              onComplete={handleComplete}
              onBack={resumeProject ? undefined : handleStep2Back}
              onGeneratingChange={setIsGenerating}
              onPhaseChange={setStep2Phase}
              resumeProgress={resumeProgress ? { projectId: resumeProject!.id, doneSteps: resumeProgress } : undefined}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
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

/** 从 localStorage 加载已完成的步骤 */
function loadResumeProgress(projectId: string): StepKey[] {
  try {
    const raw = localStorage.getItem(`init-progress-${projectId}`)
    if (raw) return JSON.parse(raw) as StepKey[]
  } catch {}
  return []
}
