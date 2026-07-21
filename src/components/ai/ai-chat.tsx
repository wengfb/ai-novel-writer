'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai'
import { Button } from '@/components/ui/button'
import { parseMessage } from '@/lib/ai/message-parser'
import { isWriteOperation } from '@/lib/ai/tool-metadata'
import { ChatSettingsPanel } from './chat-settings-panel'
import { useCharacterStore } from '@/lib/store/character-store'
import { useWorldStore } from '@/lib/store/world-store'
import { useChapterStore } from '@/lib/store/chapter-store'
import { useOutlineStore } from '@/lib/store/outline-store'
import { asRecord, refreshToolState } from './ai-chat/tool-helpers'
import { ChatMessageList } from './ai-chat/chat-message-list'
import { ChatInputForm } from './ai-chat/chat-input-form'

interface AIChatProps {
  projectId: string
  chapterId?: string
}

export function AIChat({ projectId, chapterId }: AIChatProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const refreshedToolCallsRef = useRef<Set<string>>(new Set())

  const fetchCharacters = useCharacterStore((state) => state.fetchCharacters)
  const fetchWorldElements = useWorldStore((state) => state.fetchWorldElements)
  const fetchChapters = useChapterStore((state) => state.fetchChapters)
  const fetchOutlines = useOutlineStore((state) => state.fetchOutlines)

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/ai/chat',
        body: { projectId, chapterId },
      }),
    [projectId, chapterId]
  )

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
  const pendingToolApproval = parsedMessages.some((message) =>
    message.toolParts.some((toolPart) => toolPart.state === 'approval-requested')
  )
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
          fetchChapters,
          fetchOutlines
        ).catch((err) => {
          console.error('刷新工具调用结果失败:', err)
          refreshedToolCallsRef.current.delete(refreshKey)
        })
      })
    })
  }, [parsedMessages, projectId, chapterId, fetchCharacters, fetchWorldElements, fetchChapters, fetchOutlines])

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

      <ChatMessageList
        messages={messages}
        isLoading={isLoading}
        pendingToolApproval={pendingToolApproval}
        messagesEndRef={messagesEndRef}
        onApproveToolCall={handleApproveToolCall}
        onRejectToolCall={handleRejectToolCall}
      />

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

      <ChatInputForm
        input={input}
        setInput={setInput}
        inputDisabled={inputDisabled}
        isLoading={isLoading}
        pendingToolApproval={pendingToolApproval}
        hasMessages={messages.length > 0}
        onSubmit={onSubmit}
        onClear={handleClearMessages}
      />
    </div>
  )
}
