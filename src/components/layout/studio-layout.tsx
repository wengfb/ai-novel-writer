"use client"

import * as React from "react"
import { useDefaultLayout, type Layout, type LayoutStorage, type PanelImperativeHandle } from "react-resizable-panels"
import { StudioSidebarLeft } from "@/components/studio/studio-sidebar-left"
import { StudioSidebarRight } from "@/components/studio/studio-sidebar-right"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { useUIStore } from "@/lib/store/ui-store"
import { Button } from "@/components/ui/button"
import { PanelRightOpen } from "lucide-react"

const DEFAULT_LAYOUT: Layout = { left: 18, center: 59, right: 23 }

const safeStorage: LayoutStorage = {
  getItem: (key) => { try { return localStorage.getItem(key) } catch { return null } },
  setItem: (key, value) => { try { localStorage.setItem(key, value) } catch { /* noop */ } },
}

function setLayoutCookie(layout: Layout) {
  if (typeof document === "undefined") return
  try { document.cookie = `react-resizable-panels:studio-layout=${encodeURIComponent(JSON.stringify(layout))}; path=/; max-age=31536000; SameSite=Lax` } catch { /* Cookie 不可用 */ }
}

interface StudioLayoutClientProps {
  children: React.ReactNode
  defaultLayout?: Layout
  showRightSidebar?: boolean
}

function isThreeColumnLayout(layout: Layout | undefined): layout is Layout {
  return Boolean(layout && typeof layout.left === 'number' && typeof layout.center === 'number' && typeof layout.right === 'number')
}

/** 正常 Studio 三栏工作区；项目创建向导在中栏启用开书模式。 */
export function StudioLayoutClient({ children, defaultLayout, showRightSidebar = true }: StudioLayoutClientProps) {
  const { rightSidebarCollapsed, toggleRightSidebar } = useUIStore()
  const [isCompact, setIsCompact] = React.useState(false)
  const rightPanelRef = React.useRef<PanelImperativeHandle>(null)
  const { defaultLayout: savedLayout, onLayoutChanged } = useDefaultLayout({ id: "studio-layout", storage: safeStorage })

  const handleLayoutChanged = React.useCallback((layout: Layout) => {
    onLayoutChanged(layout)
    setLayoutCookie(layout)
  }, [onLayoutChanged])

  React.useEffect(() => {
    const media = window.matchMedia('(max-width: 1279px)')
    const updateCompactState = () => setIsCompact(media.matches)
    updateCompactState()
    media.addEventListener('change', updateCompactState)
    return () => media.removeEventListener('change', updateCompactState)
  }, [])

  React.useEffect(() => {
    if (!rightPanelRef.current) return
    if (rightSidebarCollapsed || isCompact) rightPanelRef.current.collapse()
    else rightPanelRef.current.expand()
  }, [isCompact, rightSidebarCollapsed])

  const studioLayout = isThreeColumnLayout(defaultLayout)
    ? defaultLayout
    : isThreeColumnLayout(savedLayout)
      ? savedLayout
      : DEFAULT_LAYOUT
  const shouldShowRightSidebar = showRightSidebar && !isCompact
  const layout = shouldShowRightSidebar
    ? studioLayout
    : { left: studioLayout.left, center: 100 - studioLayout.left }

  return (
    <ResizablePanelGroup direction="horizontal" defaultLayout={layout} onLayoutChanged={shouldShowRightSidebar ? handleLayoutChanged : undefined} className="h-screen w-screen overflow-hidden bg-background">
      <ResizablePanel id="left" minSize="250px">
        <div className="relative z-0 flex h-full min-w-0 flex-col overflow-hidden border-r bg-muted/5">
          <StudioSidebarLeft />
        </div>
      </ResizablePanel>
      <ResizableHandle className="z-[1]" />
      <ResizablePanel id="center" minSize="300px">
        {/* overflow-hidden 防止中栏滚动条/header 叠到右栏，挡住协作/发送点击 */}
        <div className="relative z-0 flex h-full min-w-0 flex-col overflow-hidden bg-background transition-[width] duration-200">
          {children}
        </div>
      </ResizablePanel>
      {shouldShowRightSidebar ? (
        <>
          <ResizableHandle className="z-[1]" />
          <ResizablePanel id="right" minSize="350px" collapsible collapsedSize="0px" panelRef={rightPanelRef}>
            <div className="relative z-[2] flex h-full min-w-0 flex-col overflow-hidden border-l bg-muted/5">
              <StudioSidebarRight />
            </div>
          </ResizablePanel>
        </>
      ) : null}
      {showRightSidebar && rightSidebarCollapsed && !isCompact ? (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute right-3 top-16 z-20 h-8 w-8 shadow-md"
          aria-label="展开创作助手"
          title="展开创作助手"
          onClick={toggleRightSidebar}
        >
          <PanelRightOpen className="h-4 w-4" />
        </Button>
      ) : null}
    </ResizablePanelGroup>
  )
}
