'use client'

import type { ReactNode } from 'react'
import { ArrowLeft, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface DetailWorkspaceProps {
  /** 页眉主标题 */
  title: string
  /** 副标题 / 说明 */
  description?: string
  /** 标题旁小标签 */
  badges?: string[]
  icon?: LucideIcon
  onBack?: () => void
  /** 页眉右侧操作（保存等） */
  actions?: ReactNode
  /** 危险操作（删除），放页眉最左或页脚左 */
  dangerAction?: ReactNode
  children: ReactNode
  className?: string
  /** 表单内容最大宽度 */
  contentClassName?: string
}

/**
 * 中间区详情工作页统一壳：
 * 顶栏标题 + 操作，内容区浅底 + 居中卡片，避免「弹窗拉长」的观感
 */
export function DetailWorkspace({
  title,
  description,
  badges,
  icon: Icon,
  onBack,
  actions,
  dangerAction,
  children,
  className,
  contentClassName,
}: DetailWorkspaceProps) {
  return (
    <div className={cn('flex h-full min-h-0 flex-col bg-background', className)}>
      <header className="shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-start gap-3 px-5 py-4 sm:px-8">
          {onBack && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-0.5 h-9 w-9 shrink-0"
              onClick={onBack}
              title="返回"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {Icon && (
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
              )}
              <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
              {badges?.map((b) => (
                <Badge key={b} variant="secondary" className="font-normal">
                  {b}
                </Badge>
              ))}
            </div>
            {description && (
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {dangerAction}
            {actions}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-muted/25">
        <div className={cn('mx-auto w-full max-w-3xl px-5 py-6 sm:px-8 sm:py-8', contentClassName)}>
          <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-7">{children}</div>
        </div>
      </div>
    </div>
  )
}

/** 表单内分区标题 */
export function DetailSection({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('space-y-4', className)}>
      <div className="border-b pb-2">
        <h2 className="text-sm font-semibold tracking-wide text-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}
