'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clapperboard,
  Edit2,
  FileText,
  MoreHorizontal,
  Plus,
  Trash2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import type { Outline } from '@/lib/store/outline-store'
import { cn } from '@/lib/utils'

interface OutlineItemProps {
  outline: Outline
  level?: number
  isActive?: boolean
  onSelect?: (outline: Outline) => void
  onEdit?: (outline: Outline) => void
  onDelete?: (outline: Outline) => void
  onCreateChild?: (parentId: string, type: 'volume' | 'chapter' | 'scene') => void
}

export function OutlineItem({
  outline,
  level = 0,
  isActive = false,
  onSelect,
  onEdit,
  onDelete,
  onCreateChild,
}: OutlineItemProps) {
  const [expanded, setExpanded] = React.useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  const hasChildren = outline.children && outline.children.length > 0

  // 获取节点类型图标
  const getTypeIcon = () => {
    switch (outline.type) {
      case 'volume':
        return <BookOpen className="h-3.5 w-3.5" />
      case 'chapter':
        return <FileText className="h-3.5 w-3.5" />
      case 'scene':
        return <Clapperboard className="h-3.5 w-3.5" />
      default:
        return <FileText className="h-3.5 w-3.5" />
    }
  }

  // 获取节点类型标签
  const getTypeLabel = () => {
    switch (outline.type) {
      case 'volume':
        return '卷'
      case 'chapter':
        return '章'
      case 'scene':
        return '场景'
      default:
        return ''
    }
  }

  // 获取状态标签
  const getStatusLabel = () => {
    switch (outline.status) {
      case 'planned':
        return '计划中'
      case 'writing':
        return '写作中'
      case 'completed':
        return '已完成'
      default:
        return ''
    }
  }

  // 获取状态颜色
  const getStatusVariant = (): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (outline.status) {
      case 'planned':
        return 'secondary'
      case 'writing':
        return 'default'
      case 'completed':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  // 获取节点类型颜色
  const getTypeColor = () => {
    switch (outline.type) {
      case 'volume':
        return 'text-blue-500'
      case 'chapter':
        return 'text-green-500'
      case 'scene':
        return 'text-orange-500'
      default:
        return 'text-gray-500'
    }
  }

  // 处理删除确认
  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false)
    if (onDelete) {
      onDelete(outline)
    }
  }

  // 处理创建子节点
  const handleCreateChild = (type: 'volume' | 'chapter' | 'scene') => {
    if (onCreateChild) {
      onCreateChild(outline.id, type)
    }
  }

  return (
    <>
      <div className="group relative max-w-full overflow-hidden">
        {/* 节点内容 */}
        <div
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer',
            'hover:bg-accent transition-colors',
            isActive && 'bg-accent',
            'w-full max-w-full'
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => onSelect?.(outline)}
        >
          {/* 展开/折叠按钮 */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(!expanded)
              }}
              className="flex-shrink-0 p-0.5 hover:bg-muted rounded"
            >
              {expanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          ) : (
            <div className="w-5 flex-shrink-0" />
          )}

          {/* 类型图标 */}
          <Badge variant="outline" className={cn('text-xs shrink-0', getTypeColor())}>
            {getTypeIcon()}
          </Badge>

          {/* 标题 */}
          <span className="flex-1 text-sm truncate min-w-0 max-w-full">{outline.title}</span>

          {/* 状态标签 */}
          {outline.status !== 'planned' && (
            <Badge variant={getStatusVariant()} className="text-xs shrink-0 text-[10px] px-1 py-0">
              {getStatusLabel()}
            </Badge>
          )}

          {/* 章节信息 */}
          {outline.chapter && (
            <span className="text-[10px] text-muted-foreground shrink-0">
              {outline.chapter.wordCount} 字
            </span>
          )}

          {/* 创作意图指示器 */}
          {outline.type === 'chapter' && outline.plotFunction && (
            <span
              className={cn(
                'text-[10px] px-1 py-0 rounded border shrink-0',
                outline.plotFunction === '推进' && 'border-blue-300 text-blue-600 bg-blue-50',
                outline.plotFunction === '转折' && 'border-purple-300 text-purple-600 bg-purple-50',
                outline.plotFunction === '铺垫' && 'border-slate-300 text-slate-600 bg-slate-50',
                outline.plotFunction === '高潮' && 'border-red-300 text-red-600 bg-red-50',
                outline.plotFunction === '过渡' && 'border-green-300 text-green-600 bg-green-50'
              )}
            >
              {outline.plotFunction}
            </span>
          )}
          {outline.type === 'chapter' && outline.tensionLevel != null && outline.tensionLevel > 0 && (
            <span className="text-[10px] text-muted-foreground shrink-0">
              T{outline.tensionLevel}
            </span>
          )}

          {/* 操作菜单 - 显示在右侧 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 -mr-1 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(outline) }}>
              <Edit2 className="mr-2 h-3.5 w-3.5" />
              编辑
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCreateChild('scene') }}>
                <Plus className="mr-2 h-3.5 w-3.5" />
                添加场景
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteDialogOpen(true) }}>
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 子节点 */}
        {expanded && hasChildren && (
          <div className="space-y-1">
            {outline.children?.map((child) => (
              <OutlineItem
                key={child.id}
                outline={child}
                level={level + 1}
                isActive={isActive}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
                onCreateChild={onCreateChild}
              />
            ))}
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{outline.title}」吗？
              {hasChildren && ' 此操作将同时删除其所有子节点，且不可恢复。'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
