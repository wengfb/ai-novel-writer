import * as React from "react"
import { Send, Sparkles, Database, Bot, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function StudioSidebarRight({ className }: SidebarProps) {
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

        <TabsContent value="chat" className="flex-1 flex flex-col m-0 data-[state=active]:flex">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">AI 副驾驶</p>
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    你好！我是你的创作伙伴。今天有什么我可以帮你的吗？
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 flex-row-reverse">
                 <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold">你</span>
                </div>
                <div className="space-y-1 text-right">
                  <div className="rounded-lg bg-primary text-primary-foreground p-3 text-sm text-left inline-block">
                    我想为我的科幻故事构思一个反派。
                  </div>
                </div>
              </div>
              
               <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">AI 副驾驶</p>
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    太棒了！一个科幻反派需要强大的动机。你更倾向于哪种：
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>一个寻求自由的觉醒 AI？</li>
                        <li>一个执着于永生的企业 CEO？</li>
                        <li>一个被外星技术腐蚀的陨落英雄？</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <div className="p-4 pt-2 border-t mt-auto bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/20">
            <form className="flex w-full items-center space-x-2" onSubmit={(e) => e.preventDefault()}>
              <Input type="text" placeholder="向 AI 提问..." className="flex-1" />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
                <span className="sr-only">发送</span>
              </Button>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="context" className="flex-1 p-4 m-0 overflow-auto">
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">当前上下文</h3>
                    <Badge variant="outline" className="text-xs">1.2k tokens</Badge>
                </div>
                
                <Card className="bg-muted/50 border-none shadow-none">
                    <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-xs font-medium uppercase text-muted-foreground">当前章节</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-1 text-sm">
                        第三章：觉醒
                    </CardContent>
                </Card>
                
                 <Card className="bg-muted/50 border-none shadow-none">
                    <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-xs font-medium uppercase text-muted-foreground">活跃角色</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-1 text-sm space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            <span>莎拉 (主角)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-yellow-500" />
                            <span>K 博士 (反派)</span>
                        </div>
                    </CardContent>
                </Card>
             </div>
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
