'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * AI 聊天设置面板组件
 * 提供工具调用确认等设置选项
 */
export function ChatSettingsPanel() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border-b border-border bg-muted/30">
      {/* 折叠按钮 */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-between px-4 py-2 h-auto"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="text-sm font-medium">AI 工具设置</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {/* 设置内容 */}
      {isExpanded && (
        <div className="px-4 py-3 space-y-3">
          <div className="rounded-md border border-orange-500/30 bg-orange-500/10 p-3">
            <p className="text-sm font-medium text-orange-700">写操作始终需要确认</p>
            <p className="text-xs text-muted-foreground mt-1">
              创建/修改角色、世界观和章节内容前，AI 必须等待你手动确认。
            </p>
          </div>

          <div className="rounded-md border border-blue-500/30 bg-blue-500/10 p-3">
            <p className="text-sm font-medium text-blue-700">只读查询自动执行</p>
            <p className="text-xs text-muted-foreground mt-1">
              查询项目信息等不修改数据的工具会自动运行。
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
