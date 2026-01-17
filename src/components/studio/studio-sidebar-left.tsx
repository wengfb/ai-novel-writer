import * as React from "react"
import {
  Book,
  Box,
  ChevronDown,
  FileText,
  Home,
  LayoutTemplate,
  Library,
  Settings,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function StudioSidebarLeft({ className }: SidebarProps) {
  return (
    <div className={cn("pb-12 h-full flex flex-col", className)}>
      <div className="space-y-4 py-4 flex-1">
        <div className="px-3 py-2">
          <div className="mb-2 px-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">
              AI 小说工坊
            </h2>
            <Button variant="ghost" size="icon" className="h-6 w-6">
               <Settings className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1">
            <Button variant="secondary" className="w-full justify-start">
              <Home className="mr-2 h-4 w-4" />
              工作台
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Book className="mr-2 h-4 w-4" />
              当前项目
            </Button>
          </div>
        </div>
        <Separator className="mx-3 w-auto opacity-50" />
        <div className="px-3 py-2">
          <h3 className="mb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            创作资源
          </h3>
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start">
              <LayoutTemplate className="mr-2 h-4 w-4" />
              剧情大纲
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              章节列表
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              角色设定
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Box className="mr-2 h-4 w-4" />
              世界观
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Library className="mr-2 h-4 w-4" />
              素材库
            </Button>
          </div>
        </div>
        
        <div className="px-3 py-2 mt-auto">
             {/* 未来：项目特定统计或快捷操作 */}
        </div>
      </div>
      
      <div className="px-4 py-4 border-t">
          <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  WF
              </div>
              <div className="text-sm">
                  <p className="font-medium">WengFB</p>
                  <p className="text-xs text-muted-foreground">专业版计划</p>
              </div>
          </div>
      </div>
    </div>
  )
}