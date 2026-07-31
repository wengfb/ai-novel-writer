'use client'

/**
 * 统一 AI 会话入口
 * - UI：官方 assistant-ui registry 模板（components/assistant-ui/thread）
 * - 协议：AI SDK 7 + AssistantChatTransport
 * - 业务：projectId / agentId / 工具写库刷新 / Onboarding contextAppend
 */

import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import {
  AssistantRuntimeProvider,
  useAui,
  useThread,
} from '@assistant-ui/react'
import {
  AssistantChatTransport,
  useChatRuntime,
} from '@assistant-ui/react-ai-sdk'
import { lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai'
import { Thread } from '@/components/assistant-ui/thread'
import { ChatSettingsPanel } from '@/components/ai/chat-settings-panel'
import { cn } from '@/lib/utils'
import { ToolStateRefresher } from './tool-state-refresher'
import type { AssistantScopeType } from '@/lib/ai/agent-workspace'

export interface UnifiedChatProps {
  /** 绑定项目（Studio 写库工具需要） */
  projectId?: string
  chapterId?: string
  /** 默认 studio-chat；Onboarding 用 onboarding + systemSlot */
  agentId?: string
  /** 多 slot agent 的 system 槽位，如 system.architecture */
  systemSlot?: string
  /** 会话 id 后缀，避免多实例串会话 */
  sessionKey?: string
  api?: string
  showSettings?: boolean
  /** 拼到 system 的动态上下文（创意卡 / 已确认步骤） */
  contextAppend?: string
  /** 当前参考资产，用于后端收紧工具集。 */
  scopeType?: AssistantScopeType
  scopeId?: string
  /** 为主 Agent 提供只更新当前页面草稿的工具。 */
  draftTarget?: 'idea' | 'onboarding' | 'outline'
  draftStep?: 'architecture' | 'characters' | 'world' | 'volume' | 'foreshadowings' | 'styleAnchor'
  /** 进入会话后自动发送的首条用户消息（仅空会话时） */
  autoSendMessage?: string
  /** 空会话欢迎标题（覆盖官方 Welcome） */
  welcomeTitle?: string
  welcomeSubtitle?: string
  className?: string
  header?: ReactNode
  /** 主 Agent 完成一个工具调用后触发，用于同步非持久化的页面草稿。 */
  onToolCallComplete?: (toolName: string, result: unknown) => void
}

export function UnifiedChat({
  projectId,
  chapterId,
  agentId = 'studio-chat',
  systemSlot,
  sessionKey,
  api = '/api/ai/chat',
  showSettings = true,
  contextAppend,
  scopeType,
  scopeId,
  draftTarget,
  draftStep,
  autoSendMessage,
  welcomeTitle = '开始与 AI 助手对话',
  welcomeSubtitle = '可以帮你分析剧情、完善角色、优化文笔…',
  className,
  header,
  onToolCallComplete,
}: UnifiedChatProps) {
  const transport = useMemo(
    () =>
      new AssistantChatTransport({
        api,
        body: {
          projectId,
          chapterId,
          agentId,
          systemSlot,
          contextAppend,
          scopeType,
          scopeId,
          draftTarget,
          draftStep,
        },
      }),
    [api, projectId, chapterId, agentId, systemSlot, contextAppend, scopeType, scopeId, draftTarget, draftStep]
  )

  const runtime = useChatRuntime({
    id: [
      projectId ?? 'global',
      chapterId ?? 'none',
      agentId,
      systemSlot ?? 'default',
      sessionKey ?? 'default',
    ].join(':'),
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  })

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {projectId ? (
        <ToolStateRefresher projectId={projectId} chapterId={chapterId} />
      ) : null}
      <ChatBridge
        autoSendMessage={autoSendMessage}
        onToolCallComplete={onToolCallComplete}
      />
      <div className={cn('flex h-full min-h-0 max-h-full flex-col overflow-hidden', className)}>
        {showSettings ? <ChatSettingsPanel /> : null}
        {header}
        <div className="min-h-0 flex-1 overflow-hidden">
          <Thread
            components={{
              Welcome: () => (
                <LocalizedWelcome title={welcomeTitle} subtitle={welcomeSubtitle} />
              ),
            }}
          />
        </div>
      </div>
    </AssistantRuntimeProvider>
  )
}

/** 在 RuntimeProvider 内：首轮 auto-send 与工具完成事件桥接。 */
function ChatBridge({
  autoSendMessage,
  onToolCallComplete,
}: {
  autoSendMessage?: string
  onToolCallComplete?: (toolName: string, result: unknown) => void
}) {
  const aui = useAui()
  const messages = useThread((thread) => thread.messages)
  const sentRef = useRef(false)
  const toolCallCompleteRef = useRef(onToolCallComplete)
  const handledToolCallsRef = useRef(new Set<string>())

  useEffect(() => {
    toolCallCompleteRef.current = onToolCallComplete
  }, [onToolCallComplete])

  useEffect(() => {
    if (!toolCallCompleteRef.current) return
    for (const message of messages) {
      if (message.role !== 'assistant') continue
      for (const part of message.content) {
        if (part.type !== 'tool-call' || part.result === undefined) continue
        if (handledToolCallsRef.current.has(part.toolCallId)) continue
        handledToolCallsRef.current.add(part.toolCallId)
        toolCallCompleteRef.current(part.toolName, part.result)
      }
    }
  }, [messages])

  useEffect(() => {
    if (!autoSendMessage?.trim() || sentRef.current) return
    // 等 runtime 挂载后再 append
    const t = window.setTimeout(() => {
      try {
        const state = aui.thread().getState()
        if ((state.messages?.length ?? 0) > 0 || state.isRunning) {
          sentRef.current = true
          return
        }
        sentRef.current = true
        aui.thread().append({
          role: 'user',
          content: [{ type: 'text', text: autoSendMessage.trim() }],
        })
      } catch {
        sentRef.current = false
      }
    }, 120)
    return () => window.clearTimeout(t)
  }, [aui, autoSendMessage])

  return null
}

/** 仅替换欢迎文案，其余 Thread UI 保持官方模板 */
function LocalizedWelcome({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  return (
    <div className="aui-thread-welcome-root mb-6 flex flex-col items-center px-4 text-center">
      <h1 className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-1 animate-in fill-mode-both text-2xl font-semibold duration-200">
        {title}
      </h1>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm">{subtitle}</p>
    </div>
  )
}
