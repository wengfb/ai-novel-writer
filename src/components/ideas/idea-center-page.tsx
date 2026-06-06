'use client'

import { useState, useCallback } from 'react'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription as AlertDesc,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Plus, Lightbulb, Search, RefreshCw, Trash2, Star, MessageSquare,
  Target, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useIdeas } from '@/hooks/use-ideas'
import { IdeaDetail } from '@/components/ideas/idea-detail'
import { IdeaGeneratePanel } from '@/components/ideas/idea-generate-panel'
import type { IdeaItem, StoryIdeaCard } from '@/types'

const statusBadgeMap: Record<string, { label: string; className: string } | null> = {
  draft: null,
  favorited: { label: '收藏', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  converted: { label: '已用', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
  archived: { label: '归档', className: 'bg-muted text-muted-foreground' },
}

/**
 * 创意中心页面 — 卡片网格 + 模态框详情
 */
export function IdeaCenterPage() {
  const {
    ideas, isLoading, error,
    currentIdea, currentIdeaComments,
    isGenerating, generatedCards,
    hasExamples, positiveExampleCount, negativeExampleCount,
    refetch, fetchIdea, updateIdea, deleteIdea,
    rateIdea, fetchComments, addComment,
    generateIdeas, clearGeneratedCards, setCurrentIdea,
  } = useIdeas()

  const [showGeneratePanel, setShowGeneratePanel] = useState(false)
  const [detailIdea, setDetailIdea] = useState<IdeaItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [genreFilter, setGenreFilter] = useState<string>('all')

  const genres = Array.from(new Set(ideas.map(i => i.genre)))
  const filtered = ideas.filter(idea => {
    if (search && !idea.title.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== 'all' && idea.status !== statusFilter) return false
    if (genreFilter !== 'all' && idea.genre !== genreFilter) return false
    return true
  })

  const handleOpenDetail = useCallback(async (idea: IdeaItem) => {
    setDetailIdea(idea)
    setIsDetailOpen(true)
    await fetchIdea(idea.id)
    await fetchComments(idea.id)
  }, [fetchIdea, fetchComments, currentIdeaComments])

  const handleDetailOpenChange = (open: boolean) => {
    setIsDetailOpen(open)
    if (!open) setDetailIdea(null)
  }

  const handleCreateProject = useCallback(async (idea: IdeaItem) => {
    const ideaCard: StoryIdeaCard = {
      id: idea.id, title: idea.title, genre: idea.genre,
      worldBuilding: idea.worldBuilding, protagonist: idea.protagonist,
      coreConflict: idea.coreConflict, mainGoal: idea.mainGoal,
      highConcept: idea.highConcept, sublimation: idea.sublimation,
      openingHook: idea.openingHook,
    }
    sessionStorage.setItem('onboardingSelectedIdea', JSON.stringify(ideaCard))
    sessionStorage.setItem('onboardingFromIdeaCenter', 'true')
    sessionStorage.setItem('onboardingIdeaId', idea.id)
    window.location.href = '/'
  }, [])

  const handleDelete = async (id: string) => {
    await deleteIdea(id)
    if (detailIdea?.id === id) handleDetailOpenChange(false)
  }

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden">
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
          <Button onClick={() => setShowGeneratePanel(true)} disabled={isGenerating} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            {isGenerating ? '生成中...' : '生成新创意'}
          </Button>
        </div>

        {/* 搜索/筛选工具栏 */}
        <div className="flex items-center gap-2 px-4 py-2 border-b shrink-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索创意..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-7 text-xs w-[100px]">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="favorited">已收藏</SelectItem>
              <SelectItem value="converted">已使用</SelectItem>
              <SelectItem value="archived">已归档</SelectItem>
            </SelectContent>
          </Select>
          <Select value={genreFilter} onValueChange={setGenreFilter}>
            <SelectTrigger className="h-7 text-xs w-[100px]">
              <SelectValue placeholder="题材" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部题材</SelectItem>
              {genres.map(g => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground ml-auto">
            共 {filtered.length} 个创意
          </span>
        </div>

        {/* 卡片网格 */}
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
                <RefreshCw className="mr-2 h-4 w-4" />重试
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
              {filtered.map(idea => (
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

      {/* 详情模态框 */}
      <Dialog open={isDetailOpen} onOpenChange={handleDetailOpenChange}>
        <DialogContent
          style={{ maxWidth: '700px' }}
          className="max-h-[85vh] overflow-y-auto"
        >
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
            onToggleFavorite={(id, isFav) => updateIdea(id, { status: isFav ? 'draft' : 'favorited' })}
            onUpdateIdea={updateIdea as any}
          />
        </DialogContent>
      </Dialog>

      {/* 生成面板 */}
      {showGeneratePanel && (
        <IdeaGeneratePanel
          isGenerating={isGenerating}
          generatedCards={generatedCards}
          hasExamples={hasExamples}
          positiveExampleCount={positiveExampleCount}
          negativeExampleCount={negativeExampleCount}
          onGenerate={generateIdeas}
          onClose={() => { setShowGeneratePanel(false); clearGeneratedCards() }}
          onSelectCard={(card) => {
            handleOpenDetail(card)
            setShowGeneratePanel(false)
            clearGeneratedCards()
          }}
        />
      )}

      {/* 删除确认 */}
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

// ============ 网格卡片组件 ============

function IdeaGridCard({
  idea, onSelect, onDelete,
}: {
  idea: IdeaItem
  onSelect: () => void
  onDelete: (id: string) => void
}) {
  const statusBadge = statusBadgeMap[idea.status]

  return (
    <button
      type="button"
      className="group relative text-left rounded-xl border bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
      onClick={onSelect}
    >
      {/* 删除按钮 — 悬停显示 */}
      <span
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-destructive/10 rounded-lg z-10 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(idea.id)
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation()
            onDelete(idea.id)
          }
        }}
      >
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
      </span>

      <div className="space-y-3">
        {/* 标题行 */}
        <div>
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {idea.genre}
            </Badge>
            {statusBadge && (
              <Badge className={cn('text-[10px] px-1.5 py-0', statusBadge.className)}>
                {statusBadge.label}
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-sm leading-snug line-clamp-1">{idea.title}</h3>
        </div>

        {/* 核心冲突 */}
        <div className="flex items-start gap-1.5">
          <Target className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {idea.coreConflict}
          </p>
        </div>

        {/* 底部分数 */}
        <div className="flex items-center gap-3 pt-1">
          {idea.rating ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
              {idea.rating}星
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/50">未评分</span>
          )}
          {idea.commentCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              {idea.commentCount}
            </span>
          )}
          {idea.aiGenerated ? (
            <span className="text-[10px] text-muted-foreground/50 ml-auto">AI 生成</span>
          ) : (
            <span className="text-[10px] text-amber-600/70 ml-auto">已编辑</span>
          )}
        </div>
      </div>
    </button>
  )
}
