'use client'

import * as React from "react"
import { ArrowLeft, MoreHorizontal, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCurrentProject } from "@/hooks/use-projects"
import { useChapterStore } from "@/lib/store/chapter-store"
import { AIContinueButton } from "@/components/ai/ai-continue-button"
import { ProjectSelector } from "@/components/project/project-selector"
import { ProjectOnboardingDialog } from "@/components/onboarding/project-onboarding-dialog"
import { toast } from "sonner"

export function StudioHeader() {
  const { currentProject } = useCurrentProject()
  const { currentChapter, updateChapterContent, saveChapter, isSaving, lastSaved } = useChapterStore()
  const [accumulatedContent, setAccumulatedContent] = React.useState('')
  const [isOnboardingOpen, setIsOnboardingOpen] = React.useState(false)

  const handleSave = async () => {
    if (!currentChapter) {
      toast.error('请先选择章节')
      return
    }

    try {
      await saveChapter(currentChapter.id)
      toast.success('保存成功')
    } catch (error) {
      toast.error('保存失败，请重试')
    }
  }

  const handleAIContentGenerated = (chunk: string) => {
    if (currentChapter) {
      setAccumulatedContent(prev => prev + chunk)
    }
  }

  // 当累积内容变化时，更新章节内容
  React.useEffect(() => {
    if (currentChapter && accumulatedContent) {
      updateChapterContent(currentChapter.id, (currentChapter.content || '') + accumulatedContent)
    }
  }, [accumulatedContent])

  // 重置累积内容
  React.useEffect(() => {
    setAccumulatedContent('')
  }, [currentChapter?.id])

  const handleNewProject = () => {
    setIsOnboardingOpen(true)
  }

  const handleOnboardingComplete = async (projectId: string) => {
    // 刷新页面以加载新项目
    window.location.reload()
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
         <AIContinueButton onContentGenerated={handleAIContentGenerated} />
         <Button variant="ghost" size="icon" className="h-8 w-8">
             <MoreHorizontal className="h-4 w-4" />
         </Button>
      </div>
    </header>

      <ProjectOnboardingDialog
        open={isOnboardingOpen}
        onOpenChange={setIsOnboardingOpen}
        onComplete={handleOnboardingComplete}
      />
    </>
  )
}