'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { useOutlineStore } from '@/lib/store/outline-store'
import { useUIStore } from '@/lib/store/ui-store'
import { useOutlines } from '@/hooks/use-outlines'
import { toast } from 'sonner'
import type { Outline } from '@/lib/store/outline-store'
import { createDefaultOutlineForm, type OutlineFormData } from './outline-form/types'
import { OutlineBasicFields } from './outline-form/basic-fields'
import { OutlineIntentFields } from './outline-form/intent-fields'
import { OutlinePlanningFields } from './outline-form/planning-fields'
import { LayoutTemplate, Loader2, Sparkles } from 'lucide-react'
import { DetailSection, DetailWorkspace } from '@/components/studio/detail-workspace'
import { OutlineNodeCoCreation } from './outline-node-co-creation'
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

interface OutlineEditPanelProps {
  projectId: string
  editingOutline?: Outline | null
  parentId?: string | null
  defaultType?: 'volume' | 'chapter' | 'scene'
  onClose?: () => void
  onSaved?: () => void
}

type OutlineDraftUpdate = Partial<Pick<
  OutlineFormData,
  'type' | 'title' | 'description' | 'emotionalGoal' | 'plotFunction'
>> & {
  targetWords?: number
  tensionLevel?: number
}

function isOutlineDraftResult(result: unknown): result is { draft: OutlineDraftUpdate } {
  return typeof result === 'object' && result !== null &&
    'draft' in result && typeof result.draft === 'object' && result.draft !== null
}

/** 大纲节点创建/编辑 — 与角色/世界观统一的中间区工作页。 */
export function OutlineEditPanel({
  projectId,
  editingOutline,
  parentId,
  defaultType = 'volume',
  onClose,
  onSaved,
}: OutlineEditPanelProps) {
  const { createOutline, updateOutline, deleteOutline } = useOutlineStore()
  const { openAssistantForScope, setOutlineNodeCoCreating } = useUIStore()
  const { flatOutlines } = useOutlines(projectId)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isCoCreating, setIsCoCreating] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  const isEditing = !!editingOutline
  const [formData, setFormData] = React.useState<OutlineFormData>(() =>
    createDefaultOutlineForm({ defaultType, parentId })
  )

  const resetForm = React.useCallback(() => {
    setFormData(createDefaultOutlineForm({ defaultType, parentId }))
  }, [defaultType, parentId])

  React.useEffect(() => {
    if (editingOutline) {
      setFormData({
        type: editingOutline.type,
        parentId: editingOutline.parentId || '__none__',
        order: String(editingOutline.order),
        title: editingOutline.title,
        description: editingOutline.description || '',
        targetWords: editingOutline.targetWords ? String(editingOutline.targetWords) : '',
        planningMode: editingOutline.planningMode,
        planningRange: editingOutline.planningRange ? String(editingOutline.planningRange) : '',
        isFlexible: editingOutline.isFlexible,
        confidence: [editingOutline.confidence],
        emotionalGoal: editingOutline.emotionalGoal || '',
        plotFunction: editingOutline.plotFunction || '推进',
        tensionLevel: [editingOutline.tensionLevel || 5],
      })
    } else {
      resetForm()
    }
  }, [editingOutline, resetForm])

  const handleDraftToolCall = React.useCallback((toolName: string, result: unknown) => {
    if (toolName !== 'updateOutlineDraft' || !isOutlineDraftResult(result)) return

    const { draft } = result
    setFormData((current) => ({
      ...current,
      ...draft,
      targetWords: draft.targetWords ? String(draft.targetWords) : current.targetWords,
      tensionLevel: draft.tensionLevel ? [draft.tensionLevel] : current.tensionLevel,
    }))
  }, [])

  const openCoCreation = () => {
    setOutlineNodeCoCreating(true)
    setIsCoCreating(true)
  }

  const closeCoCreation = () => {
    setIsCoCreating(false)
    setOutlineNodeCoCreating(false)
  }

  React.useEffect(() => () => {
    setOutlineNodeCoCreating(false)
  }, [setOutlineNodeCoCreating])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('请输入标题')
      return
    }

    setIsSubmitting(true)
    try {
      if (isEditing && editingOutline) {
        await updateOutline(editingOutline.id, {
          type: formData.type,
          parentId: formData.parentId === '__none__' ? null : formData.parentId || null,
          order: parseInt(formData.order),
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          targetWords: formData.targetWords ? parseInt(formData.targetWords) : null,
          planningMode: formData.planningMode,
          planningRange: formData.planningRange ? parseInt(formData.planningRange) : null,
          isFlexible: formData.isFlexible,
          confidence: formData.confidence[0],
          emotionalGoal: formData.emotionalGoal.trim() || undefined,
          plotFunction: formData.plotFunction,
          tensionLevel: formData.tensionLevel[0],
        })
        toast.success('大纲更新成功')
      } else {
        await createOutline({
          projectId,
          type: formData.type,
          parentId: formData.parentId === '__none__' ? undefined : formData.parentId || undefined,
          order: parseInt(formData.order),
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          targetWords: formData.targetWords ? parseInt(formData.targetWords) : undefined,
          planningMode: formData.planningMode,
          planningRange: formData.planningRange ? parseInt(formData.planningRange) : undefined,
          isFlexible: formData.isFlexible,
          confidence: formData.confidence[0],
          emotionalGoal: formData.emotionalGoal.trim() || undefined,
          plotFunction: formData.plotFunction,
          tensionLevel: formData.tensionLevel[0],
        })
        toast.success('大纲创建成功')
      }

      resetForm()
      onSaved?.()
      onClose?.()
    } catch {
      toast.error(isEditing ? '更新大纲失败' : '创建大纲失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!editingOutline) return

    setIsDeleting(true)
    try {
      await deleteOutline(editingOutline.id)
      toast.success('大纲删除成功')
      setDeleteDialogOpen(false)
      onSaved?.()
      onClose?.()
    } catch {
      toast.error('删除大纲失败')
    } finally {
      setIsDeleting(false)
    }
  }

  const getAvailableParents = () => {
    if (!isEditing || !editingOutline) return flatOutlines

    const getDescendantIds = (node: Outline): string[] => {
      const ids = [node.id]
      node.children?.forEach((child) => ids.push(...getDescendantIds(child)))
      return ids
    }

    const descendantIds = getDescendantIds(editingOutline)
    return flatOutlines.filter((outline) => !descendantIds.includes(outline.id))
  }

  const availableParents = getAvailableParents()
  const typeLabel = formData.type === 'volume' ? '卷' : formData.type === 'scene' ? '场景' : '章'
  const pageTitle = isEditing ? formData.title.trim() || editingOutline?.title || '大纲详情' : '新建大纲节点'

  if (!isEditing && isCoCreating) {
    return (
      <OutlineNodeCoCreation
        projectId={projectId}
        draft={formData}
        onDraftToolCall={handleDraftToolCall}
        onExit={closeCoCreation}
      />
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <form id="outline-edit-form" onSubmit={handleSubmit} />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除大纲节点</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{editingOutline?.title || pageTitle}」吗？
              若该节点下有子节点，将一并删除且不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
              disabled={isDeleting}
            >
              {isDeleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <DetailWorkspace
        title={pageTitle}
        description={isEditing ? '调整节点结构、叙事意图与规划参数，保存后左侧树同步更新' : '创建卷 / 章 / 场景节点，并挂到合适的父级下'}
        icon={LayoutTemplate}
        badges={[typeLabel]}
        onBack={onClose}
        dangerAction={isEditing ? (
          <Button
            type="button"
            variant="outline"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isSubmitting || isDeleting}
          >
            {isDeleting ? '删除中...' : '删除'}
          </Button>
        ) : null}
        actions={
          <>
            {isEditing && editingOutline ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => openAssistantForScope({
                  type: 'outline',
                  id: editingOutline.id,
                  title: editingOutline.title,
                  subtitle: '剧情大纲',
                  contextAppend: `\n当前正在协作的大纲节点：${editingOutline.title}\n节点描述：${editingOutline.description || '未填写'}\n请围绕这个节点的节奏、因果与伏笔提供建议。`,
                }, 'outline')}
              >
                AI 优化此节点
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={openCoCreation}>
                <Sparkles className="mr-2 h-4 w-4" />
                AI 协助创建
              </Button>
            )}
            {onClose && <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>取消</Button>}
            <Button type="submit" form="outline-edit-form" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? '保存中...' : isEditing ? '保存' : '创建'}
            </Button>
          </>
        }
      >
        <div className="space-y-8">
          <DetailSection title="节点结构" description="类型、排序、标题、父级与目标字数">
            <OutlineBasicFields formData={formData} setFormData={setFormData} availableParents={availableParents} />
          </DetailSection>
          <DetailSection title="叙事意图" description="作为 AI 生成章节时的 prompt 约束">
            <OutlineIntentFields formData={formData} setFormData={setFormData} />
          </DetailSection>
          <DetailSection title="规划参数" description="规划模式、弹性范围与置信度">
            <OutlinePlanningFields formData={formData} setFormData={setFormData} />
          </DetailSection>
        </div>
      </DetailWorkspace>
    </div>
  )
}
