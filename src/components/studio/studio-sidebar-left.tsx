'use client'

import * as React from 'react'
import { FolderOpen, Lightbulb, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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

type SidebarProps = React.HTMLAttributes<HTMLDivElement>

export function StudioSidebarLeft({ className }: SidebarProps) {
  const { currentProject, setCurrentProject } = useCurrentProject()
  const { createChapter } = useChapterStore()
  const { deleteOutline } = useOutlineStore()
  const { deleteCharacter } = useCharacterStore()
  const { deleteWorldElement } = useWorldStore()
  const {
    mainView,
    bookSection,
    setMainView,
    selectBookSection,
    openOutlineEdit,
    openOutlineGenerate,
    openCharacterEdit,
    openWorldEdit,
    openEditor,
  } = useUIStore()

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
      openEditor()
      toast.success('章节创建成功')
    } catch {
      toast.error('创建章节失败')
    }
  }

  const handleCreateOutline = (parentId?: string | null, type?: 'volume' | 'chapter' | 'scene') => {
    openOutlineEdit({
      editingOutline: null,
      parentId: parentId || null,
      defaultType: type || 'chapter',
    })
  }

  const handleSelectOutline = (outline: Outline) => {
    openOutlineEdit({
      editingOutline: outline,
      parentId: null,
      defaultType: outline.type,
    })
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
    openCharacterEdit({ character: null })
  }

  const handleSelectCharacter = (character: Character) => {
    openCharacterEdit({ character })
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
    openWorldEdit({ element: null })
  }

  const handleSelectWorldElement = (element: WorldElement) => {
    openWorldEdit({ element })
  }

  const handleDeleteWorldElement = async (element: WorldElement) => {
    try {
      await deleteWorldElement(element.id)
      toast.success('世界观元素删除成功')
    } catch {
      toast.error('删除世界观元素失败')
    }
  }

  const sectionContent = currentProject
    ? {
        chapters: (
          <ChapterList
            projectId={currentProject.id}
            onCreateChapter={handleCreateChapter}
          />
        ),
        outline: (
          <OutlineList
            projectId={currentProject.id}
            onCreateOutline={handleCreateOutline}
            onSelectOutline={handleSelectOutline}
            onDeleteOutline={handleDeleteOutline}
            onGenerateOutline={openOutlineGenerate}
          />
        ),
        characters: (
          <CharacterList
            projectId={currentProject.id}
            onCreateCharacter={handleCreateCharacter}
            onSelectCharacter={handleSelectCharacter}
            onDeleteCharacter={handleDeleteCharacter}
          />
        ),
        world: (
          <WorldElementList
            projectId={currentProject.id}
            onCreateElement={handleCreateWorldElement}
            onSelectElement={handleSelectWorldElement}
            onDeleteElement={handleDeleteWorldElement}
          />
        ),
      }
    : {
        chapters: null,
        outline: null,
        characters: null,
        world: null,
      }

  return (
    <div className={cn('flex h-full min-w-0 flex-col', className)}>
      <div className="flex min-h-0 flex-1 flex-col">
        <SidebarNav
          currentProject={currentProject}
          bookSection={bookSection}
          mainView={mainView}
          onOpenEditProject={() => {
            if (currentProject) setMainView('project')
          }}
          onSelectSection={selectBookSection}
          sectionContent={sectionContent}
        />

        {!currentProject && <div className="min-h-0 flex-1" />}
      </div>

      <div className="mt-auto shrink-0 border-t">
        <div className="space-y-1 px-3 py-2">
          <Button
            variant={mainView === 'ideas' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setMainView('ideas')}
          >
            <Lightbulb className="mr-2 h-4 w-4" />
            创意中心
          </Button>
          <Button
            variant={mainView === 'projects' || !currentProject ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => {
              setCurrentProject(null)
              setMainView('projects')
            }}
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            全部项目
          </Button>
          <Button
            variant={mainView === 'settings' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setMainView('settings')}
          >
            <Settings className="mr-2 h-4 w-4" />
            系统设置
          </Button>
        </div>

        <div className="border-t px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
              WF
            </div>
            <div className="text-sm">
              <p className="font-medium">WengFB</p>
              <p className="text-xs text-muted-foreground">专业版计划</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
