'use client'

import * as React from 'react'
import { FolderOpen, MoreHorizontal, PanelRightClose, Pencil, Save, Settings, Sparkles, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useChapterStore } from '@/lib/store/chapter-store'
import { useProjectStore } from '@/lib/store/project-store'
import { useUIStore } from '@/lib/store/ui-store'
import { useOutlines } from '@/hooks/use-outlines'
import { AIContinueButton } from '@/components/ai/ai-continue-button'
import { ProjectSelector } from '@/components/project/project-selector'
import { toast } from 'sonner'

interface StudioHeaderProps {
  onboardingMode?: boolean
  onCancelOnboarding?: () => void
}

export function StudioHeader({ onboardingMode = false, onCancelOnboarding }: StudioHeaderProps) {
  const { currentChapter, updateChapterContent, saveChapter, isSaving, lastSaved } = useChapterStore()
  const { currentProject, setCurrentProject } = useProjectStore()
  const {
    setMainView,
    startOnboarding,
    setGenerateChapterPanelOpen,
    generateChapterPanelOpen,
    openEditor,
    rightSidebarCollapsed,
    toggleRightSidebar,
  } = useUIStore()
  const { flatOutlines } = useOutlines(currentProject?.id || '')
  const [accumulatedContent, setAccumulatedContent] = React.useState('')
  const [baseContent, setBaseContent] = React.useState('')

  const handleSave = async () => {
    if (!currentChapter) {
      toast.error('请先选择章节')
      return
    }

    try {
      await saveChapter(currentChapter.id)
      toast.success('保存成功')
    } catch {
      toast.error('保存失败，请重试')
    }
  }

  const handleAIContentGenerated = (chunk: string) => {
    if (currentChapter) {
      setBaseContent((prev) => prev || (currentChapter.content || ''))
      setAccumulatedContent((prev) => prev + chunk)
    }
  }

  React.useEffect(() => {
    if (currentChapter && accumulatedContent && baseContent) {
      updateChapterContent(currentChapter.id, baseContent + accumulatedContent)
    }
  }, [accumulatedContent, baseContent, currentChapter, updateChapterContent])

  React.useEffect(() => {
    setAccumulatedContent('')
    setBaseContent('')
  }, [currentChapter?.id])

  const handleNewProject = () => {
    startOnboarding({ mode: 'new' })
  }

  const handleGenerateChapter = () => {
    if (!currentProject) {
      toast.error('请先选择项目')
      return
    }
    openEditor()
    setGenerateChapterPanelOpen(!generateChapterPanelOpen)
  }

  const handleGoAllProjects = () => {
    setCurrentProject(null)
    setMainView('projects')
  }

  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <ProjectSelector onNewProject={handleNewProject} />
          <Separator orientation="vertical" className="h-6" />
          <div className="text-sm text-muted-foreground">
            {onboardingMode ? '新建项目 · 选择开书方式' : currentChapter ? `第 ${currentChapter.chapterNumber} 章：${currentChapter.title}` : '未选择章节'}
          </div>
        </div>

        {onboardingMode ? (
          <Button size="sm" variant="ghost" className="ml-auto h-8" onClick={onCancelOnboarding}>
            <X className="mr-2 h-3.5 w-3.5" />取消创建
          </Button>
        ) : (
        <div className="ml-auto flex items-center gap-2">
          <div className="mr-2 text-xs text-muted-foreground">
            {isSaving
              ? '保存中...'
              : lastSaved
                ? `已保存 ${new Date(lastSaved).toLocaleTimeString()}`
                : '未保存'}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={handleSave}
            disabled={isSaving || !currentChapter}
          >
            <Save className="mr-2 h-3.5 w-3.5" />
            {isSaving ? '保存中...' : '保存'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={toggleRightSidebar}
            title={rightSidebarCollapsed ? '退出专注写作模式' : '进入专注写作模式'}
          >
            <PanelRightClose className="mr-2 h-3.5 w-3.5" />
            {rightSidebarCollapsed ? '显示助手' : '专注写作'}
          </Button>
          <Button
            size="sm"
            variant={generateChapterPanelOpen ? 'secondary' : 'outline'}
            className="h-8"
            onClick={handleGenerateChapter}
            disabled={!currentProject}
          >
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            AI生成章节
          </Button>
          <AIContinueButton
            onContentGenerated={handleAIContentGenerated}
            defaultTargetWords={
              flatOutlines.find(
                (o) => o.type === 'chapter' && o.order === currentChapter?.chapterNumber
              )?.targetWords ?? undefined
            }
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="更多">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                disabled={!currentProject}
                onClick={() => setMainView('project')}
              >
                <Pencil className="mr-2 h-4 w-4" />
                编辑项目
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMainView('settings')}>
                <Settings className="mr-2 h-4 w-4" />
                系统设置
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleGoAllProjects}>
                <FolderOpen className="mr-2 h-4 w-4" />
                全部项目
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        )}
      </header>
    </>
  )
}
