'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIChatProps {
  projectId: string
  chapterId?: string
}

export function AIChat({ projectId, chapterId }: AIChatProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 创建 DefaultChatTransport，它会自动处理响应流解析
  const transport = useRef(new DefaultChatTransport({
    api: '/api/ai/chat',
  }))

  // 使用 Vercel AI SDK 的 useChat hook
  const { messages, status, error, setMessages, sendMessage } = useChat({
    transport: transport.current,
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 自定义提交处理（支持 Enter 发送）
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const messageText = input.trim()
    setInput('')

    try {
      await sendMessage(
        { text: messageText },
        {
          body: {
            projectId,
            chapterId,
          },
        }
      )
    } catch (err) {
      console.error('发送消息失败:', err)
    }
  }

  // 清空对话
  const handleClearMessages = () => {
    setMessages([])
  }

  return (
    <div className="flex flex-col h-full">
      {/* 消息列表 */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p>开始与 AI 助手对话</p>
                <p className="text-sm mt-2">我可以帮你分析剧情、完善角色、优化文笔...</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-4 py-2',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {/* 处理消息 parts */}
                  <p className="text-sm whitespace-pre-wrap">
                    {message.parts
                      .filter((part: any) => part.type === 'text')
                      .map((part: any, i: number) => part.text)
                      .join('')}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}

            {/* 滚动锚点 */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* 错误提示 */}
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

      {/* 输入框 */}
      <form onSubmit={onSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            id="ai-chat-input"
            name="message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入消息..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
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
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
            {messages.length > 0 && !isLoading && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleClearMessages}
                title="清空对话"
              >
                🗑️
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
