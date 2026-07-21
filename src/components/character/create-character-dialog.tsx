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
import { useCharacterStore, type Character } from '@/lib/store/character-store'
import { toast } from 'sonner'
import {
  createDefaultCharacterForm,
  type CharacterFormData,
} from './create-dialog/types'
import { CharacterFormFields } from './create-dialog/form-fields'

interface CreateCharacterDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCharacter?: Character | null
}

export function CreateCharacterDialog({
  projectId,
  open,
  onOpenChange,
  editingCharacter,
}: CreateCharacterDialogProps) {
  const { createCharacter, updateCharacter, deleteCharacter } = useCharacterStore()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const isEditing = !!editingCharacter
  const [formData, setFormData] = React.useState<CharacterFormData>(createDefaultCharacterForm)

  const resetForm = () => setFormData(createDefaultCharacterForm())

  React.useEffect(() => {
    if (editingCharacter) {
      setFormData({
        name: editingCharacter.name,
        nickname: editingCharacter.nickname || '',
        age: editingCharacter.age ? String(editingCharacter.age) : '',
        gender: editingCharacter.gender || '',
        role: editingCharacter.role,
        importance: String(editingCharacter.importance),
        appearance: editingCharacter.appearance || '',
        personality: editingCharacter.personality || '',
        backstory: editingCharacter.backstory || '',
        motivation: '',
      })
    } else {
      resetForm()
    }
  }, [editingCharacter, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('请输入角色名称')
      return
    }

    setIsSubmitting(true)
    try {
      if (isEditing && editingCharacter) {
        await updateCharacter(editingCharacter.id, {
          name: formData.name.trim(),
          nickname: formData.nickname.trim() || null,
          age: formData.age ? parseInt(formData.age) : null,
          gender: formData.gender.trim() || null,
          role: formData.role,
          importance: parseInt(formData.importance),
          appearance: formData.appearance.trim() || null,
          personality: formData.personality.trim() || null,
          backstory: formData.backstory.trim() || null,
        })
        toast.success('角色更新成功')
      } else {
        await createCharacter({
          projectId,
          name: formData.name.trim(),
          nickname: formData.nickname.trim() || undefined,
          age: formData.age ? parseInt(formData.age) : undefined,
          gender: formData.gender.trim() || undefined,
          role: formData.role,
          importance: parseInt(formData.importance),
          appearance: formData.appearance.trim() || undefined,
          personality: formData.personality.trim() || undefined,
          backstory: formData.backstory.trim() || undefined,
        })
        toast.success('角色创建成功')
      }

      resetForm()
      onOpenChange(false)
    } catch {
      toast.error(isEditing ? '更新角色失败' : '创建角色失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!editingCharacter) return

    setIsDeleting(true)
    try {
      await deleteCharacter(editingCharacter.id)
      toast.success('角色删除成功')
      onOpenChange(false)
    } catch {
      toast.error('删除角色失败')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑角色' : '创建角色'}</DialogTitle>
          <DialogDescription>
            {isEditing ? '修改角色信息' : '添加新的角色到你的小说项目中'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <CharacterFormFields formData={formData} setFormData={setFormData} />

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
                {isSubmitting ? '保存中...' : isEditing ? '保存修改' : '创建角色'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
