'use client'

import { useState } from "react";
import { Plus } from "lucide-react";
import { StudioLayout } from "@/components/layout/studio-layout";
import { StudioHeader } from "@/components/studio/studio-header";
import { TextEditor } from "@/components/editor/text-editor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ProjectOnboardingDialog } from "@/components/onboarding/project-onboarding-dialog";
import { ProjectCreateDialog } from "@/components/project/project-create-dialog";
import { ProjectList } from "@/components/project/project-list";
import { useProjects } from "@/hooks/use-projects";
import { useProjectStore } from "@/lib/store/project-store";

export default function Home() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    return localStorage.getItem('hasCompletedOnboarding') === 'true';
  });
  const { projects, isLoading } = useProjects();
  const { currentProject, setCurrentProject } = useProjectStore();
  const isOnboardingOpen = !hasCompletedOnboarding && !isLoading && projects.length === 0;

  const handleOnboardingOpenChange = (open: boolean) => {
    if (!open) {
      localStorage.setItem('hasCompletedOnboarding', 'true');
      setHasCompletedOnboarding(true);
    }
  };

  const handleOnboardingComplete = async (projectId: string) => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    setHasCompletedOnboarding(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setCurrentProject(result.data.project ?? result.data);
        }
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  };

  return (
    <>
      <StudioLayout>
        <div className="flex h-full flex-col">
          <StudioHeader />
          <ScrollArea className="flex-1">
            {currentProject ? (
              <div className="p-8 pb-32">
                <TextEditor />
              </div>
            ) : (
              <ProjectWorkspace onCreateProject={() => setIsCreateDialogOpen(true)} />
            )}
          </ScrollArea>
        </div>
      </StudioLayout>

      <ProjectCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      <ProjectOnboardingDialog
        open={isOnboardingOpen}
        onOpenChange={handleOnboardingOpenChange}
        onComplete={handleOnboardingComplete}
      />
    </>
  );
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
