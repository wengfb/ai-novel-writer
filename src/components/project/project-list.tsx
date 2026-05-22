'use client'

import { useProjects, useCurrentProject } from '@/hooks/use-projects'
import { ProjectCard } from './project-card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProjectListProps {
  onCreateProject?: () => void
}

export function ProjectList({ onCreateProject }: ProjectListProps) {
  const { projects, isLoading, error } = useProjects()
  const { setCurrentProject } = useCurrentProject()

  if (isLoading) {
    return <ProjectListSkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <p className="text-muted-foreground">暂无项目，创建一个项目开始写作</p>
        {onCreateProject && (
          <Button className="mt-4" onClick={onCreateProject}>
            <Plus className="mr-2 h-4 w-4" />
            新建项目
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onClick={() => setCurrentProject(project)}
        />
      ))}
    </div>
  )
}

function ProjectListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-[200px] w-full" />
        </div>
      ))}
    </div>
  )
}
