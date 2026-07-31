'use client'

import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface IdeaCenterToolbarProps {
  search: string
  setSearch: (value: string) => void
  statusFilter: string
  setStatusFilter: (value: string) => void
  genreFilter: string
  setGenreFilter: (value: string) => void
  genres: string[]
  filteredCount: number
  onOpenCoCreation: () => void
}

/** 创意中心的筛选栏和共创入口，不负责页面标题。 */
export function IdeaCenterToolbar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  genreFilter,
  setGenreFilter,
  genres,
  filteredCount,
  onOpenCoCreation,
}: IdeaCenterToolbarProps) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
      <div className="relative max-w-xs flex-1">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索创意..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-8 pl-8 text-sm"
        />
      </div>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="h-7 w-[100px] text-xs"><SelectValue placeholder="状态" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部状态</SelectItem>
          <SelectItem value="draft">草稿</SelectItem>
          <SelectItem value="favorited">已收藏</SelectItem>
          <SelectItem value="converted">已使用</SelectItem>
          <SelectItem value="archived">已归档</SelectItem>
        </SelectContent>
      </Select>

      <Select value={genreFilter} onValueChange={setGenreFilter}>
        <SelectTrigger className="h-7 w-[100px] text-xs"><SelectValue placeholder="题材" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部题材</SelectItem>
          {genres.map((genre) => <SelectItem key={genre} value={genre}>{genre}</SelectItem>)}
        </SelectContent>
      </Select>

      <span className="ml-auto text-xs text-muted-foreground">共 {filteredCount} 个创意</span>
      <Button onClick={onOpenCoCreation} size="sm">
        <Plus className="mr-1.5 h-4 w-4" />
        开始共创
      </Button>
    </div>
  )
}
