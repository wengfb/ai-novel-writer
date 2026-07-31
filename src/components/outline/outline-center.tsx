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

/** 大纲工作台中间区：空大纲规划、节点详情与全书协作共用同一工作空间。 */
export function OutlineCenter({ projectId }: OutlineCenterProps) {
  const {
    outlineCenterMode,
    outlineEditPayload,
    openOutlinePlanning,
    openOutlineEdit,
    openAssistantForScope,
    closeOutlineCenter,
  } = useUIStore()
  const { outlines, flatOutlines, refetch } = useOutlines(projectId)
  const hasOutlines = outlines.length > 0

  const openOutlineCollaboration = () => {
    const outlineSummary = flatOutlines
      .map((outline) => `- ${outline.type === 'volume' ? '卷' : outline.type === 'scene' ? '场景' : '章'}：${outline.title}${outline.description ? `（${outline.description}）` : ''}`)
      .join('\n')

    openAssistantForScope(
      {
        type: 'project',
        title: '整本剧情大纲',
        subtitle: '全书结构协作',
        contextAppend: `\n当前项目已有大纲如下：\n${outlineSummary}\n请先理解现有结构，再根据作者的要求提出具体、可执行的调整建议。涉及写入时使用工具并等待用户确认。`,
      },
      'outline'
    )
  }

  if (outlineCenterMode === 'planning') {
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
      title={hasOutlines ? '选择大纲节点' : '开始规划故事'}
      description={
        hasOutlines
          ? '在左侧大纲树中选择节点查看详情，或让 AI 协助调整整本大纲。'
          : '你可以先手动创建节点，也可以让 AI 根据故事核心规划章节结构。'
      }
      actions={
        <>
          <Button
            variant="outline"
            onClick={() =>
              openOutlineEdit({ editingOutline: null, defaultType: 'volume' })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            新建节点
          </Button>
          <Button onClick={hasOutlines ? openOutlineCollaboration : openOutlinePlanning}>
            <Sparkles className="mr-2 h-4 w-4" />
            {hasOutlines ? 'AI 协作调整' : '开始规划'}
          </Button>
        </>
      }
    />
  )
}
