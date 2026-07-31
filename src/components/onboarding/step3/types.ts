import type { StoryIdeaCard } from '@/types'

export interface UserPreferences {
  audience?: string
  genre?: string
  tone?: string
  pov?: string
}

export type StepKey = 'architecture' | 'characters' | 'world' | 'volume' | 'foreshadowings' | 'styleAnchor'
export type StepStatus = 'pending' | 'loading' | 'done' | 'skipped'

export interface StepState {
  key: StepKey
  status: StepStatus
  data: Record<string, unknown> | null
  error: string | null
}

export interface OnboardingStep3PreviewProps {
  idea: StoryIdeaCard
  /** 已保存创意的 ID；存在时 finalization 将原子标记为 converted。 */
  ideaId?: string
  userPreferences?: UserPreferences
  onComplete: (projectId: string) => void
  onBack?: () => void
  onGeneratingChange?: (generating: boolean) => void
  onPhaseChange?: (phase: 'config' | 'review' | 'complete') => void
  /** 续建模式：已有项目 ID + 已保存的进度 */
  resumeProgress?: { projectId: string; doneSteps: StepKey[] }
}
