'use client'

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
import { useProjects, useCurrentProject } from "@/hooks/use-projects"
import { ChapterList } from "@/components/chapter/chapter-list"
import { useChapterStore } from "@/lib/store/chapter-store"
import { toast } from "sonner"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function StudioSidebarLeft({ className }: SidebarProps) {
  const { projects, isLoading } = useProjects()
  const { currentProject, setCurrentProject } = useCurrentProject()
  const { createChapter } = useChapterStore()
  const [activeSection, setActiveSection] = React.useState<string>('chapters')

  // 自动选择第一个项目
  React.useEffect(() => {
    if (!currentProject && projects.length > 0 && !isLoading) {
      setCurrentProject(projects[0])
    }
  }, [projects, currentProject, isLoading, setCurrentProject])

  // 创建新章节
  const handleCreateChapter = async () => {
    if (!currentProject) {
      toast.error('请先选择项目')
      return
    }

    try {
      // 计算下一个章节号
      const { chapters } = useChapterStore.getState()
      const nextChapterNumber = chapters.length > 0
        ? Math.max(...chapters.map(c => c.chapterNumber)) + 1
        : 1

      const newChapter = await createChapter({
        projectId: currentProject.id,
        chapterNumber: nextChapterNumber,
        title: '新章节',
        content: '<p>开始你的创作...</p>',
      })
      toast.success('章节创建成功')
    } catch (error) {
      toast.error('创建章节失败')
    }
  }

  return (
    <div className={cn("pb-12 h-full flex flex-col", className)}>
      <div className="space-y-4 py-4 flex-1 flex flex-col">
        <div className="px-3 py-2">
          <div className="mb-2 px-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">
              {currentProject?.title || 'AI 小说工坊'}
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
            {currentProject && (
              <Button variant="ghost" className="w-full justify-start">
                <Book className="mr-2 h-4 w-4" />
                {currentProject.genre}
              </Button>
            )}
          </div>
        </div>
        <Separator className="mx-3 w-auto opacity-50" />
        <div className="px-3 py-2">
          <h3 className="mb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            创作资源
          </h3>
          <div className="space-y-1">
            <Button
              variant={activeSection === 'outline' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveSection('outline')}
            >
              <LayoutTemplate className="mr-2 h-4 w-4" />
              剧情大纲
            </Button>
            <Button
              variant={activeSection === 'chapters' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveSection('chapters')}
            >
              <FileText className="mr-2 h-4 w-4" />
              章节列表
            </Button>
            <Button
              variant={activeSection === 'characters' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveSection('characters')}
            >
              <Users className="mr-2 h-4 w-4" />
              角色设定
            </Button>
            <Button
              variant={activeSection === 'world' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveSection('world')}
            >
              <Box className="mr-2 h-4 w-4" />
              世界观
            </Button>
          </div>
        </div>

        <Separator className="mx-3 w-auto opacity-50" />

        {/* 动态内容区域 */}
        <div className="flex-1 overflow-hidden">
          {currentProject && activeSection === 'chapters' && (
            <ChapterList projectId={currentProject.id} onCreateChapter={handleCreateChapter} />
          )}
          {activeSection === 'outline' && (
            <div className="px-4 py-2 text-sm text-muted-foreground">
              大纲功能开发中...
            </div>
          )}
          {activeSection === 'characters' && (
            <div className="px-4 py-2 text-sm text-muted-foreground">
              角色管理功能开发中...
            </div>
          )}
          {activeSection === 'world' && (
            <div className="px-4 py-2 text-sm text-muted-foreground">
              世界观管理功能开发中...
            </div>
          )}
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