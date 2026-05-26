'use client'

import * as React from "react"
import {
  Book,
  Box,
  FileText,
  Home,
  LayoutTemplate,
  Pencil,
  Settings,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCurrentProject } from "@/hooks/use-projects"
import { ChapterList } from "@/components/chapter/chapter-list"
import { CharacterList } from "@/components/character/character-list"
import { WorldElementList } from "@/components/world/world-element-list"
import { CreateCharacterDialog } from "@/components/character/create-character-dialog"
import { CreateWorldElementDialog } from "@/components/world/create-world-element-dialog"
import { SettingsDialog } from "@/components/settings/settings-dialog"
import { ProjectEditDialog } from "@/components/project/project-edit-dialog"
import { OutlineList } from "@/components/outline/outline-list"
import { OutlineDialog } from "@/components/outline/outline-dialog"
import { useChapterStore } from "@/lib/store/chapter-store"
import { useUIStore } from "@/lib/store/ui-store"
import { useOutlineStore } from "@/lib/store/outline-store"
import { useCharacterStore, type Character } from "@/lib/store/character-store"
import { useWorldStore, type WorldElement } from "@/lib/store/world-store"
import { toast } from "sonner"
import type { Outline } from "@/lib/store/outline-store"

type SidebarProps = React.HTMLAttributes<HTMLDivElement>

export function StudioSidebarLeft({ className }: SidebarProps) {
  const { currentProject, setCurrentProject } = useCurrentProject()
  const { createChapter } = useChapterStore()
  const { deleteOutline } = useOutlineStore()
  const { deleteCharacter } = useCharacterStore()
  const { deleteWorldElement } = useWorldStore()
  const { setMainView } = useUIStore()

  const [activeSection, setActiveSection] = React.useState<string>('chapters')
  const [isCharacterDialogOpen, setIsCharacterDialogOpen] = React.useState(false)
  const [isWorldDialogOpen, setIsWorldDialogOpen] = React.useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
  const [isEditProjectOpen, setIsEditProjectOpen] = React.useState(false)
  const [isOutlineDialogOpen, setIsOutlineDialogOpen] = React.useState(false)
  const [editingOutline, setEditingOutline] = React.useState<Outline | null>(null)
  const [editingCharacter, setEditingCharacter] = React.useState<Character | null>(null)
  const [editingWorldElement, setEditingWorldElement] = React.useState<WorldElement | null>(null)
  const [outlineParentId, setOutlineParentId] = React.useState<string | null>(null)
  const [outlineDefaultType, setOutlineDefaultType] = React.useState<'volume' | 'chapter' | 'scene'>('chapter')

  // 创建新章节
  const handleCreateChapter = async () => {
    if (!currentProject) {
      toast.error('请先选择项目')
      return
    }

    try {
      // 计算下一个章节号
      const { chapters } = useChapterStore.getState()
      const nextChapterNumber = chapters.length > 0
        ? Math.max(...chapters.map(c => c.chapterNumber)) + 1
        : 1

      await createChapter({
        projectId: currentProject.id,
        chapterNumber: nextChapterNumber,
        title: '新章节',
        content: '<p>开始你的创作...</p>',
      })
      toast.success('章节创建成功')
    } catch {
      toast.error('创建章节失败')
    }
  }

  // 创建/编辑大纲
  const handleCreateOutline = (parentId?: string | null, type?: 'volume' | 'chapter' | 'scene') => {
    setEditingOutline(null)
    setOutlineParentId(parentId || null)
    setOutlineDefaultType(type || 'chapter')
    setIsOutlineDialogOpen(true)
  }

  const handleEditOutline = (outline: Outline) => {
    setEditingOutline(outline)
    setOutlineParentId(null)
    setOutlineDefaultType(outline.type)
    setIsOutlineDialogOpen(true)
  }

  const handleDeleteOutline = async (outline: Outline) => {
    try {
      await deleteOutline(outline.id)
      toast.success('大纲删除成功')
    } catch {
      toast.error('删除大纲失败')
    }
  }

  // 创建/编辑角色
  const handleCreateCharacter = () => {
    setEditingCharacter(null)
    setIsCharacterDialogOpen(true)
  }

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character)
    setIsCharacterDialogOpen(true)
  }

  const handleDeleteCharacter = async (character: Character) => {
    try {
      await deleteCharacter(character.id)
      toast.success('角色删除成功')
    } catch {
      toast.error('删除角色失败')
    }
  }

  // 创建/编辑世界观元素
  const handleCreateWorldElement = () => {
    setEditingWorldElement(null)
    setIsWorldDialogOpen(true)
  }

  const handleEditWorldElement = (element: WorldElement) => {
    setEditingWorldElement(element)
    setIsWorldDialogOpen(true)
  }

  const handleDeleteWorldElement = async (element: WorldElement) => {
    try {
      await deleteWorldElement(element.id)
      toast.success('世界观元素删除成功')
    } catch {
      toast.error('删除世界观元素失败')
    }
  }

  return (
    <div className={cn("pb-12 h-full flex flex-col", className)}>
      <div className="space-y-4 py-4 flex-1 flex flex-col">
        <div className="px-3 py-2">
          <div className="mb-2 px-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight truncate flex-1">
              {currentProject?.title || 'AI 小说工坊'}
            </h2>
            {currentProject && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => setIsEditProjectOpen(true)}
              >
                 <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => setIsSettingsOpen(true)}
            >
               <Settings className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1">
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => { setCurrentProject(null); setMainView('editor') }}
            >
              <Home className="mr-2 h-4 w-4" />
              工作台
            </Button>
            {currentProject && (
              <Button variant="ghost" className="w-full justify-start">
                <Book className="mr-2 h-4 w-4" />
                {currentProject.genre}
              </Button>
            )}
          </div>
        </div>
        <Separator className="mx-3 w-auto opacity-50" />
        <div className="px-3 py-2">
          <h3 className="mb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            创作资源
          </h3>
          <div className="space-y-1">
            <Button
              variant={activeSection === 'outline' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => { setActiveSection('outline'); setMainView('outline') }}
            >
              <LayoutTemplate className="mr-2 h-4 w-4" />
              剧情大纲
            </Button>
            <Button
              variant={activeSection === 'chapters' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => { setActiveSection('chapters'); setMainView('editor') }}
            >
              <FileText className="mr-2 h-4 w-4" />
              章节列表
            </Button>
            <Button
              variant={activeSection === 'characters' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => { setActiveSection('characters'); setMainView('editor') }}
            >
              <Users className="mr-2 h-4 w-4" />
              角色设定
            </Button>
            <Button
              variant={activeSection === 'world' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => { setActiveSection('world'); setMainView('editor') }}
            >
              <Box className="mr-2 h-4 w-4" />
              世界观
            </Button>
          </div>
        </div>

        <Separator className="mx-3 w-auto opacity-50" />

        {/* 动态内容区域 */}
        <div className="flex-1 overflow-hidden">
          {currentProject && activeSection === 'chapters' && (
            <ChapterList projectId={currentProject.id} onCreateChapter={handleCreateChapter} />
          )}
          {currentProject && activeSection === 'characters' && (
            <CharacterList
              projectId={currentProject.id}
              onCreateCharacter={handleCreateCharacter}
              onEditCharacter={handleEditCharacter}
              onDeleteCharacter={handleDeleteCharacter}
            />
          )}
          {currentProject && activeSection === 'world' && (
            <WorldElementList
              projectId={currentProject.id}
              onCreateElement={handleCreateWorldElement}
              onEditElement={handleEditWorldElement}
              onDeleteElement={handleDeleteWorldElement}
            />
          )}
          {activeSection === 'outline' && currentProject && (
            <OutlineList
              projectId={currentProject.id}
              onCreateOutline={handleCreateOutline}
              onEditOutline={handleEditOutline}
              onDeleteOutline={handleDeleteOutline}
            />
          )}
        </div>
      </div>
      
      <div className="px-4 py-4 border-t">
          <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  WF
              </div>
              <div className="text-sm">
                  <p className="font-medium">WengFB</p>
                  <p className="text-xs text-muted-foreground">专业版计划</p>
              </div>
          </div>
      </div>

      {/* 创建对话框 */}
      {currentProject && (
        <>
          <CreateCharacterDialog
            projectId={currentProject.id}
            open={isCharacterDialogOpen}
            onOpenChange={setIsCharacterDialogOpen}
            editingCharacter={editingCharacter}
          />
          <CreateWorldElementDialog
            projectId={currentProject.id}
            open={isWorldDialogOpen}
            onOpenChange={setIsWorldDialogOpen}
            editingElement={editingWorldElement}
          />
          <OutlineDialog
            projectId={currentProject.id}
            open={isOutlineDialogOpen}
            onOpenChange={setIsOutlineDialogOpen}
            editingOutline={editingOutline}
            parentId={outlineParentId}
            defaultType={outlineDefaultType}
          />
        </>
      )}

      {/* 设置对话框 */}
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />

      {/* 项目编辑对话框 */}
      {currentProject && (
        <ProjectEditDialog
          project={currentProject}
          open={isEditProjectOpen}
          onOpenChange={setIsEditProjectOpen}
        />
      )}
    </div>
  )
}