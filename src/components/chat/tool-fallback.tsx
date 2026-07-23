'use client'

/**
 * 通用工具调用 UI（assistant-ui Tool Fallback）
 * - 服务端工具审批：respondToApproval
 * - 执行中 / 成功 / 失败状态展示
 */

import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  XCircle,
} from 'lucide-react'
import type { ToolCallMessagePartProps } from '@assistant-ui/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getToolMetadata, isWriteOperation } from '@/lib/ai/tool-metadata'
import { cn } from '@/lib/utils'
import { asRecord, formatToolOutput } from './tool-helpers'

export function ToolFallback(props: ToolCallMessagePartProps) {
  const { toolName, args, argsText, result, isError, approval, status, respondToApproval } =
    props
  const metadata = getToolMetadata(toolName)
  const title = metadata?.displayName || toolName
  const write = isWriteOperation(toolName)
  const [expanded, setExpanded] = useState(false)
  const [processing, setProcessing] = useState(false)

  const needsApproval =
    Boolean(approval?.id) && approval?.approved === undefined && !approval?.resolution

  const argsPreview =
    args && typeof args === 'object' && Object.keys(args as object).length > 0
      ? args
      : argsText
        ? safeParseJson(argsText)
        : {}

  if (needsApproval) {
    return (
      <Card className={cn('border-2', write ? 'border-orange-500' : 'border-blue-500')}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <AlertCircle
              className={cn('h-5 w-5', write ? 'text-orange-500' : 'text-blue-500')}
            />
            <CardTitle className="text-base">{title}</CardTitle>
            <Badge variant={write ? 'destructive' : 'default'}>
              {write ? '写操作' : '只读'}
            </Badge>
          </div>
          <CardDescription>
            {metadata?.description || '工具调用需要确认后才会执行'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between px-2 py-1 h-auto"
            onClick={() => setExpanded((v) => !v)}
          >
            <span className="text-sm text-muted-foreground">
              {expanded ? '收起参数' : '查看参数'}
            </span>
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          {expanded && (
            <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-x-auto">
              {JSON.stringify(argsPreview, null, 2)}
            </pre>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={processing}
            onClick={async () => {
              setProcessing(true)
              try {
                respondToApproval({ approved: false })
              } finally {
                setProcessing(false)
              }
            }}
          >
            <XCircle className="h-4 w-4 mr-1" />
            拒绝
          </Button>
          <Button
            size="sm"
            className="flex-1"
            disabled={processing}
            onClick={async () => {
              setProcessing(true)
              try {
                respondToApproval({ approved: true })
              } finally {
                setProcessing(false)
              }
            }}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            确认执行
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (approval?.approved === false || approval?.resolution) {
    return (
      <div className="rounded-md border border-muted-foreground/30 bg-muted/60 px-3 py-2 text-xs flex items-center gap-2">
        <XCircle className="h-4 w-4 text-muted-foreground" />
        <span>已拒绝执行：{title}</span>
      </div>
    )
  }

  if (result !== undefined) {
    const ok = !isError && asRecord(result).ok !== false
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
        <div className="min-w-0">
          <div className="font-medium">{ok ? `${title}成功` : `${title}失败`}</div>
          <div className="mt-1 text-muted-foreground break-words">
            {formatToolOutput(result)}
          </div>
        </div>
      </div>
    )
  }

  if (status?.type === 'incomplete' && status.reason === 'error') {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
        <div>
          <div className="font-medium">{title}执行失败</div>
          <div className="mt-1 text-muted-foreground">
            {'error' in status && typeof status.error === 'string'
              ? status.error
              : '未知错误'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs flex items-center gap-2">
      <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
      <span>{title}执行中…</span>
      <Badge variant={write ? 'destructive' : 'secondary'}>
        {write ? '写操作' : '只读'}
      </Badge>
    </div>
  )
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}
