'use client'

import { useCallback, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { IdeaCoCreationWorkspace } from '@/components/ideas/idea-co-creation-workspace'
import { IdeaDetail } from '@/components/ideas/idea-detail'
import { useIdeas } from '@/hooks/use-ideas'
import { toStoryIdeaCard } from '@/lib/ideas/idea-utils'
import type { IdeaItem, StoryIdeaCard } from '@/types'
import { AlertCircle, ArrowLeft, Lightbulb, RefreshCw, Sparkles } from 'lucide-react'
import { filterIdeas } from './idea-center/constants'
import { IdeaGridCard } from './idea-center/idea-grid-card'
import { IdeaCenterToolbar } from './idea-center/toolbar'

interface IdeaCenterPageProps {
  onClose?: () => void
  onCreateProject?: (idea: StoryIdeaCard, ideaId: string) => void
}

type IdeaCenterView =
  | { type: 'list' }
  | { type: 'detail'; idea: IdeaItem }
  | { type: 'co-create'; idea: IdeaItem | null }

/** 创意工作台：在中间工作区内切换列表、详情和共创，不用弹窗承载核心任务。 */
export function IdeaCenterPage({ onClose, onCreateProject }: IdeaCenterPageProps) {
  const {
    ideas,
    isLoading,
    error,
    currentIdea,
    currentIdeaComments,
    refetch,
    fetchIdea,
    updateIdea,
    deleteIdea,
    rateIdea,
    fetchComments,
    addComment,
  } = useIdeas()
  const [view, setView] = useState<IdeaCenterView>({ type: 'list' })
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [genreFilter, setGenreFilter] = useState('all')

  const genres = Array.from(new Set(ideas.map((idea) => idea.genre)))
  const filteredIdeas = filterIdeas(ideas, { search, statusFilter, genreFilter })
  const detailIdea = view.type === 'detail'
    ? currentIdea?.id === view.idea.id ? currentIdea : view.idea
    : null

  const showList = useCallback(() => setView({ type: 'list' }), [])
  const startCoCreation = useCallback((idea: IdeaItem | null = null) => {
    setView({ type: 'co-create', idea })
  }, [])

  const openDetail = useCallback(async (idea: IdeaItem) => {
    setView({ type: 'detail', idea })
    await Promise.all([fetchIdea(idea.id), fetchComments(idea.id)])
  }, [fetchIdea, fetchComments])

  const handleCreateProject = useCallback((idea: IdeaItem) => {
    const card = toStoryIdeaCard(idea)
    if (onCreateProject) {
      onCreateProject(card, idea.id)
      return
    }

    sessionStorage.setItem('onboardingSelectedIdea', JSON.stringify(card))
    sessionStorage.setItem('onboardingFromIdeaCenter', 'true')
    sessionStorage.setItem('onboardingIdeaId', idea.id)
    window.location.href = '/'
  }, [onCreateProject])

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteIdea(deleteTarget)
    if (view.type === 'detail' && view.idea.id === deleteTarget) showList()
    setDeleteTarget(null)
  }

  if (view.type === 'co-create') {
    return <IdeaCoCreationView idea={view.idea} onBack={showList} onOpenDetail={openDetail} onRefetch={refetch} />
  }

  if (view.type === 'detail') {
    return (
      <IdeaDetailView
        idea={detailIdea}
        comments={currentIdeaComments}
        onBack={showList}
        onCoCreate={startCoCreation}
        onCreateProject={handleCreateProject}
        onRate={rateIdea}
        onComment={addComment}
        onFetchComments={fetchComments}
        onToggleFavorite={(id, isFavorited) => updateIdea(id, { status: isFavorited ? 'draft' : 'favorited' })}
        onUpdateIdea={updateIdea}
      />
    )
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
        <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
          {onClose ? (
            <Button variant="ghost" size="sm" className="shrink-0 gap-1.5" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
              返回
            </Button>
          ) : null}
          <Lightbulb className="h-5 w-5 shrink-0 text-yellow-500" />
          <span className="font-semibold">创意中心</span>
        </div>

        <IdeaCenterToolbar
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          genreFilter={genreFilter}
          setGenreFilter={setGenreFilter}
          genres={genres}
          filteredCount={filteredIdeas.length}
          onOpenCoCreation={() => startCoCreation()}
        />

        <IdeaListContent
          ideas={filteredIdeas}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          onSelect={openDetail}
          onDelete={setDeleteTarget}
        />
      </div>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>删除后无法恢复，确定要删除这个创意吗？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function IdeaCoCreationView({
  idea,
  onBack,
  onOpenDetail,
  onRefetch,
}: {
  idea: IdeaItem | null
  onBack: () => void
  onOpenDetail: (idea: IdeaItem) => Promise<void>
  onRefetch: () => Promise<void>
}) {
  const returnToPreviousView = () => {
    if (idea) void onOpenDetail(idea)
    else onBack()
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <WorkspaceHeader
        title={idea ? `继续打磨：《${idea.title}》` : '新创意共创'}
        subtitle={idea ? '与创意编辑讨论并更新这张创意卡' : '从模糊想法开始，逐步确认可以开书的故事种子'}
        onBack={returnToPreviousView}
      />
      <div className="min-h-0 flex-1">
        <IdeaCoCreationWorkspace
          initialIdea={idea}
          onSaved={(savedIdea) => {
            void onRefetch()
            void onOpenDetail(savedIdea)
          }}
        />
      </div>
    </div>
  )
}

function IdeaDetailView({
  idea,
  comments,
  onBack,
  onCoCreate,
  ...detailProps
}: {
  idea: IdeaItem | null
  comments: ReturnType<typeof useIdeas>['currentIdeaComments']
  onBack: () => void
  onCoCreate: (idea: IdeaItem) => void
} & Omit<React.ComponentProps<typeof IdeaDetail>, 'idea' | 'comments' | 'onCoCreate'>) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <WorkspaceHeader
        title={idea?.title || '创意详情'}
        subtitle="审阅创意、记录反馈，或继续与创意编辑打磨"
        onBack={onBack}
        actions={idea?.status !== 'converted' ? (
          <Button size="sm" onClick={() => idea && onCoCreate(idea)}>
            <Sparkles className="mr-1.5 h-4 w-4" />
            继续共创
          </Button>
        ) : null}
      />
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto w-full max-w-4xl p-6 pb-12">
          <IdeaDetail idea={idea} comments={comments} {...detailProps} />
        </div>
      </ScrollArea>
    </div>
  )
}

function IdeaListContent({
  ideas,
  isLoading,
  error,
  onRetry,
  onSelect,
  onDelete,
}: {
  ideas: IdeaItem[]
  isLoading: boolean
  error: string | null
  onRetry: () => Promise<void>
  onSelect: (idea: IdeaItem) => Promise<void>
  onDelete: (id: string) => void
}) {
  return (
    <ScrollArea className="min-h-0 flex-1">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-48 rounded-xl" />)}
        </div>
      ) : error ? (
        <div className="mx-auto mt-8 max-w-sm p-4">
          <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>
          <Button variant="outline" className="mt-3 w-full" onClick={onRetry}><RefreshCw className="mr-2 h-4 w-4" />重试</Button>
        </div>
      ) : ideas.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
          <Lightbulb className="mb-4 h-16 w-16 opacity-20" />
          <p className="text-sm">暂无创意</p>
          <p className="mt-1 text-xs">点击右上角「开始共创」开始</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
          {ideas.map((idea) => <IdeaGridCard key={idea.id} idea={idea} onSelect={() => void onSelect(idea)} onDelete={onDelete} />)}
        </div>
      )}
    </ScrollArea>
  )
}

function WorkspaceHeader({
  title,
  subtitle,
  onBack,
  actions,
}: {
  title: string
  subtitle: string
  onBack: () => void
  actions?: React.ReactNode
}) {
  return (
    <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3 sm:px-6">
      <Button variant="ghost" size="sm" className="shrink-0 gap-1.5" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        返回创意中心
      </Button>
      <div className="min-w-0">
        <h1 className="truncate font-semibold">{title}</h1>
        <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {actions ? <div className="ml-auto shrink-0">{actions}</div> : null}
    </header>
  )
}
