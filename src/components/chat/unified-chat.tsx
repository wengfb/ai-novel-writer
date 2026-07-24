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
  /** 进入会话后自动发送的首条用户消息（仅空会话时） */
  autoSendMessage?: string
  /** 空会话欢迎标题（覆盖官方 Welcome） */
  welcomeTitle?: string
  welcomeSubtitle?: string
  className?: string
  header?: ReactNode
  /** 暴露 runtime 侧能力给父组件（整理对话文本等） */
  chatApiRef?: React.MutableRefObject<UnifiedChatApi | null>
}

export interface UnifiedChatApi {
  /** 将当前线程消息拼成纯文本，供 extract 使用 */
  getConversationText: () => string
  isRunning: () => boolean
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
  autoSendMessage,
  welcomeTitle = '开始与 AI 助手对话',
  welcomeSubtitle = '可以帮你分析剧情、完善角色、优化文笔…',
  className,
  header,
  chatApiRef,
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
        },
      }),
    [api, projectId, chapterId, agentId, systemSlot, contextAppend]
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
        chatApiRef={chatApiRef}
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

/** 在 RuntimeProvider 内：首轮 auto-send + 暴露对话文本 API */
function ChatBridge({
  autoSendMessage,
  chatApiRef,
}: {
  autoSendMessage?: string
  chatApiRef?: React.MutableRefObject<UnifiedChatApi | null>
}) {
  const aui = useAui()
  const sentRef = useRef(false)

  useEffect(() => {
    if (!chatApiRef) return
    chatApiRef.current = {
      getConversationText: () => {
        try {
          const state = aui.thread().getState()
          const messages = state.messages ?? []
          return messages
            .map((m) => {
              const role = m.role === 'user' ? '用户' : m.role === 'assistant' ? '助手' : m.role
              const text = (m.content || [])
                .filter((p: any) => p.type === 'text' && p.text)
                .map((p: any) => p.text as string)
                .join('\n')
              return text ? `【${role}】\n${text}` : ''
            })
            .filter(Boolean)
            .join('\n\n')
        } catch {
          return ''
        }
      },
      isRunning: () => {
        try {
          return Boolean(aui.thread().getState().isRunning)
        } catch {
          return false
        }
      },
    }
    return () => {
      if (chatApiRef) chatApiRef.current = null
    }
  }, [aui, chatApiRef])

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
