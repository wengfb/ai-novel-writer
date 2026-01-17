"use client"

import * as React from "react"
import { StudioSidebarLeft } from "@/components/studio/studio-sidebar-left"
import { StudioSidebarRight } from "@/components/studio/studio-sidebar-right"
import { cn } from "@/lib/utils"

interface StudioLayoutProps {
  children: React.ReactNode
  defaultLayout?: number[] | undefined
  navCollapsedSize?: number
}

export function StudioLayout({
  children,
}: StudioLayoutProps) {
  // 暂时使用纯 Flex 布局以确保稳定性
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* 左侧边栏：固定宽度 250px */}
      <div className="w-[250px] shrink-0 border-r bg-muted/5 flex flex-col">
        <StudioSidebarLeft />
      </div>

      {/* 中间内容：自适应 */}
      <div className="flex-1 min-w-0 bg-background relative flex flex-col">
        {children}
      </div>

      {/* 右侧边栏：固定宽度 350px */}
      <div className="w-[350px] shrink-0 border-l bg-muted/5 flex flex-col">
        <StudioSidebarRight />
      </div>
    </div>
  )
}