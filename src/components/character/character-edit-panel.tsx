'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { useCharacterStore, type Character } from '@/lib/store/character-store'
import { toast } from 'sonner'
import {
  createDefaultCharacterForm,
  type CharacterFormData,
} from './create-dialog/types'
import { CharacterFormFields } from './create-dialog/form-fields'
import { Loader2, User } from 'lucide-react'
import { DetailSection, DetailWorkspace } from '@/components/studio/detail-workspace'

interface CharacterEditPanelProps {
  projectId: string
  character?: Character | null
  onClose?: () => void
  onSaved?: () => void
}

const ROLE_LABEL: Record<string, string> = {
  protagonist: '主角',
  antagonist: '反派',
  supporting: '配角',
  minor: '次要',
}

/** 角色详情/编辑 — 中间区工作页 */
export function CharacterEditPanel({
  projectId,
  character,
  onClose,
  onSaved,
}: CharacterEditPanelProps) {
  const { createCharacter, updateCharacter, deleteCharacter } = useCharacterStore()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const isEditing = !!character
  const [formData, setFormData] = React.useState<CharacterFormData>(createDefaultCharacterForm)

  const resetForm = () => setFormData(createDefaultCharacterForm())

  React.useEffect(() => {
    if (character) {
      setFormData({
        name: character.name,
        nickname: character.nickname || '',
        age: character.age ? String(character.age) : '',
        gender: character.gender || '',
        role: character.role,
        importance: String(character.importance),
        appearance: character.appearance || '',
        personality: character.personality || '',
        backstory: character.backstory || '',
        motivation: '',
      })
    } else {
      resetForm()
    }
  }, [character])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!formData.name.trim()) {
      toast.error('请输入角色名称')
      return
    }

    setIsSubmitting(true)
    try {
      if (isEditing && character) {
        await updateCharacter(character.id, {
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

      onSaved?.()
      onClose?.()
    } catch {
      toast.error(isEditing ? '更新角色失败' : '创建角色失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!character) return

    setIsDeleting(true)
    try {
      await deleteCharacter(character.id)
      toast.success('角色删除成功')
      onSaved?.()
      onClose?.()
    } catch {
      toast.error('删除角色失败')
    } finally {
      setIsDeleting(false)
    }
  }

  const title = isEditing
    ? formData.name.trim() || character?.name || '角色详情'
    : '新建角色'

  return (
    <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
      <DetailWorkspace
        title={title}
        description={
          isEditing
            ? '在中间区编辑角色设定，保存后立即生效'
            : '填写基础信息与人设，保存后会出现在左侧列表'
        }
        icon={User}
        badges={isEditing ? [ROLE_LABEL[formData.role] || formData.role] : undefined}
        onBack={onClose}
        dangerAction={
          isEditing ? (
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleDelete}
              disabled={isSubmitting || isDeleting}
            >
              {isDeleting ? '删除中...' : '删除'}
            </Button>
          ) : null
        }
        actions={
          <>
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                取消
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? '保存中...' : isEditing ? '保存' : '创建'}
            </Button>
          </>
        }
      >
        <div className="space-y-8">
          <DetailSection title="基本信息" description="名称、类型与重要程度">
            <CharacterFormFields
              formData={formData}
              setFormData={setFormData}
              section="basic"
            />
          </DetailSection>
          <DetailSection title="人设描写" description="外貌、性格、背景与动机">
            <CharacterFormFields
              formData={formData}
              setFormData={setFormData}
              section="profile"
            />
          </DetailSection>
        </div>
      </DetailWorkspace>
    </form>
  )
}
