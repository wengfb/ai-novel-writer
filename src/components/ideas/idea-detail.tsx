'use client'

import { useState } from 'react'
import { Check, Flag, Globe, Lightbulb, Pencil, Play, Sparkles, Star, Target, TrendingUp, User, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { IdeaComments } from '@/components/ideas/idea-comments'
import { IdeaRating } from '@/components/ideas/idea-rating'
import type { UpdateIdeaInput } from '@/lib/api/endpoints/ideas'
import type { IdeaComment, IdeaItem, StoryIdeaCard } from '@/types'

interface IdeaDetailProps {
  idea: IdeaItem | null
  comments: IdeaComment[]
  onRate: (id: string, score: number) => Promise<void>
  onComment: (id: string, content: string) => Promise<void>
  onFetchComments: (id: string, page?: number) => Promise<void>
  onCreateProject: (idea: IdeaItem) => void
  onToggleFavorite: (id: string, isFavorited: boolean) => void
  onUpdateIdea: (id: string, data: UpdateIdeaInput) => Promise<void>
}

type IdeaFieldKey = Exclude<keyof StoryIdeaCard, 'id'>

interface FieldDefinition {
  key: IdeaFieldKey
  label: string
  icon: React.ReactNode
}

function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  )
}

const IDEA_FIELDS: FieldDefinition[] = [
  { key: 'genre', label: '题材', icon: <BookOpenIcon className="h-3 w-3" /> },
  { key: 'worldBuilding', label: '世界观', icon: <Globe className="h-3 w-3" /> },
  { key: 'protagonist', label: '主角', icon: <User className="h-3 w-3" /> },
  { key: 'coreConflict', label: '核心冲突', icon: <Target className="h-3 w-3" /> },
  { key: 'mainGoal', label: '主线目标', icon: <Flag className="h-3 w-3" /> },
  { key: 'highConcept', label: '高概念梗概', icon: <Lightbulb className="h-3 w-3" /> },
  { key: 'sublimation', label: '内容升华', icon: <TrendingUp className="h-3 w-3" /> },
  { key: 'openingHook', label: '开篇切入点', icon: <Play className="h-3 w-3" /> },
]

/** 展示、点评并直接编辑已经保存的创意卡。 */
export function IdeaDetail({
  idea,
  comments,
  onRate,
  onComment,
  onFetchComments,
  onCreateProject,
  onToggleFavorite,
  onUpdateIdea,
}: IdeaDetailProps) {
  const [editingField, setEditingField] = useState<IdeaFieldKey | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (!idea) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
        <Lightbulb className="mb-3 h-12 w-12 opacity-20" />
        <p className="text-sm">选择一个创意查看详情</p>
        <p className="mt-1 text-xs">或点击「返回创意中心」开始共创</p>
      </div>
    )
  }

  const isFavorited = idea.status === 'favorited'
  const isConverted = idea.status === 'converted'
  const isEdited = !idea.aiGenerated

  const startEditing = (field: IdeaFieldKey, value: string) => {
    setEditingField(field)
    setEditValue(value)
  }

  const cancelEditing = () => {
    setEditingField(null)
    setEditValue('')
  }

  const saveField = async (field: IdeaFieldKey) => {
    setIsSaving(true)
    try {
      await onUpdateIdea(idea.id, { [field]: editValue, aiGenerated: false })
      cancelEditing()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-xs">{idea.genre}</Badge>
            {isEdited ? <Badge variant="outline" className="border-amber-500/30 px-1 text-[10px] text-amber-600">已编辑</Badge> : null}
            {!isEdited && idea.aiGenerated ? <Badge variant="outline" className="px-1 text-[10px]">AI</Badge> : null}
            {isFavorited ? <Badge className="border-yellow-500/20 bg-yellow-500/10 px-1 text-[10px] text-yellow-600"><Star className="mr-0.5 h-2.5 w-2.5" />已收藏</Badge> : null}
          </div>
          <h2 className="text-lg font-bold">{idea.title}</h2>
        </div>
        {!isConverted ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <Button variant={isFavorited ? 'secondary' : 'outline'} size="sm" className="h-8 text-xs" onClick={() => onToggleFavorite(idea.id, isFavorited)}>
              <Star className={`mr-1 h-3.5 w-3.5 ${isFavorited ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              {isFavorited ? '取消' : '收藏'}
            </Button>
            <Button size="sm" className="h-8 text-xs" onClick={() => onCreateProject(idea)}>
              <Sparkles className="mr-1 h-3.5 w-3.5" />创建项目
            </Button>
          </div>
        ) : null}
      </div>

      <Card className="py-2"><CardContent className="p-3"><IdeaRating ideaId={idea.id} rating={idea.rating} onRate={onRate} /></CardContent></Card>

      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
            {IDEA_FIELDS.filter((field) => field.key !== 'genre').map((field) => {
              const value = idea[field.key]
              const isEditing = editingField === field.key
              if (!value && !isEditing) return null

              return (
                <div key={field.key} className="group flex min-w-0 items-start gap-1.5">
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground"><span className="-mt-px inline-flex">{field.icon}</span>{field.label}</span>
                    {isEditing ? (
                      <div className="mt-1 space-y-1.5">
                        <Textarea value={editValue} onChange={(event) => setEditValue(event.target.value)} className="min-h-[60px] resize-none text-xs" autoFocus />
                        <div className="flex items-center gap-1">
                          <Button size="sm" className="h-6 px-2 text-xs" onClick={() => void saveField(field.key)} disabled={isSaving}><Check className="mr-0.5 h-3 w-3" />保存</Button>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={cancelEditing} disabled={isSaving}><X className="mr-0.5 h-3 w-3" />取消</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-1">
                        <p className="text-xs leading-relaxed">{value}</p>
                        <button type="button" onClick={() => startEditing(field.key, value)} className="mt-0.5 shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"><Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" /></button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Separator />
      <IdeaComments ideaId={idea.id} comments={comments} onAddComment={onComment} onFetchComments={onFetchComments} />
    </div>
  )
}
