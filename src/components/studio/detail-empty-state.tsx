'use client'

import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DetailEmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actions?: ReactNode
  className?: string
}

/** 资源详情未选中时的中间区空态 */
export function DetailEmptyState({
  icon: Icon,
  title,
  description,
  actions,
  className,
}: DetailEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex h-full flex-col items-center justify-center bg-muted/20 px-6 py-12',
        className
      )}
    >
      <div className="flex max-w-md flex-col items-center rounded-2xl border bg-card px-8 py-10 text-center shadow-sm">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        {actions && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  )
}
