'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { OnboardingStep1Welcome } from './onboarding-step1-welcome'
import { OnboardingStep2Brainstorm } from './onboarding-step2-brainstorm'
import { OnboardingStep3Preview } from './onboarding-step3-preview'

interface CreativeDirection {
  id: string
  title: string
  genre: string
  mainConflict: string
  protagonist: {
    name: string
    description: string
  }
  ending: 'open' | 'tragedy' | 'comedy'
  highlights: string[]
}

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
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [userIdea, setUserIdea] = useState('')
  const [selectedDirection, setSelectedDirection] = useState<CreativeDirection | null>(null)

  const handleStep1Next = (idea: string) => {
    setUserIdea(idea)
    setStep(2)
  }

  const handleStep2Next = (direction: CreativeDirection) => {
    setSelectedDirection(direction)
    setStep(3)
  }

  const handleStep2Back = () => {
    setStep(1)
  }

  const handleStep3Back = () => {
    setStep(2)
  }

  const handleComplete = (projectId: string) => {
    onComplete(projectId)
    onOpenChange(false)
    // 重置状态
    setStep(1)
    setUserIdea('')
    setSelectedDirection(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>项目创建向导</DialogTitle>
          <DialogDescription>
            {step === 1 && '输入你的故事想法'}
            {step === 2 && '选择 AI 生成的创意方向'}
            {step === 3 && '确认项目信息并开始创作'}
          </DialogDescription>
        </VisuallyHidden>
        {step === 1 && <OnboardingStep1Welcome onNext={handleStep1Next} onSwitchToManual={onSwitchToManual} />}
        {step === 2 && (
          <OnboardingStep2Brainstorm
            userIdea={userIdea}
            onNext={handleStep2Next}
            onBack={handleStep2Back}
          />
        )}
        {step === 3 && selectedDirection && (
          <OnboardingStep3Preview
            direction={selectedDirection}
            onComplete={handleComplete}
            onBack={handleStep3Back}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
