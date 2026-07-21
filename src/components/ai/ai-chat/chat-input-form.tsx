'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Send } from 'lucide-react'

interface ChatInputFormProps {
  input: string
  setInput: (value: string) => void
  inputDisabled: boolean
  isLoading: boolean
  pendingToolApproval: boolean
  hasMessages: boolean
  onSubmit: (e: React.FormEvent) => void
  onClear: () => void
}

/** 聊天输入区与清空按钮 */
export function ChatInputForm({
  input,
  setInput,
  inputDisabled,
  isLoading,
  pendingToolApproval,
  hasMessages,
  onSubmit,
  onClear,
}: ChatInputFormProps) {
  return (
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
          <Button type="submit" size="icon" disabled={!input.trim() || inputDisabled}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
          {hasMessages && !isLoading && !pendingToolApproval && (
            <Button type="button" variant="outline" size="icon" onClick={onClear} title="清空对话">
              清
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">按 Enter 发送，Shift+Enter 换行</p>
    </form>
  )
}
