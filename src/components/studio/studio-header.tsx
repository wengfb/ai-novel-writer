import * as React from "react"
import { ArrowLeft, MoreHorizontal, Play, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"

export function StudioHeader() {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2">
         <Button variant="ghost" size="icon" className="h-8 w-8">
             <ArrowLeft className="h-4 w-4" />
         </Button>
         <Separator orientation="vertical" className="h-6" />
         <div className="flex flex-col">
             <span className="text-sm font-semibold">项目：赛博之城 2077</span>
             <span className="text-xs text-muted-foreground">第三章：觉醒</span>
         </div>
      </div>
      
      <div className="ml-auto flex items-center gap-2">
         <div className="text-xs text-muted-foreground mr-2">
             已保存
         </div>
         <Button size="sm" variant="outline" className="h-8">
             <Save className="mr-2 h-3.5 w-3.5" />
             保存
         </Button>
         <Button size="sm" className="h-8">
             <Play className="mr-2 h-3.5 w-3.5" />
             AI 续写
         </Button>
         <Button variant="ghost" size="icon" className="h-8 w-8">
             <MoreHorizontal className="h-4 w-4" />
         </Button>
      </div>
    </header>
  )
}