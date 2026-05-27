"use client"

import { useState } from "react"
import type { Layout } from "react-resizable-panels"
import { Plus } from "lucide-react"
import { StudioLayoutClient } from "@/components/layout/studio-layout"
import { StudioHeader } from "@/components/studio/studio-header"
import { TextEditor } from "@/components/editor/text-editor"
import { OutlineVisualization } from "@/components/outline/outline-visualization"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ProjectOnboardingDialog } from "@/components/onboarding/project-onboarding-dialog"
import { ProjectCreateDialog } from "@/components/project/project-create-dialog"
import { ProjectList } from "@/components/project/project-list"
import { useProjects } from "@/hooks/use-projects"
import { useProjectStore } from "@/lib/store/project-store"
import { useUIStore } from "@/lib/store/ui-store"

interface HomeClientProps {
  defaultLayout?: Layout
}

export function HomeClient({ defaultLayout }: HomeClientProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isManualOnboardingOpen, setIsManualOnboardingOpen] = useState(false)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    if (typeof window === "undefined") return true
    return localStorage.getItem("hasCompletedOnboarding") === "true"
  })
  const { projects, isLoading } = useProjects()
  const { currentProject, setCurrentProject } = useProjectStore()
  const { mainView } = useUIStore()
  const isAutoOnboardingOpen = !hasCompletedOnboarding && !isLoading && projects.length === 0

  const handleAutoOnboardingOpenChange = (open: boolean) => {
    if (!open) {
      localStorage.setItem("hasCompletedOnboarding", "true")
      setHasCompletedOnboarding(true)
    }
  }

  const handleManualOnboardingOpenChange = (open: boolean) => {
    if (!open) setIsManualOnboardingOpen(false)
  }

  const handleOnboardingComplete = async (projectId: string) => {
    localStorage.setItem("hasCompletedOnboarding", "true")
    setHasCompletedOnboarding(true)
    setIsManualOnboardingOpen(false)

    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setCurrentProject(result.data.project ?? result.data)
        }
      }
    } catch (error) {
      console.error("Failed to load project:", error)
    }
  }

  const handleSwitchToManual = () => {
    setIsManualOnboardingOpen(false)
    setTimeout(() => setIsCreateDialogOpen(true), 100)
  }

  const handleNewProject = () => {
    setIsManualOnboardingOpen(true)
  }

  return (
    <>
      <StudioLayoutClient defaultLayout={defaultLayout}>
        <div className="flex h-full flex-col">
          <StudioHeader />
          <ScrollArea className="flex-1">
            {currentProject ? (
              mainView === "outline" ? (
                <OutlineVisualization projectId={currentProject.id} />
              ) : (
                <div className="p-8 pb-32">
                  <TextEditor />
                </div>
              )
            ) : (
              <ProjectWorkspace onCreateProject={handleNewProject} />
            )}
          </ScrollArea>
        </div>
      </StudioLayoutClient>

      <ProjectCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      <ProjectOnboardingDialog
        open={isAutoOnboardingOpen}
        onOpenChange={handleAutoOnboardingOpenChange}
        onComplete={handleOnboardingComplete}
      />

      <ProjectOnboardingDialog
        open={isManualOnboardingOpen}
        onOpenChange={handleManualOnboardingOpenChange}
        onComplete={handleOnboardingComplete}
        onSwitchToManual={handleSwitchToManual}
      />
    </>
  )
}

function ProjectWorkspace({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-8 pb-32">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">项目工作台</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">选择一个小说项目</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            进入项目后可以继续编辑章节、管理角色与世界观，或从这里创建一个全新的故事。
          </p>
        </div>
        <Button onClick={onCreateProject}>
          <Plus className="mr-2 h-4 w-4" />
          新建项目
        </Button>
      </div>

      <ProjectList onCreateProject={onCreateProject} />
    </div>
  )
}