'use client'

import { LayoutTemplate, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/lib/store/ui-store'
import { OutlineEditPanel } from './outline-edit-panel'
import { OutlineGeneratePanel } from './outline-generate-panel'
import { useOutlines } from '@/hooks/use-outlines'
import { DetailEmptyState } from '@/components/studio/detail-empty-state'

interface OutlineCenterProps {
  projectId: string
}

/** 大纲中间区：空态 / 节点详情 / AI 生成 */
export function OutlineCenter({ projectId }: OutlineCenterProps) {
  const {
    outlineCenterMode,
    outlineEditPayload,
    openOutlineGenerate,
    openOutlineEdit,
    closeOutlineCenter,
  } = useUIStore()
  const { refetch } = useOutlines(projectId)

  if (outlineCenterMode === 'generate') {
    return (
      <OutlineGeneratePanel
        projectId={projectId}
        onComplete={async () => {
          await refetch()
          closeOutlineCenter()
        }}
        onClose={closeOutlineCenter}
      />
    )
  }

  if (outlineCenterMode === 'edit') {
    return (
      <OutlineEditPanel
        projectId={projectId}
        editingOutline={outlineEditPayload?.editingOutline}
        parentId={outlineEditPayload?.parentId}
        defaultType={outlineEditPayload?.defaultType}
        onClose={closeOutlineCenter}
        onSaved={async () => {
          await refetch()
        }}
      />
    )
  }

  return (
    <DetailEmptyState
      icon={LayoutTemplate}
      title="选择大纲节点"
      description="在左侧大纲树中点击节点，可在此处查看与编辑详情；也可新建节点或使用 AI 生成。"
      actions={
        <>
          <Button
            variant="outline"
            onClick={() =>
              openOutlineEdit({ editingOutline: null, defaultType: 'chapter' })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            新建节点
          </Button>
          <Button onClick={openOutlineGenerate}>
            <Sparkles className="mr-2 h-4 w-4" />
            AI 生成大纲
          </Button>
        </>
      }
    />
  )
}
