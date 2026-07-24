'use client'

import * as React from 'react'
import { Sparkles, Bot } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AIChat } from '@/components/ai/ai-chat'
import { ContextPanel } from '@/components/ai/context-panel'
import { useCurrentProject } from '@/hooks/use-projects'
import { useChapterStore } from '@/lib/store/chapter-store'
import { useUIStore } from '@/lib/store/ui-store'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function StudioSidebarRight({ className }: SidebarProps) {
  const { currentProject } = useCurrentProject()
  const { currentChapter } = useChapterStore()
  const { openOutlineGenerate, openEditor, setGenerateChapterPanelOpen } = useUIStore()

  return (
    <div className={cn('h-full flex flex-col border-l bg-muted/10 min-w-0', className)}>
      <Tabs defaultValue="chat" className="flex-1 flex flex-col h-full min-w-0">
        <div className="px-4 py-2 border-b flex items-center justify-between gap-2 min-w-0">
          <span className="font-semibold text-sm flex items-center gap-2 truncate min-w-0">
            <Bot className="h-4 w-4 text-primary shrink-0" />
            AI 副驾驶
          </span>
          <TabsList className="h-8 shrink-0">
            <TabsTrigger value="chat" className="text-xs h-6 px-2">
              对话
            </TabsTrigger>
            <TabsTrigger value="context" className="text-xs h-6 px-2">
              上下文
            </TabsTrigger>
            <TabsTrigger value="generate" className="text-xs h-6 px-2">
              一键生成
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="chat"
          className="flex-1 flex flex-col m-0 overflow-hidden data-[state=active]:flex"
        >
          {currentProject ? (
            <AIChat projectId={currentProject.id} chapterId={currentChapter?.id} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>请先选择项目</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="context" className="flex-1 m-0 overflow-hidden">
          <ContextPanel />
        </TabsContent>

        <TabsContent value="generate" className="flex-1 p-4 m-0 overflow-auto">
          <div className="grid gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 justify-start flex-col items-start gap-1"
              onClick={() => {
                if (!currentProject) return
                openOutlineGenerate()
              }}
              disabled={!currentProject}
            >
              <span className="font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                生成大纲
              </span>
              <span className="text-xs text-muted-foreground font-normal text-left">
                在中间大纲视图中打开生成面板
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 justify-start flex-col items-start gap-1"
              onClick={() => {
                if (!currentProject) return
                openEditor()
                setGenerateChapterPanelOpen(true)
              }}
              disabled={!currentProject}
            >
              <span className="font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                生成章节
              </span>
              <span className="text-xs text-muted-foreground font-normal text-left">
                在编辑器上方打开章节生成面板
              </span>
            </Button>
            <p className="text-xs text-muted-foreground px-1">
              角色与世界观请在左侧「本书」列表中管理。
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
