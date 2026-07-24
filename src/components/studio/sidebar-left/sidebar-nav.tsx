'use client'

import {
  BookOpen,
  Box,
  ChevronDown,
  FileText,
  LayoutTemplate,
  Pencil,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type { Project } from '@/types'
import type { BookSection, MainView } from '@/lib/store/ui-store'
import type { ReactNode } from 'react'

interface SidebarNavProps {
  currentProject: Project | null
  bookSection: BookSection | null
  mainView: MainView
  onOpenEditProject: () => void
  onSelectSection: (section: BookSection) => void
  /** 各分区在菜单项下展开的列表内容 */
  sectionContent: Record<BookSection, ReactNode>
}

const SECTIONS: { id: BookSection; label: string; icon: typeof FileText }[] = [
  { id: 'chapters', label: '章节列表', icon: FileText },
  { id: 'outline', label: '剧情大纲', icon: LayoutTemplate },
  { id: 'characters', label: '角色设定', icon: Users },
  { id: 'world', label: '世界观', icon: Box },
]

/**
 * 左侧：项目标题 + 本书分区手风琴
 * 点击菜单项切换中间视图，并在该项下方展开对应列表
 */
export function SidebarNav({
  currentProject,
  bookSection,
  mainView,
  onOpenEditProject,
  onSelectSection,
  sectionContent,
}: SidebarNavProps) {
  const isWritingView =
    mainView === 'editor' ||
    mainView === 'outline' ||
    mainView === 'characters' ||
    mainView === 'world'

  return (
    <>
      <div className="px-3 py-2">
        <div className="mb-1 flex items-center justify-between gap-1 px-2">
          <h2 className="flex-1 truncate text-base font-semibold tracking-tight">
            {currentProject?.title || 'AI 小说工坊'}
          </h2>
          {currentProject && (
            <Button
              variant={mainView === 'project' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={onOpenEditProject}
              title="编辑项目"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        {currentProject?.genre && (
          <p className="truncate px-2 text-xs text-muted-foreground">{currentProject.genre}</p>
        )}
      </div>

      <Separator className="mx-3 w-auto opacity-50" />

      {currentProject ? (
        <div className="flex min-h-0 flex-1 flex-col px-3 py-2">
          <h3 className="mb-2 shrink-0 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            本书
          </h3>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            {SECTIONS.map(({ id, label, icon: Icon }) => {
              const open = isWritingView && bookSection === id
              return (
                <Collapsible
                  key={id}
                  open={open}
                  onOpenChange={() => {
                    // 统一走 store：展开其它项 / 再次点击收起
                    onSelectSection(id)
                  }}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant={open ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                    >
                      <Icon className="mr-2 h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left">{label}</span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                          open && 'rotate-180'
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-none">
                    {open && (
                      <div className="mt-1 h-[min(50vh,360px)] overflow-hidden rounded-md border border-border/60 bg-muted/20">
                        {sectionContent[id]}
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="px-3 py-2">
          <div className="rounded-md border border-dashed px-3 py-6 text-center">
            <BookOpen className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">选择项目后可管理章节、大纲与设定</p>
          </div>
        </div>
      )}
    </>
  )
}
