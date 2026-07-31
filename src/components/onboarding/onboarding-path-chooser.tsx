'use client'

/**
 * 新建项目 Step 0：选择开书路径。
 */

import { FilePenLine, Lightbulb, MessageSquarePlus, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type NewProjectPath = 'co-create' | 'pick-idea' | 'manual'

interface PathOption {
  id: NewProjectPath
  title: string
  description: string
  icon: LucideIcon
  recommended?: boolean
}

const OPTIONS: PathOption[] = [
  {
    id: 'co-create',
    title: '和 AI 一起想创意',
    description: '从零聊出一张可开书的创意卡，再进入项目初始化。',
    icon: MessageSquarePlus,
    recommended: true,
  },
  {
    id: 'pick-idea',
    title: '用已有创意',
    description: '打开创意中心，选一张卡后在详情页点「创建项目」。',
    icon: Lightbulb,
  },
  {
    id: 'manual',
    title: '直接创建空项目',
    description: '只填书名和题材，稍后再补设定与大纲。',
    icon: FilePenLine,
  },
]

interface OnboardingPathChooserProps {
  onSelect: (path: NewProjectPath) => void
  className?: string
}

/** 新建项目路径选择。 */
export function OnboardingPathChooser({ onSelect, className }: OnboardingPathChooserProps) {
  return (
    <div className={cn('flex h-full min-h-0 flex-col overflow-y-auto', className)}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10 sm:py-14">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">你想怎么开书？</h2>
          <p className="text-sm text-muted-foreground">
            先选一条路径。创意共创不是唯一入口，也可以用已有创意或直接建空项目。
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-1">
          {OPTIONS.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelect(option.id)}
                className={cn(
                  'group flex w-full items-start gap-4 rounded-xl border bg-card p-5 text-left transition-colors',
                  'hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                )}
              >
                <div className="rounded-lg bg-primary/10 p-2.5 text-primary transition-colors group-hover:bg-primary/15">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{option.title}</span>
                    {option.recommended ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        推荐
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{option.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
