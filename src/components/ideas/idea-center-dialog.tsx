'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Plus, Lightbulb, X } from 'lucide-react'
import { useIdeas } from '@/hooks/use-ideas'
import { IdeaList } from '@/components/ideas/idea-list'
import { IdeaDetail } from '@/components/ideas/idea-detail'
import { IdeaGeneratePanel } from '@/components/ideas/idea-generate-panel'
import type { IdeaItem, StoryIdeaCard } from '@/types'

interface IdeaCenterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateProject?: (idea: StoryIdeaCard, ideaId: string) => void
}

export function IdeaCenterDialog({ open, onOpenChange, onCreateProject }: IdeaCenterDialogProps) {
  const {
    ideas, isLoading, error,
    currentIdea, currentIdeaComments,
    isGenerating, generatedCards,
    hasExamples, positiveExampleCount, negativeExampleCount,
    refetch, fetchIdea, updateIdea, deleteIdea,
    rateIdea, fetchComments, addComment,
    generateIdeas, clearGeneratedCards,
  } = useIdeas()

  const [showGeneratePanel, setShowGeneratePanel] = useState(false)
  const [selectedIdea, setSelectedIdea] = useState<IdeaItem | null>(null)

  const handleSelectIdea = useCallback(async (idea: IdeaItem) => {
    setSelectedIdea(idea)
    await fetchIdea(idea.id)
    await fetchComments(idea.id)
  }, [fetchIdea, fetchComments])

  const handleCreateProject = useCallback(async (idea: IdeaItem) => {
    const ideaCard: StoryIdeaCard = {
      id: idea.id, title: idea.title, genre: idea.genre,
      worldBuilding: idea.worldBuilding, protagonist: idea.protagonist,
      coreConflict: idea.coreConflict, mainGoal: idea.mainGoal,
      highConcept: idea.highConcept, sublimation: idea.sublimation,
      openingHook: idea.openingHook,
    }
    if (onCreateProject) {
      onCreateProject(ideaCard, idea.id)
    } else {
      sessionStorage.setItem('onboardingSelectedIdea', JSON.stringify(ideaCard))
      sessionStorage.setItem('onboardingFromIdeaCenter', 'true')
      sessionStorage.setItem('onboardingIdeaId', idea.id)
      window.location.href = '/'
    }
    onOpenChange(false)
  }, [onOpenChange, onCreateProject])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          style={{ maxWidth: '900px' }}
          className="h-[82vh] p-0 flex flex-col overflow-hidden"
          showCloseButton={false}
        >
          <VisuallyHidden>
            <DialogTitle>创意中心</DialogTitle>
            <DialogDescription>浏览、评分和管理你的小说创意</DialogDescription>
          </VisuallyHidden>

          {/* 顶部栏 */}
          <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold">创意中心</span>
              {hasExamples && (
                <span className="text-xs text-muted-foreground">
                  · AI 已学习 {positiveExampleCount + negativeExampleCount} 个偏好
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowGeneratePanel(true)} disabled={isGenerating} size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                {isGenerating ? '生成中...' : '生成新创意'}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 主体两栏 —— 左侧列表 260px，右侧占满剩余 */}
          <div className="flex flex-1 min-h-0">
            <div className="w-[260px] shrink-0 border-r">
              <IdeaList
                ideas={ideas} isLoading={isLoading} error={error}
                selectedId={selectedIdea?.id || null}
                onSelect={handleSelectIdea}
                onDelete={deleteIdea} onRefresh={refetch}
              />
            </div>
            <div className="flex-1 min-w-0">
              <ScrollArea className="h-full">
                <IdeaDetail
                  idea={currentIdea || selectedIdea}
                  comments={currentIdeaComments}
                  onRate={rateIdea} onComment={addComment} onFetchComments={fetchComments}
                  onCreateProject={handleCreateProject}
                  onToggleFavorite={(id, isFav) => updateIdea(id, { status: isFav ? 'draft' : 'favorited' })}
                  onUpdateIdea={updateIdea as any}
                />
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showGeneratePanel && (
        <IdeaGeneratePanel
          isGenerating={isGenerating}
          generatedCards={generatedCards}
          hasExamples={hasExamples}
          positiveExampleCount={positiveExampleCount}
          negativeExampleCount={negativeExampleCount}
          onGenerate={generateIdeas}
          onClose={() => { setShowGeneratePanel(false); clearGeneratedCards() }}
          onSelectCard={(card) => { handleSelectIdea(card); setShowGeneratePanel(false); clearGeneratedCards() }}
        />
      )}
    </>
  )
}
