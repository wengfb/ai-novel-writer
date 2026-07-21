'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Lightbulb, Search } from 'lucide-react'

interface IdeaCenterToolbarProps {
  search: string
  setSearch: (v: string) => void
  statusFilter: string
  setStatusFilter: (v: string) => void
  genreFilter: string
  setGenreFilter: (v: string) => void
  genres: string[]
  filteredCount: number
  isGenerating: boolean
  hasExamples: boolean
  positiveExampleCount: number
  negativeExampleCount: number
  onOpenGenerate: () => void
}

/** 创意中心顶部栏 + 筛选工具栏 */
export function IdeaCenterToolbar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  genreFilter,
  setGenreFilter,
  genres,
  filteredCount,
  isGenerating,
  hasExamples,
  positiveExampleCount,
  negativeExampleCount,
  onOpenGenerate,
}: IdeaCenterToolbarProps) {
  return (
    <>
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
        <Button onClick={onOpenGenerate} disabled={isGenerating} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          {isGenerating ? '生成中...' : '生成新创意'}
        </Button>
      </div>

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
            {genres.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">共 {filteredCount} 个创意</span>
      </div>
    </>
  )
}
