'use client'

import * as React from "react"
import { MoreHorizontal, Save, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useChapterStore } from "@/lib/store/chapter-store"
import { AIGenerateChapterDialog } from "@/components/ai/ai-generate-chapter-dialog"
import { useProjectStore } from "@/lib/store/project-store"
import { useOutlines } from "@/hooks/use-outlines"
import { AIContinueButton } from "@/components/ai/ai-continue-button"
import { ProjectSelector } from "@/components/project/project-selector"
import { ProjectOnboardingDialog } from "@/components/onboarding/project-onboarding-dialog"
import { ProjectCreateDialog } from "@/components/project/project-create-dialog"
import { toast } from "sonner"

export function StudioHeader() {
  const { currentChapter, chapters, updateChapterContent, saveChapter, isSaving, lastSaved } = useChapterStore()
  const { currentProject, setCurrentProject } = useProjectStore()
  const { flatOutlines } = useOutlines(currentProject?.id || '')
  const [accumulatedContent, setAccumulatedContent] = React.useState('')
  const [baseContent, setBaseContent] = React.useState('') // 保存开始续写时的原始内容
  const [isOnboardingOpen, setIsOnboardingOpen] = React.useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = React.useState(false)

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
      // 第一次收到 chunk 时，保存原始内容
      setBaseContent(prev => prev || (currentChapter.content || ''))
      setAccumulatedContent(prev => prev + chunk)
    }
  }

  // 当累积内容变化时，基于原始内容 + 累积内容来更新章节内容
  React.useEffect(() => {
    if (currentChapter && accumulatedContent && baseContent) {
      updateChapterContent(currentChapter.id, baseContent + accumulatedContent)
    }
  }, [accumulatedContent, baseContent, currentChapter, updateChapterContent])

  // 重置累积内容和原始内容
  React.useEffect(() => {
    setAccumulatedContent('')
    setBaseContent('')
  }, [currentChapter?.id])

  const handleNewProject = () => {
    setIsOnboardingOpen(true)
  }

  const handleSwitchToManual = () => {
    setIsOnboardingOpen(false)
    setTimeout(() => setIsCreateDialogOpen(true), 100)
  }

  const handleOnboardingComplete = async (projectId: string) => {
    setIsOnboardingOpen(false)
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setCurrentProject(result.data.project ?? result.data)
        }
      }
    } catch (error) {
      console.error('Failed to load project:', error)
    }
  }

  const handleGenerateChapter = () => {
    if (!currentProject) {
      toast.error('请先选择项目')
      return
    }
    setIsGenerateDialogOpen(true)
  }

  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <ProjectSelector onNewProject={handleNewProject} />
          <Separator orientation="vertical" className="h-6" />
          <div className="text-sm text-muted-foreground">
            {currentChapter ? `第 ${currentChapter.chapterNumber} 章：${currentChapter.title}` : '未选择章节'}
          </div>
        </div>
      
      <div className="ml-auto flex items-center gap-2">
         <div className="text-xs text-muted-foreground mr-2">
             {isSaving ? '保存中...' : lastSaved ? `已保存 ${new Date(lastSaved).toLocaleTimeString()}` : '未保存'}
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
         <Button variant="ghost" size="icon" className="h-8 w-8">
             <MoreHorizontal className="h-4 w-4" />
         </Button>
      </div>
    </header>


      <ProjectOnboardingDialog
        open={isOnboardingOpen}
        onOpenChange={setIsOnboardingOpen}
        onComplete={handleOnboardingComplete}
        onSwitchToManual={handleSwitchToManual}
      />

      <ProjectCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      <AIGenerateChapterDialog
        open={isGenerateDialogOpen}
        onOpenChange={setIsGenerateDialogOpen}
        projectId={currentProject?.id ?? null}
        chapters={chapters}
        flatOutlines={flatOutlines}
      />
    </>
  )
}