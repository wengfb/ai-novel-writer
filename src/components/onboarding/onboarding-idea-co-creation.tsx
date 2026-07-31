'use client'

import { IdeaCoCreationWorkspace } from '@/components/ideas/idea-co-creation-workspace'
import { toStoryIdeaCard } from '@/lib/ideas/idea-utils'
import type { IdeaItem, StoryIdeaCard } from '@/types'

interface Props {
  onConfirmed: (idea: StoryIdeaCard, ideaId: string) => void
  onCancel?: () => void
  onSwitchToManual?: () => void
}

/** 开书入口复用创意中心的共创工作台，确认后再进入项目初始化审核。 */
export function OnboardingIdeaCoCreation({ onConfirmed, onCancel, onSwitchToManual }: Props) {
  return (
    <IdeaCoCreationWorkspace
      onCancel={onCancel}
      onSwitchToManual={onSwitchToManual}
      confirmLabel="确认创意并开始审核"
      onSaved={(idea: IdeaItem) => {
        onConfirmed(toStoryIdeaCard(idea), idea.id)
      }}
    />
  )
}
