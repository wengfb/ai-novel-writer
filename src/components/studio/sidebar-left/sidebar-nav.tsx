'use client'

import {
  Book, Box, FileText, Home, LayoutTemplate, Lightbulb, Pencil, Settings, Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { Project } from '@/types'

interface SidebarNavProps {
  currentProject: Project | null
  activeSection: string
  onGoHome: () => void
  onOpenEditProject: () => void
  onOpenSettings: () => void
  onOpenIdeaCenter: () => void
  onSelectSection: (section: string, mainView: 'editor' | 'outline') => void
}

/** 左侧栏导航：项目标题、工作台、创作资源入口 */
export function SidebarNav({
  currentProject,
  activeSection,
  onGoHome,
  onOpenEditProject,
  onOpenSettings,
  onOpenIdeaCenter,
  onSelectSection,
}: SidebarNavProps) {
  return (
    <>
      <div className="px-3 py-2">
        <div className="mb-2 px-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight truncate flex-1">
            {currentProject?.title || 'AI 小说工坊'}
          </h2>
          {currentProject && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={onOpenEditProject}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={onOpenSettings}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-1">
          <Button variant="secondary" className="w-full justify-start" onClick={onGoHome}>
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
          <Button variant="ghost" className="w-full justify-start" onClick={onOpenIdeaCenter}>
            <Lightbulb className="mr-2 h-4 w-4" />
            创意中心
          </Button>
          <Button
            variant={activeSection === 'outline' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onSelectSection('outline', 'outline')}
          >
            <LayoutTemplate className="mr-2 h-4 w-4" />
            剧情大纲
          </Button>
          <Button
            variant={activeSection === 'chapters' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onSelectSection('chapters', 'editor')}
          >
            <FileText className="mr-2 h-4 w-4" />
            章节列表
          </Button>
          <Button
            variant={activeSection === 'characters' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onSelectSection('characters', 'editor')}
          >
            <Users className="mr-2 h-4 w-4" />
            角色设定
          </Button>
          <Button
            variant={activeSection === 'world' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onSelectSection('world', 'editor')}
          >
            <Box className="mr-2 h-4 w-4" />
            世界观
          </Button>
        </div>
      </div>
    </>
  )
}
