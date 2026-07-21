'use client'

import { CreateCharacterDialog } from '@/components/character/create-character-dialog'
import { CreateWorldElementDialog } from '@/components/world/create-world-element-dialog'
import { SettingsDialog } from '@/components/settings/settings-dialog'
import { ProjectEditDialog } from '@/components/project/project-edit-dialog'
import { OutlineDialog } from '@/components/outline/outline-dialog'
import { IdeaCenterDialog } from '@/components/ideas/idea-center-dialog'
import type { Outline } from '@/lib/store/outline-store'
import type { Character } from '@/lib/store/character-store'
import type { WorldElement } from '@/lib/store/world-store'
import type { Project } from '@/types'

interface SidebarDialogsProps {
  currentProject: Project | null
  isCharacterDialogOpen: boolean
  setIsCharacterDialogOpen: (v: boolean) => void
  isWorldDialogOpen: boolean
  setIsWorldDialogOpen: (v: boolean) => void
  isSettingsOpen: boolean
  setIsSettingsOpen: (v: boolean) => void
  isEditProjectOpen: boolean
  setIsEditProjectOpen: (v: boolean) => void
  isIdeaCenterOpen: boolean
  setIsIdeaCenterOpen: (v: boolean) => void
  isOutlineDialogOpen: boolean
  setIsOutlineDialogOpen: (v: boolean) => void
  editingOutline: Outline | null
  editingCharacter: Character | null
  editingWorldElement: WorldElement | null
  outlineParentId: string | null
  outlineDefaultType: 'volume' | 'chapter' | 'scene'
}

/** 左侧栏挂载的各类对话框 */
export function SidebarDialogs({
  currentProject,
  isCharacterDialogOpen,
  setIsCharacterDialogOpen,
  isWorldDialogOpen,
  setIsWorldDialogOpen,
  isSettingsOpen,
  setIsSettingsOpen,
  isEditProjectOpen,
  setIsEditProjectOpen,
  isIdeaCenterOpen,
  setIsIdeaCenterOpen,
  isOutlineDialogOpen,
  setIsOutlineDialogOpen,
  editingOutline,
  editingCharacter,
  editingWorldElement,
  outlineParentId,
  outlineDefaultType,
}: SidebarDialogsProps) {
  return (
    <>
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

      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />

      {currentProject && (
        <ProjectEditDialog
          project={currentProject}
          open={isEditProjectOpen}
          onOpenChange={setIsEditProjectOpen}
        />
      )}

      <IdeaCenterDialog open={isIdeaCenterOpen} onOpenChange={setIsIdeaCenterOpen} />
    </>
  )
}
