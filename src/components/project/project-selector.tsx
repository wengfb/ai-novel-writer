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
import { Check, ChevronDown, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProjects } from '@/hooks/use-projects'
import { useProjectStore } from '@/lib/store/project-store'

interface ProjectSelectorProps {
  className?: string
  onNewProject?: () => void
}

export function ProjectSelector({ className, onNewProject }: ProjectSelectorProps) {
  const [open, setOpen] = useState(false)
  const { projects, isLoading } = useProjects()
  const { currentProject, setCurrentProject } = useProjectStore()

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

  return (
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
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          <CommandInput placeholder="搜索项目..." />
          <CommandEmpty>未找到项目</CommandEmpty>
          <CommandGroup>
            {projects.map((project) => (
              <CommandItem
                key={project.id}
                value={project.id}
                onSelect={() => handleSelectProject(project.id)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    currentProject?.id === project.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{project.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {project.genre} · {project.totalWords.toLocaleString()} 字
                  </div>
                </div>
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
  )
}
