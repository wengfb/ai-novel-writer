'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { useCurrentProject } from '@/hooks/use-projects'
import { ChapterList } from '@/components/chapter/chapter-list'
import { CharacterList } from '@/components/character/character-list'
import { WorldElementList } from '@/components/world/world-element-list'
import { OutlineList } from '@/components/outline/outline-list'
import { useChapterStore } from '@/lib/store/chapter-store'
import { useUIStore } from '@/lib/store/ui-store'
import { useOutlineStore } from '@/lib/store/outline-store'
import { useCharacterStore, type Character } from '@/lib/store/character-store'
import { useWorldStore, type WorldElement } from '@/lib/store/world-store'
import { toast } from 'sonner'
import type { Outline } from '@/lib/store/outline-store'
import { SidebarNav } from './sidebar-left/sidebar-nav'
import { SidebarDialogs } from './sidebar-left/sidebar-dialogs'

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
  const [isIdeaCenterOpen, setIsIdeaCenterOpen] = React.useState(false)
  const [isOutlineDialogOpen, setIsOutlineDialogOpen] = React.useState(false)
  const [editingOutline, setEditingOutline] = React.useState<Outline | null>(null)
  const [editingCharacter, setEditingCharacter] = React.useState<Character | null>(null)
  const [editingWorldElement, setEditingWorldElement] = React.useState<WorldElement | null>(null)
  const [outlineParentId, setOutlineParentId] = React.useState<string | null>(null)
  const [outlineDefaultType, setOutlineDefaultType] = React.useState<'volume' | 'chapter' | 'scene'>('chapter')

  const handleCreateChapter = async () => {
    if (!currentProject) {
      toast.error('请先选择项目')
      return
    }

    try {
      const { chapters } = useChapterStore.getState()
      const nextChapterNumber =
        chapters.length > 0 ? Math.max(...chapters.map((c) => c.chapterNumber)) + 1 : 1

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
    <div className={cn('pb-12 h-full flex flex-col min-w-0', className)}>
      <div className="space-y-4 py-4 flex-1 flex flex-col">
        <SidebarNav
          currentProject={currentProject}
          activeSection={activeSection}
          onGoHome={() => {
            setCurrentProject(null)
            setMainView('editor')
          }}
          onOpenEditProject={() => setIsEditProjectOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenIdeaCenter={() => setIsIdeaCenterOpen(true)}
          onSelectSection={(section, mainView) => {
            setActiveSection(section)
            setMainView(mainView)
          }}
        />

        <Separator className="mx-3 w-auto opacity-50" />

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

      <SidebarDialogs
        currentProject={currentProject}
        isCharacterDialogOpen={isCharacterDialogOpen}
        setIsCharacterDialogOpen={setIsCharacterDialogOpen}
        isWorldDialogOpen={isWorldDialogOpen}
        setIsWorldDialogOpen={setIsWorldDialogOpen}
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        isEditProjectOpen={isEditProjectOpen}
        setIsEditProjectOpen={setIsEditProjectOpen}
        isIdeaCenterOpen={isIdeaCenterOpen}
        setIsIdeaCenterOpen={setIsIdeaCenterOpen}
        isOutlineDialogOpen={isOutlineDialogOpen}
        setIsOutlineDialogOpen={setIsOutlineDialogOpen}
        editingOutline={editingOutline}
        editingCharacter={editingCharacter}
        editingWorldElement={editingWorldElement}
        outlineParentId={outlineParentId}
        outlineDefaultType={outlineDefaultType}
      />
    </div>
  )
}
