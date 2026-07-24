'use client'

import { Box, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/lib/store/ui-store'
import { WorldEditPanel } from './world-edit-panel'
import { DetailEmptyState } from '@/components/studio/detail-empty-state'

interface WorldCenterProps {
  projectId: string
}

export function WorldCenter({ projectId }: WorldCenterProps) {
  const { worldEditPayload, openWorldEdit, closeWorldEdit } = useUIStore()

  if (worldEditPayload) {
    return (
      <WorldEditPanel
        projectId={projectId}
        element={worldEditPayload.element}
        onClose={closeWorldEdit}
      />
    )
  }

  return (
    <DetailEmptyState
      icon={Box}
      title="选择世界观"
      description="在左侧列表中点击元素，可在此处查看与编辑详情。"
      actions={
        <Button onClick={() => openWorldEdit({ element: null })}>
          <Plus className="mr-2 h-4 w-4" />
          新建世界观
        </Button>
      }
    />
  )
}
