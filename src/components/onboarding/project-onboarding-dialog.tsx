'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import type { StoryIdeaCard } from '@/types'
import { OnboardingStep1Welcome } from './onboarding-step1-welcome'
import { OnboardingStep3Preview } from './onboarding-step3-preview'

interface ProjectOnboardingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (projectId: string) => void
  onSwitchToManual?: () => void
}

export function ProjectOnboardingDialog({
  open,
  onOpenChange,
  onComplete,
  onSwitchToManual,
}: ProjectOnboardingDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedIdea, setSelectedIdea] = useState<StoryIdeaCard | null>(null)

  const handleStep1Next = (idea: StoryIdeaCard) => {
    setSelectedIdea(idea)
    setStep(2)
  }

  const handleStep2Back = () => {
    setStep(1)
  }

  const handleComplete = (projectId: string) => {
    onComplete(projectId)
    onOpenChange(false)
    // 重置状态
    setStep(1)
    setSelectedIdea(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] max-h-[95vh] p-0 overflow-hidden">
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
              onComplete={handleComplete}
              onBack={handleStep2Back}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
