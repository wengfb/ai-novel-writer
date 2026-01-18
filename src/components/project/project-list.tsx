'use client'

import { useProjects, useCurrentProject } from '@/hooks/use-projects'
import { ProjectCard } from './project-card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'

export function ProjectList() {
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
      <div className="text-center py-12">
        <p className="text-muted-foreground">暂无项目，点击右上角创建新项目</p>
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
