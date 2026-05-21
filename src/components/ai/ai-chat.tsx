'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Send, Loader2, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseMessage, type ParsedToolInvocation } from '@/lib/ai/message-parser'
import { getToolMetadata, isWriteOperation } from '@/lib/ai/tool-metadata'
import { ToolCallConfirmation } from './tool-call-confirmation'
import { ChatSettingsPanel } from './chat-settings-panel'
import { useCharacterStore } from '@/lib/store/character-store'
import { useWorldStore } from '@/lib/store/world-store'
import { useChapterStore } from '@/lib/store/chapter-store'

interface AIChatProps {
  projectId: string
  chapterId?: string
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function formatToolOutput(output: unknown): string {
  if (typeof output === 'string') return output
  if (!output || typeof output !== 'object') return '工具已执行完成'

  const result = output as Record<string, unknown>
  if (result.ok === false && typeof result.error === 'string') return result.error

  const character = asRecord(result.character)
  if (typeof character.name === 'string') return `角色「${character.name}」已更新`

  const worldElement = asRecord(result.worldElement)
  if (typeof worldElement.name === 'string') return `世界观元素「${worldElement.name}」已更新`

  const chapter = asRecord(result.chapter)
  if (typeof chapter.title === 'string') return `章节「${chapter.title}」已更新`

  const project = asRecord(result.project)
  if (typeof project.title === 'string') return `已查询项目「${project.title}」的信息`

  return '工具已执行完成'
}

function ToolStatusCard({ toolPart }: { toolPart: ParsedToolInvocation }) {
  const metadata = getToolMetadata(toolPart.toolName)
  const title = metadata?.displayName || toolPart.toolName

  if (toolPart.state === 'approval-responded') {
    const approved = toolPart.approval?.approved
    return (
      <div className={cn(
        'rounded-md border px-3 py-2 text-xs flex items-center gap-2',
        approved ? 'border-blue-500/40 bg-blue-500/10' : 'border-muted-foreground/30 bg-muted/60'
      )}>
        {approved ? <CheckCircle className="h-4 w-4 text-blue-500" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
        <span>{approved ? `已批准执行：${title}` : `已拒绝执行：${title}`}</span>
      </div>
    )
  }

  if (toolPart.state === 'output-available') {
    const ok = asRecord(toolPart.output).ok !== false
    return (
      <div className={cn(
        'rounded-md border px-3 py-2 text-xs flex items-start gap-2',
        ok ? 'border-green-500/40 bg-green-500/10' : 'border-destructive/40 bg-destructive/10'
      )}>
        {ok ? <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" /> : <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />}
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

async function refreshToolState(
  toolPart: ParsedToolInvocation,
  projectId: string,
  fallbackChapterId: string | undefined,
  fetchCharacters: (projectId: string) => Promise<void>,
  fetchWorldElements: (projectId: string) => Promise<void>,
  fetchChapters: (projectId: string) => Promise<void>
) {
  if (toolPart.toolName === 'createCharacter' || toolPart.toolName === 'updateCharacter') {
    await fetchCharacters(projectId)
    return
  }

  if (toolPart.toolName === 'createWorldElement' || toolPart.toolName === 'updateWorldElement') {
    await fetchWorldElements(projectId)
    return
  }

  if (toolPart.toolName === 'updateChapterContent') {
    await fetchChapters(projectId)

    const outputChapter = asRecord(asRecord(toolPart.output).chapter)
    const updatedChapterId = typeof outputChapter.id === 'string' ? outputChapter.id : fallbackChapterId
    const { chapters, setCurrentChapter } = useChapterStore.getState()
    const updatedChapter = chapters.find((chapter) => chapter.id === updatedChapterId)
    if (updatedChapter) setCurrentChapter(updatedChapter)
  }
}

export function AIChat({ projectId, chapterId }: AIChatProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const refreshedToolCallsRef = useRef<Set<string>>(new Set())

  const fetchCharacters = useCharacterStore((state) => state.fetchCharacters)
  const fetchWorldElements = useWorldStore((state) => state.fetchWorldElements)
  const fetchChapters = useChapterStore((state) => state.fetchChapters)

  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/ai/chat',
    body: {
      projectId,
      chapterId,
    },
  }), [projectId, chapterId])

  const {
    messages,
    status,
    error,
    setMessages,
    sendMessage,
    addToolApprovalResponse,
    clearError,
  } = useChat({
    id: `${projectId}:${chapterId ?? 'project'}`,
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  })

  const parsedMessages = useMemo(() => messages.map(parseMessage), [messages])
  const pendingToolApproval = parsedMessages.some((message) => (
    message.toolParts.some((toolPart) => toolPart.state === 'approval-requested')
  ))
  const isLoading = status === 'streaming' || status === 'submitted'
  const inputDisabled = isLoading || pendingToolApproval

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    parsedMessages.forEach((message) => {
      message.toolParts.forEach((toolPart) => {
        if (toolPart.state !== 'output-available' || !isWriteOperation(toolPart.toolName)) return

        const output = asRecord(toolPart.output)
        if (output.ok === false) return

        const refreshKey = `${toolPart.toolCallId}:${toolPart.state}`
        if (refreshedToolCallsRef.current.has(refreshKey)) return

        refreshedToolCallsRef.current.add(refreshKey)
        refreshToolState(
          toolPart,
          projectId,
          chapterId,
          fetchCharacters,
          fetchWorldElements,
          fetchChapters
        ).catch((err) => {
          console.error('刷新工具调用结果失败:', err)
          refreshedToolCallsRef.current.delete(refreshKey)
        })
      })
    })
  }, [parsedMessages, projectId, chapterId, fetchCharacters, fetchWorldElements, fetchChapters])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || inputDisabled) return

    const messageText = input.trim()
    setInput('')

    try {
      await sendMessage({ text: messageText })
    } catch (err) {
      console.error('发送消息失败:', err)
    }
  }

  const handleClearMessages = () => {
    setMessages([])
    clearError()
    refreshedToolCallsRef.current.clear()
  }

  const handleApproveToolCall = async (approvalId: string) => {
    await addToolApprovalResponse({ id: approvalId, approved: true })
  }

  const handleRejectToolCall = async (approvalId: string) => {
    await addToolApprovalResponse({ id: approvalId, approved: false })
  }

  return (
    <div className="flex flex-col h-full">
      <ChatSettingsPanel />

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p>开始与 AI 助手对话</p>
                <p className="text-sm mt-2">我可以帮你分析剧情、完善角色、优化文笔...</p>
              </div>
            )}

            {messages.map((message) => {
              const parsedMessage = parseMessage(message)
              const isUserMessage = message.role === 'user'

              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    isUserMessage ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-lg px-4 py-2 space-y-3',
                      isUserMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {parsedMessage.textContent && (
                      <p className="text-sm whitespace-pre-wrap">{parsedMessage.textContent}</p>
                    )}

                    {parsedMessage.toolParts.map((toolPart) => {
                      if (toolPart.state === 'approval-requested' && toolPart.approval?.id) {
                        return (
                          <ToolCallConfirmation
                            key={toolPart.toolCallId}
                            approvalId={toolPart.approval.id}
                            toolName={toolPart.toolName}
                            args={asRecord(toolPart.input)}
                            onApprove={handleApproveToolCall}
                            onReject={handleRejectToolCall}
                          />
                        )
                      }

                      return <ToolStatusCard key={toolPart.toolCallId} toolPart={toolPart} />
                    })}
                  </div>
                </div>
              )
            })}

            {isLoading && !pendingToolApproval && (
              <div className="flex gap-3 justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm flex justify-between items-center">
          <span>{error.message}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto py-0 px-2"
            onClick={() => window.location.reload()}
          >
            重试
          </Button>
        </div>
      )}

      {pendingToolApproval && (
        <div className="px-4 py-2 bg-orange-500/10 text-xs text-muted-foreground border-t">
          有工具调用等待确认，请先批准或拒绝后再继续对话。
        </div>
      )}

      <form onSubmit={onSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            id="ai-chat-input"
            name="message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={pendingToolApproval ? '请先处理上方工具调用确认...' : '输入消息...'}
            className="min-h-[60px] resize-none"
            disabled={inputDisabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSubmit(e)
              }
            }}
          />
          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || inputDisabled}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
            {messages.length > 0 && !isLoading && !pendingToolApproval && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleClearMessages}
                title="清空对话"
              >
                清
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          按 Enter 发送，Shift+Enter 换行
        </p>
      </form>
    </div>
  )
}
