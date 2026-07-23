'use client'

/**
 * 统一 Thread 壳（assistant-ui primitives）
 * Studio / Onboarding 共用，只换 runtime 与空状态文案
 */

import {
  ActionBarPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useThreadRuntime,
} from '@assistant-ui/react'
import { MarkdownTextPrimitive } from '@assistant-ui/react-markdown'
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eraser,
  Loader2,
  RefreshCw,
  Square,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ToolFallback } from './tool-fallback'
import '@assistant-ui/react-markdown/styles/dot.css'

export interface ChatThreadProps {
  /** 空会话引导文案 */
  emptyTitle?: string
  emptyDescription?: string
  /** 输入框占位 */
  placeholder?: string
  /** 是否显示清空按钮 */
  showClear?: boolean
  className?: string
  /** 额外顶栏（如设置说明） */
  header?: ReactNode
}

export function ChatThread({
  emptyTitle = '开始与 AI 助手对话',
  emptyDescription = '可以帮你分析剧情、完善角色、优化文笔…',
  placeholder = '输入消息…（Enter 发送，Shift+Enter 换行）',
  showClear = true,
  className,
  header,
}: ChatThreadProps) {
  return (
    <ThreadPrimitive.Root
      className={cn('flex h-full min-h-0 flex-col bg-background', className)}
    >
      {header}

      <ThreadPrimitive.Viewport className="relative flex flex-1 flex-col overflow-y-auto px-3 py-4">
        <ThreadPrimitive.Empty>
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
            <p className="text-sm font-medium text-foreground/80">{emptyTitle}</p>
            <p className="text-xs max-w-[240px] leading-relaxed">{emptyDescription}</p>
          </div>
        </ThreadPrimitive.Empty>

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            AssistantMessage,
            EditComposer,
          }}
        />

        <ThreadPrimitive.ViewportFooter className="sticky bottom-0 flex justify-center pb-1 pt-2">
          <ThreadPrimitive.ScrollToBottom asChild>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-full shadow-sm disabled:invisible"
              aria-label="滚到最新"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </ThreadPrimitive.ScrollToBottom>
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>

      <div className="border-t bg-background p-3">
        <ComposerPrimitive.Root className="flex flex-col gap-2">
          <div className="flex items-end gap-2">
            <ComposerPrimitive.Input
              rows={1}
              autoFocus
              placeholder={placeholder}
              className={cn(
                'max-h-40 min-h-[60px] w-full flex-1 resize-none rounded-md border border-input',
                'bg-transparent px-3 py-2 text-sm shadow-xs outline-none',
                'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            />
            <div className="flex flex-col gap-2">
              <ThreadPrimitive.If running={false}>
                <ComposerPrimitive.Send asChild>
                  <Button type="button" size="icon" aria-label="发送">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </ComposerPrimitive.Send>
              </ThreadPrimitive.If>
              <ThreadPrimitive.If running>
                <ComposerPrimitive.Cancel asChild>
                  <Button type="button" size="icon" variant="secondary" aria-label="停止">
                    <Square className="h-3.5 w-3.5 fill-current" />
                  </Button>
                </ComposerPrimitive.Cancel>
              </ThreadPrimitive.If>
              {showClear && <ClearThreadButton />}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Enter 发送 · Shift+Enter 换行 · 写操作工具需确认后执行
          </p>
        </ComposerPrimitive.Root>
      </div>
    </ThreadPrimitive.Root>
  )
}

function ClearThreadButton() {
  const runtime = useThreadRuntime()
  return (
    <ThreadPrimitive.If empty={false}>
      <ThreadPrimitive.If running={false}>
        <Button
          type="button"
          size="icon"
          variant="outline"
          title="清空对话"
          aria-label="清空对话"
          onClick={() => {
            try {
              runtime.cancelRun()
            } catch {
              /* ignore if idle */
            }
            runtime.reset([])
          }}
        >
          <Eraser className="h-4 w-4" />
        </Button>
      </ThreadPrimitive.If>
    </ThreadPrimitive.If>
  )
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="mb-4 flex justify-end">
      <div className="max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
        <MessagePrimitive.Parts
          components={{
            Text: ({ text }) => (
              <div className="whitespace-pre-wrap break-words">{text}</div>
            ),
          }}
        />
      </div>
    </MessagePrimitive.Root>
  )
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="mb-4 flex justify-start group/msg">
      <div className="max-w-[90%] space-y-2">
        <div className="rounded-lg bg-muted px-3 py-2 text-sm">
          <MessagePrimitive.Parts
            components={{
              Text: MarkdownText,
              tools: { Fallback: ToolFallback },
              Empty: () => (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs">思考中…</span>
                </div>
              ),
            }}
          />
          <MessagePrimitive.Error>
            <div className="mt-2 text-xs text-destructive">生成出错，可点击重试</div>
          </MessagePrimitive.Error>
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/msg:opacity-100 focus-within:opacity-100">
          <ActionBarPrimitive.Root
            hideWhenRunning
            autohide="not-last"
            className="flex items-center gap-1"
          >
            <ActionBarPrimitive.Copy asChild>
              <Button type="button" size="icon" variant="ghost" className="h-7 w-7">
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </ActionBarPrimitive.Copy>
            <ActionBarPrimitive.Reload asChild>
              <Button type="button" size="icon" variant="ghost" className="h-7 w-7">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </ActionBarPrimitive.Reload>
          </ActionBarPrimitive.Root>
        </div>
      </div>
    </MessagePrimitive.Root>
  )
}

function MarkdownText() {
  return (
    <MarkdownTextPrimitive
      className={cn(
        'aui-md prose prose-sm dark:prose-invert max-w-none',
        'prose-p:my-2 prose-pre:my-2 prose-ul:my-2 prose-ol:my-2',
        'break-words [&_pre]:overflow-x-auto'
      )}
    />
  )
}

function EditComposer() {
  return (
    <MessagePrimitive.Root className="mb-4">
      <ComposerPrimitive.Root className="flex flex-col gap-2 rounded-lg border p-2">
        <ComposerPrimitive.Input className="min-h-[60px] w-full resize-none bg-transparent text-sm outline-none" />
        <div className="flex justify-end gap-2">
          <ComposerPrimitive.Cancel asChild>
            <Button type="button" size="sm" variant="ghost">
              取消
            </Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button type="button" size="sm">
              更新
            </Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </MessagePrimitive.Root>
  )
}
