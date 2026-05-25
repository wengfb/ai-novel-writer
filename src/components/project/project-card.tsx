'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Project } from '@/lib/store/project-store'
import { useProjectStore } from '@/lib/store/project-store'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface ProjectCardProps {
  project: Project
  onClick?: () => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { deleteProject } = useProjectStore()

  const targetWords = 100000
  const progress = Math.min((project.totalWords / targetWords) * 100, 100)

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      await deleteProject(project.id)
      toast.success(`项目「${project.title}」已删除`)
    } catch {
      toast.error('删除项目失败，请重试')
    } finally {
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-lg transition-shadow group relative"
        onClick={onClick}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive z-10"
          onClick={handleDeleteClick}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除项目</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除项目「{project.title}」吗？此操作将同时删除该项目下的所有章节、角色、世界观设定和大纲数据，且无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
