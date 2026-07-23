'use client'

/**
 * Studio 侧栏 AI 对话
 * UI 使用官方 assistant-ui Thread 模板，业务入口见 UnifiedChat
 */

import { UnifiedChat } from '@/components/chat/unified-chat'

interface AIChatProps {
  projectId: string
  chapterId?: string
}

export function AIChat({ projectId, chapterId }: AIChatProps) {
  return (
    <UnifiedChat
      projectId={projectId}
      chapterId={chapterId}
      agentId="studio-chat"
      showSettings
      welcomeTitle="开始与 AI 助手对话"
    />
  )
}
