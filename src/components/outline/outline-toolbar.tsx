'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ListTree, GitBranch, Plus, ChevronsDownUp, ChevronsUpDown, Sparkles } from 'lucide-react'

export type ViewMode = 'timeline' | 'tree'
export type StatusFilter = 'all' | 'planned' | 'writing' | 'completed'

interface OutlineToolbarProps {
  viewMode: ViewMode
  statusFilter: StatusFilter
  onViewModeChange: (mode: ViewMode) => void
  onStatusFilterChange: (filter: StatusFilter) => void
  onCreateOutline: () => void
  onGenerateOutline: () => void
  onExpandAll: () => void
  onCollapseAll: () => void
}

export function OutlineToolbar({
  viewMode,
  statusFilter,
  onViewModeChange,
  onStatusFilterChange,
  onCreateOutline,
  onGenerateOutline,
  onExpandAll,
  onCollapseAll,
}: OutlineToolbarProps) {
  return (
    <div className="flex items-center gap-3 px-6 py-3 border-b bg-muted/5">
      {/* View mode toggle */}
      <div className="flex items-center rounded-md border bg-background">
        <Button
          variant={viewMode === 'timeline' ? 'secondary' : 'ghost'}
          size="sm"
          className="rounded-r-none h-8"
          onClick={() => onViewModeChange('timeline')}
        >
          <ListTree className="mr-1.5 h-4 w-4" />
          时间线
        </Button>
        <Button
          variant={viewMode === 'tree' ? 'secondary' : 'ghost'}
          size="sm"
          className="rounded-l-none h-8"
          onClick={() => onViewModeChange('tree')}
        >
          <GitBranch className="mr-1.5 h-4 w-4" />
          树形图
        </Button>
      </div>

      {/* Status filter */}
      <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as StatusFilter)}>
        <SelectTrigger className="h-8 w-[110px]">
          <SelectValue placeholder="全部状态" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部</SelectItem>
          <SelectItem value="planned">计划中</SelectItem>
          <SelectItem value="writing">写作中</SelectItem>
          <SelectItem value="completed">已完成</SelectItem>
        </SelectContent>
      </Select>

      {/* Expand/Collapse */}
      <Button variant="ghost" size="sm" className="h-8" onClick={onExpandAll}>
        <ChevronsUpDown className="mr-1.5 h-4 w-4" />
        展开
      </Button>
      <Button variant="ghost" size="sm" className="h-8" onClick={onCollapseAll}>
        <ChevronsDownUp className="mr-1.5 h-4 w-4" />
        折叠
      </Button>

      <div className="flex-1" />

      {/* Create / Generate */}
      <Button variant="outline" size="sm" className="h-8" onClick={onCreateOutline}>
        <Plus className="mr-1.5 h-4 w-4" />
        新建大纲
      </Button>
      <Button size="sm" className="h-8" onClick={onGenerateOutline}>
        <Sparkles className="mr-1.5 h-4 w-4" />
        AI 生成
      </Button>
    </div>
  )
}
