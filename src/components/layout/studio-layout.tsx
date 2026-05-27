"use client"

import * as React from "react"
import { useDefaultLayout, type Layout, type LayoutStorage } from "react-resizable-panels"
import { StudioSidebarLeft } from "@/components/studio/studio-sidebar-left"
import { StudioSidebarRight } from "@/components/studio/studio-sidebar-right"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"

const DEFAULT_LAYOUT: Layout = { left: 18, center: 59, right: 23 }

// SSR 环境下 localStorage 被 polyfill 但方法不可调用，做安全包装
const safeStorage: LayoutStorage = {
  getItem: (key) => {
    try { return localStorage.getItem(key) } catch { return null }
  },
  setItem: (key, value) => {
    try { localStorage.setItem(key, value) } catch { /* noop */ }
  },
}

function setLayoutCookie(layout: Layout) {
  if (typeof document === "undefined") return
  try {
    document.cookie = `react-resizable-panels:studio-layout=${encodeURIComponent(JSON.stringify(layout))}; path=/; max-age=31536000; SameSite=Lax`
  } catch { /* Cookie 不可用 */ }
}

interface StudioLayoutClientProps {
  children: React.ReactNode
  /** 服务端从 Cookie 读取的布局，SSR 首帧即为正确尺寸 */
  defaultLayout?: Layout
}

export function StudioLayoutClient({ children, defaultLayout }: StudioLayoutClientProps) {
  const { defaultLayout: savedLayout, onLayoutChanged } = useDefaultLayout({
    id: "studio-layout",
    storage: safeStorage,
  })

  const handleLayoutChanged = React.useCallback(
    (layout: Layout) => {
      onLayoutChanged(layout)
      setLayoutCookie(layout)
    },
    [onLayoutChanged],
  )

  return (
    <ResizablePanelGroup
      direction="horizontal"
      defaultLayout={defaultLayout || savedLayout || DEFAULT_LAYOUT}
      onLayoutChanged={handleLayoutChanged}
      className="h-screen w-screen overflow-hidden bg-background"
    >
      <ResizablePanel id="left" minSize="250px">
        <div className="h-full border-r bg-muted/5 flex flex-col">
          <StudioSidebarLeft />
        </div>
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel id="center" minSize="300px">
        <div className="h-full min-w-0 bg-background relative flex flex-col">
          {children}
        </div>
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel id="right" minSize="350px">
        <div className="h-full border-l bg-muted/5 flex flex-col">
          <StudioSidebarRight />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}