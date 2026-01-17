"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  FileText,
  Users,
  Globe,
  Sparkles,
  Settings,
  PenTool,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"

const navItems = [
  {
    title: "项目",
    icon: BookOpen,
    href: "/projects",
  },
  {
    title: "章节编辑",
    icon: PenTool,
    href: "/editor",
  },
  {
    title: "大纲",
    icon: FileText,
    href: "/outlines",
  },
  {
    title: "角色",
    icon: Users,
    href: "/characters",
  },
  {
    title: "世界观",
    icon: Globe,
    href: "/world",
  },
  {
    title: "AI 生成",
    icon: Sparkles,
    href: "/ai-generation",
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border/50 p-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">AI 小说工坊</h2>
            <p className="text-xs text-muted-foreground">智能创作助手</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>创作工具</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname?.startsWith(item.href)}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span>设置</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
