'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { Project } from '@/lib/store/project-store'

interface ProjectCardProps {
  project: Project
  onClick?: () => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  // 计算进度百分比（假设目标是 10 万字）
  const targetWords = 100000
  const progress = Math.min((project.totalWords / targetWords) * 100, 100)

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle>{project.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {project.description || '暂无简介'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm mb-3">
          <Badge variant="secondary">{project.genre}</Badge>
          <span className="text-muted-foreground">
            {project.totalWords.toLocaleString()} 字
          </span>
        </div>
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{project.totalChapters} 章</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
