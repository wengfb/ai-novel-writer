'use client'

import { useEffect, useState } from "react";
import { StudioLayout } from "@/components/layout/studio-layout";
import { StudioHeader } from "@/components/studio/studio-header";
import { TextEditor } from "@/components/editor/text-editor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectOnboardingDialog } from "@/components/onboarding/project-onboarding-dialog";
import { useProjects } from "@/hooks/use-projects";
import { useProjectStore } from "@/lib/store/project-store";
import { useRouter } from "next/navigation";

export default function Home() {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const { projects, isLoading } = useProjects();
  const { setCurrentProject } = useProjectStore();
  const router = useRouter();

  useEffect(() => {
    // 检查是否首次进入
    const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');

    // 如果未完成引导且没有项目，自动打开引导对话框
    if (!hasCompletedOnboarding && !isLoading && projects.length === 0) {
      setIsOnboardingOpen(true);
    }
  }, [projects, isLoading]);

  const handleOnboardingComplete = async (projectId: string) => {
    // 标记已完成引导
    localStorage.setItem('hasCompletedOnboarding', 'true');

    // 加载新创建的项目
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setCurrentProject(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    }

    // 刷新页面以加载新项目数据
    router.refresh();
  };

  return (
    <>
      <StudioLayout>
        <div className="flex h-full flex-col">
          <StudioHeader />
          <ScrollArea className="flex-1">
             <div className="p-8 pb-32">
               <TextEditor />
             </div>
          </ScrollArea>
        </div>
      </StudioLayout>

      <ProjectOnboardingDialog
        open={isOnboardingOpen}
        onOpenChange={setIsOnboardingOpen}
        onComplete={handleOnboardingComplete}
      />
    </>
  );
}