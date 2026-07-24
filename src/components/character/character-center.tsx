'use client'

import { Plus, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/lib/store/ui-store'
import { CharacterEditPanel } from './character-edit-panel'
import { DetailEmptyState } from '@/components/studio/detail-empty-state'

interface CharacterCenterProps {
  projectId: string
}

export function CharacterCenter({ projectId }: CharacterCenterProps) {
  const { characterEditPayload, openCharacterEdit, closeCharacterEdit } = useUIStore()

  if (characterEditPayload) {
    return (
      <CharacterEditPanel
        projectId={projectId}
        character={characterEditPayload.character}
        onClose={closeCharacterEdit}
      />
    )
  }

  return (
    <DetailEmptyState
      icon={User}
      title="选择角色"
      description="在左侧角色列表中点击角色，可在此处查看与编辑详情。"
      actions={
        <Button onClick={() => openCharacterEdit({ character: null })}>
          <Plus className="mr-2 h-4 w-4" />
          新建角色
        </Button>
      }
    />
  )
}
