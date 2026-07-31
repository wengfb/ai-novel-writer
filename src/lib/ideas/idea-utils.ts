import type { IdeaItem, StoryIdeaCard } from '@/types'

/** 从创意中心实体提取可传入项目初始化流程的创意卡内容。 */
export function toStoryIdeaCard(idea: IdeaItem): StoryIdeaCard {
  return {
    id: idea.id,
    title: idea.title,
    genre: idea.genre,
    worldBuilding: idea.worldBuilding,
    protagonist: idea.protagonist,
    coreConflict: idea.coreConflict,
    mainGoal: idea.mainGoal,
    highConcept: idea.highConcept,
    sublimation: idea.sublimation,
    openingHook: idea.openingHook,
  }
}
