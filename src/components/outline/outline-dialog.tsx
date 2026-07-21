'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useOutlineStore } from '@/lib/store/outline-store'
import { useOutlines } from '@/hooks/use-outlines'
import { toast } from 'sonner'
import type { Outline } from '@/lib/store/outline-store'
import { createDefaultOutlineForm, type OutlineFormData } from './outline-dialog/types'
import { OutlineBasicFields } from './outline-dialog/basic-fields'
import { OutlineIntentFields } from './outline-dialog/intent-fields'
import { OutlinePlanningFields } from './outline-dialog/planning-fields'

interface OutlineDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  editingOutline?: Outline | null
  parentId?: string | null
  defaultType?: 'volume' | 'chapter' | 'scene'
}

export function OutlineDialog({
  projectId,
  open,
  onOpenChange,
  editingOutline,
  parentId,
  defaultType = 'chapter',
}: OutlineDialogProps) {
  const { createOutline, updateOutline, deleteOutline } = useOutlineStore()
  const { flatOutlines } = useOutlines(projectId)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const isEditing = !!editingOutline
  const [formData, setFormData] = React.useState<OutlineFormData>(() =>
    createDefaultOutlineForm({ defaultType, parentId })
  )

  const resetForm = () => {
    setFormData(createDefaultOutlineForm({ defaultType, parentId }))
  }

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
  }, [editingOutline, open, defaultType, parentId])

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
      onOpenChange(false)
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
      onOpenChange(false)
    } catch {
      toast.error('删除大纲失败')
    } finally {
      setIsDeleting(false)
    }
  }

  const getAvailableParents = () => {
    if (!isEditing || !editingOutline) {
      return flatOutlines
    }

    const getDescendantIds = (node: Outline): string[] => {
      const ids = [node.id]
      if (node.children) {
        node.children.forEach((child) => {
          ids.push(...getDescendantIds(child))
        })
      }
      return ids
    }

    const descendantIds = getDescendantIds(editingOutline)
    return flatOutlines.filter((outline) => !descendantIds.includes(outline.id))
  }

  const availableParents = getAvailableParents()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑大纲' : '创建大纲'}</DialogTitle>
          <DialogDescription>
            {isEditing ? '修改大纲节点信息' : '添加新的大纲节点到你的小说项目中'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <OutlineBasicFields
            formData={formData}
            setFormData={setFormData}
            availableParents={availableParents}
          />
          <OutlineIntentFields formData={formData} setFormData={setFormData} />
          <OutlinePlanningFields formData={formData} setFormData={setFormData} />

          <DialogFooter className="flex justify-between">
            <div>
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSubmitting || isDeleting}
                >
                  {isDeleting ? '删除中...' : '删除'}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '保存中...' : isEditing ? '保存修改' : '创建大纲'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
