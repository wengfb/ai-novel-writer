'use client'

import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ParsedToolInvocation } from '@/lib/ai/message-parser'
import { getToolMetadata, isWriteOperation } from '@/lib/ai/tool-metadata'
import { asRecord, formatToolOutput } from './tool-helpers'

/** 工具调用状态卡片（批准/成功/失败/等待） */
export function ToolStatusCard({ toolPart }: { toolPart: ParsedToolInvocation }) {
  const metadata = getToolMetadata(toolPart.toolName)
  const title = metadata?.displayName || toolPart.toolName

  if (toolPart.state === 'approval-responded') {
    const approved = toolPart.approval?.approved
    return (
      <div
        className={cn(
          'rounded-md border px-3 py-2 text-xs flex items-center gap-2',
          approved ? 'border-blue-500/40 bg-blue-500/10' : 'border-muted-foreground/30 bg-muted/60'
        )}
      >
        {approved ? (
          <CheckCircle className="h-4 w-4 text-blue-500" />
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground" />
        )}
        <span>{approved ? `已批准执行：${title}` : `已拒绝执行：${title}`}</span>
      </div>
    )
  }

  if (toolPart.state === 'output-available') {
    const ok = asRecord(toolPart.output).ok !== false
    return (
      <div
        className={cn(
          'rounded-md border px-3 py-2 text-xs flex items-start gap-2',
          ok ? 'border-green-500/40 bg-green-500/10' : 'border-destructive/40 bg-destructive/10'
        )}
      >
        {ok ? (
          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
        ) : (
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
        )}
        <div>
          <div className="font-medium">{ok ? `${title}成功` : `${title}失败`}</div>
          <div className="mt-1 text-muted-foreground">{formatToolOutput(toolPart.output)}</div>
        </div>
      </div>
    )
  }

  if (toolPart.state === 'output-error') {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
        <div>
          <div className="font-medium">{title}执行失败</div>
          <div className="mt-1 text-muted-foreground">{toolPart.errorText || '未知错误'}</div>
        </div>
      </div>
    )
  }

  if (toolPart.state === 'output-denied') {
    return (
      <div className="rounded-md border border-muted-foreground/30 bg-muted/60 px-3 py-2 text-xs flex items-center gap-2">
        <XCircle className="h-4 w-4 text-muted-foreground" />
        <span>已拒绝执行：{title}</span>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs flex items-center gap-2">
      <Clock className="h-4 w-4 text-blue-500" />
      <span>{title}准备执行中...</span>
      <Badge variant={isWriteOperation(toolPart.toolName) ? 'destructive' : 'secondary'}>
        {isWriteOperation(toolPart.toolName) ? '写操作' : '只读'}
      </Badge>
    </div>
  )
}
