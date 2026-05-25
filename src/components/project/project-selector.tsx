'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
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
import { Check, ChevronDown, Plus, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProjects } from '@/hooks/use-projects'
import { useProjectStore } from '@/lib/store/project-store'
import { toast } from 'sonner'

interface ProjectSelectorProps {
  className?: string
  onNewProject?: () => void
}

export function ProjectSelector({ className, onNewProject }: ProjectSelectorProps) {
  const [open, setOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const { projects, isLoading } = useProjects()
  const { currentProject, setCurrentProject, deleteProject } = useProjectStore()

  const handleSelectProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (project) {
      setCurrentProject(project)
      setOpen(false)
    }
  }

  const handleNewProject = () => {
    setOpen(false)
    onNewProject?.()
  }

  const handleDeleteClick = (e: React.MouseEvent, projectId: string, title: string) => {
    e.stopPropagation()
    setDeleteTarget({ id: projectId, title })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deleteProject(deleteTarget.id)
      toast.success(`项目「${deleteTarget.title}」已删除`)
    } catch {
      toast.error('删除项目失败，请重试')
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-[250px] justify-between", className)}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                加载中...
              </span>
            ) : currentProject ? (
              <span className="truncate">{currentProject.title}</span>
            ) : (
              <span className="text-muted-foreground">选择项目</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="搜索项目..." />
            <CommandEmpty>未找到项目</CommandEmpty>
            <CommandGroup>
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.id}
                  onSelect={() => handleSelectProject(project.id)}
                  className="group"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      currentProject?.id === project.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{project.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {project.genre} · {project.totalWords.toLocaleString()} 字
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => handleDeleteClick(e, project.id, project.title)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem onSelect={handleNewProject}>
                <Plus className="mr-2 h-4 w-4" />
                新建项目
              </CommandItem>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除项目</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除项目「{deleteTarget?.title}」吗？此操作将同时删除该项目下的所有章节、角色、世界观设定和大纲数据，且无法恢复。
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
