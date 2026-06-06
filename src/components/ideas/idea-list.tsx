'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, RefreshCw, Search, Trash2 } from 'lucide-react'
import { IdeaCard } from '@/components/ideas/idea-card'
import type { IdeaItem } from '@/types'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface IdeaListProps {
  ideas: IdeaItem[]
  isLoading: boolean
  error: string | null
  selectedId: string | null
  onSelect: (idea: IdeaItem) => void
  onDelete: (id: string) => Promise<void>
  onRefresh: () => void
}

/**
 * 创意列表组件 — 左侧面板
 */
export function IdeaList({
  ideas, isLoading, error, selectedId,
  onSelect, onDelete, onRefresh,
}: IdeaListProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [genreFilter, setGenreFilter] = useState<string>('all')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // 获取独特的题材列表
  const genres = Array.from(new Set(ideas.map(i => i.genre)))

  // 筛选
  const filtered = ideas.filter(idea => {
    if (search && !idea.title.toLowerCase().includes(search.toLowerCase())) {
      return false
    }
    if (statusFilter !== 'all' && idea.status !== statusFilter) {
      return false
    }
    if (genreFilter !== 'all' && idea.genre !== genreFilter) {
      return false
    }
    return true
  })

  // Loading 骨架屏
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-9 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-3 w-full" onClick={onRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />重试
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 搜索和筛选 */}
      <div className="p-3 space-y-2 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索创意..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-7 text-xs">
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
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="题材" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部题材</SelectItem>
              {genres.map(g => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground">
          共 {filtered.length} 个创意
        </div>
      </div>

      {/* 列表 */}
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">暂无创意</p>
            <p className="text-xs mt-1">点击右上角「生成新创意」开始</p>
          </div>
        ) : (
          filtered.map(idea => (
            <div key={idea.id} className="group relative">
              <IdeaCard
                idea={idea}
                isSelected={selectedId === idea.id}
                onSelect={onSelect}
              />
              {/* 删除按钮 — 悬停显示 */}
              <button
                type="button"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteTarget(idea.id)
                }}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))
        )}
      </ScrollArea>

      {/* 删除确认 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，确定要删除这个创意吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteTarget) {
                  await onDelete(deleteTarget)
                  setDeleteTarget(null)
                }
              }}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
