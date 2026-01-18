'use client'

import * as React from "react"
import { Sparkles, Database, Bot, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AIChat } from "@/components/ai/ai-chat"
import { ContextPanel } from "@/components/ai/context-panel"
import { useCurrentProject } from "@/hooks/use-projects"
import { useChapterStore } from "@/lib/store/chapter-store"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function StudioSidebarRight({ className }: SidebarProps) {
  const { currentProject } = useCurrentProject()
  const { currentChapter } = useChapterStore()
  return (
    <div className={cn("h-full flex flex-col border-l bg-muted/10", className)}>
      <Tabs defaultValue="chat" className="flex-1 flex flex-col h-full">
        <div className="px-4 py-2 border-b flex items-center justify-between">
            <span className="font-semibold text-sm flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                AI 副驾驶
            </span>
            <TabsList className="h-8">
              <TabsTrigger value="chat" className="text-xs h-6 px-2">对话</TabsTrigger>
              <TabsTrigger value="context" className="text-xs h-6 px-2">上下文</TabsTrigger>
              <TabsTrigger value="generate" className="text-xs h-6 px-2">工具箱</TabsTrigger>
            </TabsList>
        </div>

        <TabsContent value="chat" className="flex-1 flex flex-col m-0 overflow-hidden data-[state=active]:flex">
          {currentProject ? (
            <AIChat
              projectId={currentProject.id}
              chapterId={currentChapter?.id}
            />
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
                <Button variant="outline" className="h-auto py-4 justify-start flex-col items-start gap-1">
                    <span className="font-medium flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        生成大纲
                    </span>
                    <span className="text-xs text-muted-foreground font-normal text-left">
                        根据你的故事简介创建一个结构化的章节大纲。
                    </span>
                </Button>
                
                <Button variant="outline" className="h-auto py-4 justify-start flex-col items-start gap-1">
                     <span className="font-medium flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        创建角色
                    </span>
                    <span className="text-xs text-muted-foreground font-normal text-left">
                        生成包含性格和背景故事的详细角色档案。
                    </span>
                </Button>
                
                 <Button variant="outline" className="h-auto py-4 justify-start flex-col items-start gap-1">
                     <span className="font-medium flex items-center gap-2">
                        <Database className="h-4 w-4 text-orange-500" />
                        世界观构建
                    </span>
                    <span className="text-xs text-muted-foreground font-normal text-left">
                         充实地点、道具或能力体系的设定。
                    </span>
                </Button>
             </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
