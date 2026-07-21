'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseMessage } from '@/lib/ai/message-parser'
import { ToolCallConfirmation } from '../tool-call-confirmation'
import { ToolStatusCard } from './tool-status-card'
import { asRecord } from './tool-helpers'

interface ChatMessageListProps {
  messages: Array<{ id: string; role: string }>
  isLoading: boolean
  pendingToolApproval: boolean
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  onApproveToolCall: (approvalId: string) => Promise<void>
  onRejectToolCall: (approvalId: string) => Promise<void>
}

/** 消息列表与工具调用展示 */
export function ChatMessageList({
  messages,
  isLoading,
  pendingToolApproval,
  messagesEndRef,
  onApproveToolCall,
  onRejectToolCall,
}: ChatMessageListProps) {
  return (
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
            const parsedMessage = parseMessage(message as any)
            const isUserMessage = message.role === 'user'

            return (
              <div
                key={message.id}
                className={cn('flex gap-3', isUserMessage ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-4 py-2 space-y-3',
                    isUserMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}
                >
                  {parsedMessage.textContent && (
                    <div className="text-sm whitespace-pre-wrap max-h-80 overflow-y-auto">
                      {parsedMessage.textContent}
                    </div>
                  )}

                  {parsedMessage.toolParts.map((toolPart) => {
                    if (toolPart.state === 'approval-requested' && toolPart.approval?.id) {
                      return (
                        <ToolCallConfirmation
                          key={toolPart.toolCallId}
                          approvalId={toolPart.approval.id}
                          toolName={toolPart.toolName}
                          args={asRecord(toolPart.input)}
                          onApprove={onApproveToolCall}
                          onReject={onRejectToolCall}
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
  )
}
