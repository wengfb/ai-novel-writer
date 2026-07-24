"use client"

import { useEffect, useState } from "react"
import type { Layout } from "react-resizable-panels"
import { Plus, AlertTriangle, X, Lightbulb } from "lucide-react"
import { StudioLayoutClient } from "@/components/layout/studio-layout"
import { StudioHeader } from "@/components/studio/studio-header"
import { TextEditor } from "@/components/editor/text-editor"
import { OutlineCenter } from "@/components/outline/outline-center"
import { CharacterCenter } from "@/components/character/character-center"
import { WorldCenter } from "@/components/world/world-center"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ProjectCreateDialog } from "@/components/project/project-create-dialog"
import { ProjectList } from "@/components/project/project-list"
import { useProjects } from "@/hooks/use-projects"
import { useProjectStore } from "@/lib/store/project-store"
import { useUIStore } from "@/lib/store/ui-store"
import { useChapterStore } from "@/lib/store/chapter-store"
import { useOutlines } from "@/hooks/use-outlines"
import { IdeaCenterPage } from "@/components/ideas/idea-center-page"
import { ProjectOnboardingPanel } from "@/components/onboarding/project-onboarding-panel"
import { SettingsPanel } from "@/components/settings/settings-panel"
import { ProjectEditPanel } from "@/components/project/project-edit-panel"
import { AIGenerateChapterPanel } from "@/components/ai/ai-generate-chapter-panel"
import type { StoryIdeaCard } from "@/types"

interface HomeClientProps {
  defaultLayout?: Layout
}

export function HomeClient({ defaultLayout }: HomeClientProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    if (typeof window === "undefined") return true
    return localStorage.getItem("hasCompletedOnboarding") === "true"
  })

  const { projects, isLoading } = useProjects()
  const { currentProject, setCurrentProject } = useProjectStore()
  const { chapters } = useChapterStore()
  const {
    mainView,
    setMainView,
    onboardingContext,
    startOnboarding,
    clearOnboarding,
    generateChapterPanelOpen,
    setGenerateChapterPanelOpen,
    openEditor,
  } = useUIStore()
  const { flatOutlines } = useOutlines(currentProject?.id || "")

  useEffect(() => {
    if (typeof window === "undefined") return
    const fromIdeaCenter = sessionStorage.getItem("onboardingFromIdeaCenter")
    const ideaJson = sessionStorage.getItem("onboardingSelectedIdea")
    const ideaId = sessionStorage.getItem("onboardingIdeaId")
    if (fromIdeaCenter === "true" && ideaJson) {
      sessionStorage.removeItem("onboardingFromIdeaCenter")
      sessionStorage.removeItem("onboardingSelectedIdea")
      sessionStorage.removeItem("onboardingIdeaId")
      try {
        const idea = JSON.parse(ideaJson) as StoryIdeaCard
        startOnboarding({
          mode: "prefill",
          prefillIdea: idea,
          prefillIdeaId: ideaId || undefined,
        })
      } catch {
        /* ignore */
      }
    }
  }, [startOnboarding])

  useEffect(() => {
    if (isLoading || hasCompletedOnboarding) return
    if (projects.length === 0 && mainView !== "onboarding") {
      startOnboarding({ mode: "new" })
    }
  }, [isLoading, hasCompletedOnboarding, projects.length, mainView, startOnboarding])

  useEffect(() => {
    if (currentProject) return
    if (
      mainView === "editor" ||
      mainView === "outline" ||
      mainView === "characters" ||
      mainView === "world" ||
      mainView === "project"
    ) {
      setMainView("projects")
    }
  }, [currentProject, mainView, setMainView])

  const backFromGlobal = () => {
    if (currentProject) openEditor()
    else setMainView("projects")
  }

  const handleOnboardingComplete = async (projectId: string) => {
    localStorage.setItem("hasCompletedOnboarding", "true")
    setHasCompletedOnboarding(true)

    const prefillIdeaId = onboardingContext?.prefillIdeaId
    clearOnboarding()

    if (prefillIdeaId) {
      try {
        await fetch(`/api/ideas/${prefillIdeaId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "converted" }),
        })
      } catch {
        /* ignore */
      }
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setCurrentProject(result.data.project ?? result.data)
          openEditor()
        }
      }
    } catch (error) {
      console.error("Failed to load project:", error)
    }
  }

  const handleOnboardingCancel = () => {
    localStorage.setItem("hasCompletedOnboarding", "true")
    setHasCompletedOnboarding(true)
    clearOnboarding()
    if (currentProject) openEditor()
    else setMainView("projects")
  }

  const handleSwitchToManual = () => {
    clearOnboarding()
    setIsCreateDialogOpen(true)
    setMainView("projects")
  }

  const handleNewProject = () => {
    startOnboarding({ mode: "new" })
  }

  const handleCreateFromIdea = (idea: StoryIdeaCard, ideaId: string) => {
    startOnboarding({
      mode: "prefill",
      prefillIdea: idea,
      prefillIdeaId: ideaId,
    })
  }

  const handleContinueInit = () => {
    if (!currentProject) return
    startOnboarding({
      mode: "resume",
      resumeProject: {
        id: currentProject.id,
        title: currentProject.title,
        genre: currentProject.genre,
        description: currentProject.description || "",
      },
    })
  }

  const renderMainContent = () => {
    switch (mainView) {
      case "onboarding":
        return (
          <ProjectOnboardingPanel
            context={onboardingContext}
            onComplete={handleOnboardingComplete}
            onCancel={handleOnboardingCancel}
            onSwitchToManual={handleSwitchToManual}
          />
        )
      case "ideas":
        return (
          <IdeaCenterPage
            onClose={backFromGlobal}
            onCreateProject={handleCreateFromIdea}
          />
        )
      case "settings":
        return <SettingsPanel onClose={backFromGlobal} />
      case "project":
        if (!currentProject) return null
        return (
          <ProjectEditPanel project={currentProject} onClose={() => openEditor()} />
        )
      case "outline":
        if (!currentProject) return null
        return <OutlineCenter projectId={currentProject.id} />
      case "characters":
        if (!currentProject) return null
        return <CharacterCenter projectId={currentProject.id} />
      case "world":
        if (!currentProject) return null
        return <WorldCenter projectId={currentProject.id} />
      case "editor":
        if (!currentProject) return null
        return (
          <div className="flex h-full min-h-0 flex-col">
            <IncompleteInitBanner
              projectId={currentProject.id}
              chapterCount={currentProject.chapterCount}
              onContinueInit={handleContinueInit}
            />
            {generateChapterPanelOpen && (
              <AIGenerateChapterPanel
                projectId={currentProject.id}
                chapters={chapters}
                flatOutlines={flatOutlines}
                onClose={() => setGenerateChapterPanelOpen(false)}
              />
            )}
            <ScrollArea className="flex-1">
              <div className="p-8 pb-32">
                <TextEditor />
              </div>
            </ScrollArea>
          </div>
        )
      case "projects":
      default:
        return (
          <ScrollArea className="h-full">
            <ProjectWorkspace
              onCreateProject={handleNewProject}
              onOpenIdeaCenter={() => setMainView("ideas")}
            />
          </ScrollArea>
        )
    }
  }

  return (
    <>
      <StudioLayoutClient defaultLayout={defaultLayout}>
        <div className="flex h-full min-h-0 flex-col">
          <StudioHeader />
          <main key={mainView} className="min-h-0 flex-1 overflow-hidden bg-background">
            {renderMainContent()}
          </main>
        </div>
      </StudioLayoutClient>

      <ProjectCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </>
  )
}

function ProjectWorkspace({
  onCreateProject,
  onOpenIdeaCenter,
}: {
  onCreateProject: () => void
  onOpenIdeaCenter: () => void
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-8 pb-32">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">全部项目</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">选择一个小说项目</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            进入项目后可以继续编辑章节、管理角色与世界观，或从这里创建一个全新的故事。
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onOpenIdeaCenter}>
            <Lightbulb className="mr-2 h-4 w-4" />
            创意中心
          </Button>
          <Button onClick={onCreateProject}>
            <Plus className="mr-2 h-4 w-4" />
            新建项目
          </Button>
        </div>
      </div>

      <ProjectList onCreateProject={onCreateProject} />
    </div>
  )
}

function IncompleteInitBanner({
  projectId,
  chapterCount,
  onContinueInit,
}: {
  projectId: string
  chapterCount: number | undefined
  onContinueInit: () => void
}) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(`init-banner-dismissed-${projectId}`) === "true"
  })

  if (dismissed || (chapterCount && chapterCount > 0)) return null

  return (
    <div className="mx-6 mt-4 flex shrink-0 items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            项目初始化未完成
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            部分模块（角色、世界观、分卷大纲等）尚未生成，建议完成初始化后再开始写作
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="outline" size="sm" onClick={onContinueInit}>
          继续初始化
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => {
            localStorage.setItem(`init-banner-dismissed-${projectId}`, "true")
            setDismissed(true)
          }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
