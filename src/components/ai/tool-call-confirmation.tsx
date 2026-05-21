'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { getToolMetadata } from '@/lib/ai/tool-metadata'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ToolCallConfirmationProps {
  approvalId: string
  toolName: string
  args: Record<string, unknown>
  onApprove: (approvalId: string) => Promise<void>
  onReject: (approvalId: string) => Promise<void>
}

/**
 * 工具调用确认卡片组件
 * 显示工具调用的详细信息并提供确认/拒绝按钮
 */
export function ToolCallConfirmation({
  approvalId,
  toolName,
  args,
  onApprove,
  onReject,
}: ToolCallConfirmationProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasResponded, setHasResponded] = useState(false)

  const metadata = getToolMetadata(toolName)
  const isWriteOperation = metadata?.isWriteOperation ?? true
  const isDisabled = isProcessing || hasResponded

  const handleApprove = async () => {
    setIsProcessing(true)
    try {
      await onApprove(approvalId)
      setHasResponded(true)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    setIsProcessing(true)
    try {
      await onReject(approvalId)
      setHasResponded(true)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className={`border-2 ${isWriteOperation ? 'border-orange-500' : 'border-blue-500'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertCircle className={`h-5 w-5 ${isWriteOperation ? 'text-orange-500' : 'text-blue-500'}`} />
              <CardTitle className="text-base">
                {metadata?.displayName || toolName}
              </CardTitle>
              <Badge variant={isWriteOperation ? 'destructive' : 'default'}>
                {isWriteOperation ? '写操作' : '只读'}
              </Badge>
            </div>
            <CardDescription>
              {metadata?.description || '工具调用需要确认'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* 参数展开/收起按钮 */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between px-2 py-1 h-auto"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="text-sm text-muted-foreground">
            {isExpanded ? '收起参数' : '查看参数'}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {/* 参数详情 */}
        {isExpanded && (
          <div className="mt-2 p-3 bg-muted rounded-md">
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleReject}
          disabled={isDisabled}
        >
          <XCircle className="h-4 w-4 mr-1" />
          拒绝
        </Button>
        <Button
          variant={isWriteOperation ? 'default' : 'default'}
          size="sm"
          className="flex-1"
          onClick={handleApprove}
          disabled={isDisabled}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          确认执行
        </Button>
      </CardFooter>
    </Card>
  )
}
