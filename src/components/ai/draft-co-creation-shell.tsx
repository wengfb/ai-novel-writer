'use client'

/**
 * 草稿共创壳：左（可选导航）+ 中对话 + 右草稿面板。
 * Idea / Onboarding / 大纲新建 共用布局，业务差异通过 slot 注入。
 */

import type { ReactNode } from 'react'
import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DraftCoCreationShellProps {
  leftRail?: ReactNode
  chatHeader?: ReactNode
  /** 中间主区，通常是 UnifiedChat，也可是跳过态等 */
  chat: ReactNode
  draftPanel: ReactNode
  className?: string
}

/** 草稿共创三栏壳：左导航/说明 + 中对话 + 右草稿。 */
export function DraftCoCreationShell({
  leftRail,
  chatHeader,
  chat,
  draftPanel,
  className,
}: DraftCoCreationShellProps) {
  return (
    <div className={cn('flex h-full min-h-0 max-h-full overflow-hidden', className)}>
      {leftRail}
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-r">
          {chatHeader}
          <div className="min-h-0 flex-1 overflow-hidden">{chat}</div>
        </section>
        {draftPanel}
      </div>
    </div>
  )
}

export interface DraftPanelFrameProps {
  title: string
  description?: string
  children: ReactNode
  empty?: ReactNode
  footer?: ReactNode
  className?: string
}

/** 右侧草稿面板的通用外框（标题 / 内容 / 底栏）。 */
export function DraftPanelFrame({
  title,
  description,
  children,
  empty,
  footer,
  className,
}: DraftPanelFrameProps) {
  return (
    <aside
      className={cn(
        'flex w-[320px] min-h-0 shrink-0 flex-col overflow-hidden bg-muted/10',
        className
      )}
    >
      <header className="shrink-0 border-b px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MessageCircle className="h-4 w-4" />
          <span>{title}</span>
        </div>
        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">{empty ?? children}</div>

      {footer ? <div className="shrink-0 space-y-2 border-t p-3">{footer}</div> : null}
    </aside>
  )
}

/** 只读草稿字段行。 */
export function DraftField({
  label,
  value,
  multiline = false,
}: {
  label: string
  value: string
  multiline?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={multiline ? 'mt-1 whitespace-pre-wrap text-sm leading-6' : 'mt-1 text-sm'}>
        {value || '等待补充'}
      </p>
    </div>
  )
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * 解析草稿工具结果。约定：`{ ok, draft }` 或 `{ ok, data }`。
 * @returns 匹配时的 payload，否则 null
 */
export function pickDraftToolPayload(
  toolName: string,
  expectedTool: string,
  result: unknown,
  payloadKey: 'draft' | 'data' = 'draft'
): Record<string, unknown> | null {
  if (toolName !== expectedTool || !isRecord(result)) return null
  const payload = result[payloadKey]
  if (!isRecord(payload)) return null
  return payload
}
