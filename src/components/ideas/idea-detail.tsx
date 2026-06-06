'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Globe, User, Target, Flag, Lightbulb, TrendingUp, Play, Pencil, Check, X } from 'lucide-react'
import { IdeaRating } from '@/components/ideas/idea-rating'
import { IdeaComments } from '@/components/ideas/idea-comments'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sparkles, Star } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import type { IdeaItem, IdeaComment } from '@/types'

interface IdeaDetailProps {
  idea: IdeaItem | null
  comments: IdeaComment[]
  onRate: (id: string, score: number) => Promise<void>
  onComment: (id: string, content: string) => Promise<void>
  onFetchComments: (id: string, page?: number) => Promise<void>
  onCreateProject: (idea: IdeaItem) => void
  onToggleFavorite: (id: string, isFavorited: boolean) => void
  onUpdateIdea: (id: string, data: Partial<{
    title: string; genre: string; worldBuilding: string; protagonist: string;
    coreConflict: string; mainGoal: string; highConcept: string;
    sublimation: string; openingHook: string; aiGenerated: boolean;
  }>) => Promise<void>
}

function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  )
}

type FieldDef = {
  key: string; label: string; icon: React.ReactNode
}

const FIELDS: FieldDef[] = [
  { key: 'genre', label: '题材', icon: <BookOpenIcon className="h-3 w-3" /> },
  { key: 'worldBuilding', label: '世界观', icon: <Globe className="h-3 w-3" /> },
  { key: 'protagonist', label: '主角', icon: <User className="h-3 w-3" /> },
  { key: 'coreConflict', label: '核心冲突', icon: <Target className="h-3 w-3" /> },
  { key: 'mainGoal', label: '主线目标', icon: <Flag className="h-3 w-3" /> },
  { key: 'highConcept', label: '高概念梗概', icon: <Lightbulb className="h-3 w-3" /> },
  { key: 'sublimation', label: '内容升华', icon: <TrendingUp className="h-3 w-3" /> },
  { key: 'openingHook', label: '开篇切入点', icon: <Play className="h-3 w-3" /> },
]

export function IdeaDetail({
  idea, comments,
  onRate, onComment, onFetchComments,
  onCreateProject, onToggleFavorite, onUpdateIdea,
}: IdeaDetailProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (!idea) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Lightbulb className="h-12 w-12 mb-3 opacity-20" />
        <p className="text-sm">选择一个创意查看详情</p>
        <p className="text-xs mt-1">或点击右上角「生成新创意」</p>
      </div>
    )
  }

  const isFavorited = idea.status === 'favorited'
  const isConverted = idea.status === 'converted'
  const isEdited = !idea.aiGenerated

  const handleStartEdit = (key: string, value: string) => {
    setEditingField(key)
    setEditValue(value)
  }

  const handleCancelEdit = () => {
    setEditingField(null)
    setEditValue('')
  }

  const handleSaveEdit = async (id: string, key: string) => {
    setIsSaving(true)
    // Pass aiGenerated: false to mark as edited
    await onUpdateIdea(id, { [key]: editValue, aiGenerated: false })
    setIsSaving(false)
    setEditingField(null)
    setEditValue('')
  }

  return (
    <div className="p-5 space-y-4">
      {/* 标题 + 操作 */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <Badge variant="secondary" className="text-xs">{idea.genre}</Badge>
            {isEdited ? (
              <Badge variant="outline" className="text-[10px] px-1 border-amber-500/30 text-amber-600">已编辑</Badge>
            ) : idea.aiGenerated && (
              <Badge variant="outline" className="text-[10px] px-1">AI</Badge>
            )}
            {isFavorited && (
              <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-[10px] px-1">
                <Star className="h-2.5 w-2.5 mr-0.5" />已收藏
              </Badge>
            )}
          </div>
          <h2 className="text-lg font-bold">{idea.title}</h2>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!isConverted && (
            <Button variant={isFavorited ? 'secondary' : 'outline'} size="sm" className="h-8 text-xs"
              onClick={() => onToggleFavorite(idea.id, isFavorited)}>
              <Star className={`h-3.5 w-3.5 mr-1 ${isFavorited ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              {isFavorited ? '取消' : '收藏'}
            </Button>
          )}
          {!isConverted && (
            <Button size="sm" className="h-8 text-xs" onClick={() => onCreateProject(idea)}>
              <Sparkles className="mr-1 h-3.5 w-3.5" />创建项目
            </Button>
          )}
        </div>
      </div>

      {/* 评分 */}
      <Card className="py-2">
        <CardContent className="p-3">
          <IdeaRating ideaId={idea.id} rating={idea.rating} onRate={onRate} />
        </CardContent>
      </Card>

      {/* 详情 —— 两列网格，省空间 */}
      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
            {FIELDS.filter(f => f.key !== 'genre').map((f) => {
              const value = (idea as any)[f.key] as string | undefined
              if (!value && editingField !== f.key) return null
              return (
                <div key={f.key} className="flex items-start gap-1.5 min-w-0 group">
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] text-muted-foreground font-medium inline-flex items-center gap-1">
                      <span className="inline-flex -mt-px">{f.icon}</span>
                      {f.label}
                    </span>
                    {editingField === f.key ? (
                      <div className="mt-1 space-y-1.5">
                        <Textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="min-h-[60px] text-xs resize-none"
                          autoFocus
                        />
                        <div className="flex items-center gap-1">
                          <Button size="sm" className="h-6 text-xs px-2" onClick={() => handleSaveEdit(idea.id, f.key)} disabled={isSaving}>
                            <Check className="h-3 w-3 mr-0.5" />保存
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={handleCancelEdit} disabled={isSaving}>
                            <X className="h-3 w-3 mr-0.5" />取消
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-1">
                        <p className="text-xs leading-relaxed">{value}</p>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(f.key, value || '')}
                          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5 p-0.5 hover:bg-muted rounded"
                        >
                          <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
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

      <IdeaComments ideaId={idea.id} comments={comments}
        onAddComment={onComment} onFetchComments={onFetchComments} />
    </div>
  )
}
