'use client'

import { useState, useCallback } from 'react'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription as AlertDesc,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Lightbulb, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react'
import { useIdeas } from '@/hooks/use-ideas'
import { IdeaDetail } from '@/components/ideas/idea-detail'
import { IdeaGeneratePanel } from '@/components/ideas/idea-generate-panel'
import type { IdeaItem, StoryIdeaCard } from '@/types'
import { filterIdeas } from './idea-center/constants'
import { IdeaGridCard } from './idea-center/idea-grid-card'
import { IdeaCenterToolbar } from './idea-center/toolbar'

interface IdeaCenterPageProps {
  onClose?: () => void
  onCreateProject?: (idea: import('@/types').StoryIdeaCard, ideaId: string) => void
}

/**
 * 创意中心页面 — 中间区全页：卡片网格 + 详情弹层
 */
export function IdeaCenterPage({ onClose, onCreateProject }: IdeaCenterPageProps) {
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
  const [detailIdea, setDetailIdea] = useState<IdeaItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [genreFilter, setGenreFilter] = useState<string>('all')

  const genres = Array.from(new Set(ideas.map((i) => i.genre)))
  const filtered = filterIdeas(ideas, { search, statusFilter, genreFilter })

  const handleOpenDetail = useCallback(
    async (idea: IdeaItem) => {
      setDetailIdea(idea)
      setIsDetailOpen(true)
      await fetchIdea(idea.id)
      await fetchComments(idea.id)
    },
    [fetchIdea, fetchComments]
  )

  const handleDetailOpenChange = (open: boolean) => {
    setIsDetailOpen(open)
    if (!open) setDetailIdea(null)
  }

  const handleCreateProject = useCallback(async (idea: IdeaItem) => {
    const ideaCard: StoryIdeaCard = {
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
    if (onCreateProject) {
      onCreateProject(ideaCard, idea.id)
      handleDetailOpenChange(false)
      return
    }
    sessionStorage.setItem('onboardingSelectedIdea', JSON.stringify(ideaCard))
    sessionStorage.setItem('onboardingFromIdeaCenter', 'true')
    sessionStorage.setItem('onboardingIdeaId', idea.id)
    window.location.href = '/'
  }, [onCreateProject])

  const handleDelete = async (id: string) => {
    await deleteIdea(id)
    if (detailIdea?.id === id) handleDetailOpenChange(false)
  }

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden bg-background">
        <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
          {onClose && (
            <Button variant="ghost" size="sm" className="shrink-0 gap-1.5" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
              返回
            </Button>
          )}
          <Lightbulb className="h-5 w-5 shrink-0 text-yellow-500" />
          <span className="font-semibold">创意中心</span>
          {hasExamples && (
            <span className="truncate text-xs text-muted-foreground">
              · AI 已学习 {positiveExampleCount + negativeExampleCount} 个偏好
            </span>
          )}
        </div>
        <IdeaCenterToolbar
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          genreFilter={genreFilter}
          setGenreFilter={setGenreFilter}
          genres={genres}
          filteredCount={filtered.length}
          isGenerating={isGenerating}
          hasExamples={hasExamples}
          positiveExampleCount={positiveExampleCount}
          negativeExampleCount={negativeExampleCount}
          onOpenGenerate={() => setShowGeneratePanel(true)}
        />

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="p-4 max-w-sm mx-auto mt-8">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button variant="outline" className="mt-3 w-full" onClick={refetch}>
                <RefreshCw className="mr-2 h-4 w-4" />
                重试
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Lightbulb className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-sm">暂无创意</p>
              <p className="text-xs mt-1">点击右上角「生成新创意」开始</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
              {filtered.map((idea) => (
                <IdeaGridCard
                  key={idea.id}
                  idea={idea}
                  onSelect={() => handleOpenDetail(idea)}
                  onDelete={(id) => setDeleteTarget(id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={handleDetailOpenChange}>
        <DialogContent style={{ maxWidth: '700px' }} className="max-h-[85vh] overflow-y-auto">
          <VisuallyHidden>
            <DialogTitle>创意详情</DialogTitle>
            <DialogDescription>创意详情和操作</DialogDescription>
          </VisuallyHidden>
          <IdeaDetail
            idea={currentIdea || detailIdea}
            comments={currentIdeaComments}
            onRate={rateIdea}
            onComment={addComment}
            onFetchComments={fetchComments}
            onCreateProject={handleCreateProject}
            onToggleFavorite={(id, isFav) =>
              updateIdea(id, { status: isFav ? 'draft' : 'favorited' })
            }
            onUpdateIdea={updateIdea as any}
          />
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
          onClose={() => {
            setShowGeneratePanel(false)
            clearGeneratedCards()
          }}
          onSelectCard={(card) => {
            handleOpenDetail(card)
            setShowGeneratePanel(false)
            clearGeneratedCards()
          }}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDesc>删除后无法恢复，确定要删除这个创意吗？</AlertDesc>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteTarget) {
                  await handleDelete(deleteTarget)
                  setDeleteTarget(null)
                }
              }}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
