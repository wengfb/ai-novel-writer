'use client'

import * as React from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ContextPanel } from '@/components/ai/context-panel'
import { AgentWorkspace } from '@/components/ai/agent-workspace'
import { useCurrentProject } from '@/hooks/use-projects'
import { useUIStore } from '@/lib/store/ui-store'

type SidebarProps = React.HTMLAttributes<HTMLDivElement>

/** Studio 右侧统一创作助手：对话按当前资产切换专业 Agent。 */
export function StudioSidebarRight({ className }: SidebarProps) {
  const { currentProject } = useCurrentProject()
  const { activeTab, setActiveTab, openEditor, setGenerateChapterPanelOpen } = useUIStore()

  return (
    <div className={cn('relative z-[1] flex h-full min-w-0 flex-col overflow-hidden border-l bg-muted/10', className)}>
      <div className="relative z-10 flex shrink-0 gap-1 border-b bg-background/95 px-3 py-2">
        {(['chat', 'context', 'generate'] as const).map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'chat' ? '协作' : tab === 'context' ? '上下文' : '生成'}
          </Button>
        ))}
      </div>

      {activeTab === 'chat' ? (
        <div className="relative z-0 min-h-0 flex-1 overflow-hidden">
          <AgentWorkspace />
        </div>
      ) : null}
      {activeTab === 'context' ? <div className="min-h-0 flex-1 overflow-hidden"><ContextPanel /></div> : null}
      {activeTab === 'generate' ? (
        <div className="grid gap-3 overflow-auto p-4">
          <Button
            variant="outline"
            className="h-auto items-start justify-start py-4 text-left"
            onClick={() => {
              openEditor()
              setGenerateChapterPanelOpen(true)
            }}
            disabled={!currentProject}
          >
            <Sparkles className="mr-2 mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              <span className="block font-medium">生成章节</span>
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                在编辑器上方打开章节生成面板
              </span>
            </span>
          </Button>
          <p className="px-1 text-xs text-muted-foreground">
            大纲规划请在「剧情大纲」工作台中进行；也可以在「协作」页直接描述任务。
          </p>
        </div>
      ) : null}
    </div>
  )
}
