'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useWorldStore, type WorldElement } from '@/lib/store/world-store'
import { toast } from 'sonner'
import { Box, Loader2 } from 'lucide-react'
import { DetailSection, DetailWorkspace } from '@/components/studio/detail-workspace'

interface WorldEditPanelProps {
  projectId: string
  element?: WorldElement | null
  onClose?: () => void
  onSaved?: () => void
}

const TYPE_LABEL: Record<string, string> = {
  location: '地点',
  history: '历史',
  magic: '魔法体系',
  organization: '组织',
  item: '物品',
  other: '其他',
  concept: '概念',
  system: '体系',
}

/** 世界观详情/编辑 — 中间区工作页 */
export function WorldEditPanel({
  projectId,
  element,
  onClose,
  onSaved,
}: WorldEditPanelProps) {
  const { createWorldElement, updateWorldElement, deleteWorldElement } = useWorldStore()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const isEditing = !!element

  const [formData, setFormData] = React.useState({
    name: '',
    type: 'location' as 'location' | 'organization' | 'item' | 'other' | 'concept',
    description: '',
    importance: '5',
    scope: 'local' as 'global' | 'regional' | 'local',
    category: 'detail' as 'core_rule' | 'detail' | 'background',
  })

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'location',
      description: '',
      importance: '5',
      scope: 'local',
      category: 'detail',
    })
  }

  React.useEffect(() => {
    if (element) {
      setFormData({
        name: element.name,
        type: element.type as typeof formData.type,
        description: element.description,
        importance: String(element.importance),
        scope: element.scope,
        category: 'detail',
      })
    } else {
      resetForm()
    }
  }, [element])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!formData.name.trim()) {
      toast.error('请输入名称')
      return
    }

    if (!formData.description.trim()) {
      toast.error('请输入描述')
      return
    }

    setIsSubmitting(true)
    try {
      if (isEditing && element) {
        await updateWorldElement(element.id, {
          name: formData.name.trim(),
          type: formData.type,
          description: formData.description.trim(),
          importance: parseInt(formData.importance),
          scope: formData.scope,
        })
        toast.success('世界观元素更新成功')
      } else {
        await createWorldElement({
          projectId,
          name: formData.name.trim(),
          type: formData.type,
          description: formData.description.trim(),
          importance: parseInt(formData.importance),
          scope: formData.scope,
        })
        toast.success('世界观元素创建成功')
      }

      onSaved?.()
      onClose?.()
    } catch {
      toast.error(isEditing ? '更新世界观元素失败' : '创建世界观元素失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!element) return

    setIsDeleting(true)
    try {
      await deleteWorldElement(element.id)
      toast.success('世界观元素删除成功')
      onSaved?.()
      onClose?.()
    } catch {
      toast.error('删除世界观元素失败')
    } finally {
      setIsDeleting(false)
    }
  }

  const title = isEditing
    ? formData.name.trim() || element?.name || '世界观详情'
    : '新建世界观'

  return (
    <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
      <DetailWorkspace
        title={title}
        description={
          isEditing
            ? '编辑设定细节，保持与正文世界观一致'
            : '补充地点、体系或设定条目，保存后出现在左侧列表'
        }
        icon={Box}
        badges={
          isEditing
            ? [TYPE_LABEL[formData.type] || formData.type]
            : undefined
        }
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
          <DetailSection title="基本信息" description="名称、类型与分类">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：天元大陆"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">类型</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: typeof formData.type) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="location">地点</SelectItem>
                    <SelectItem value="history">历史</SelectItem>
                    <SelectItem value="magic">魔法体系</SelectItem>
                    <SelectItem value="organization">组织</SelectItem>
                    <SelectItem value="item">物品</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="importance">重要性 (1-10)</Label>
                <Input
                  id="importance"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.importance}
                  onChange={(e) => setFormData({ ...formData, importance: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scope">作用范围</Label>
                <Select
                  value={formData.scope}
                  onValueChange={(value: typeof formData.scope) =>
                    setFormData({ ...formData, scope: value })
                  }
                >
                  <SelectTrigger id="scope">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">全局</SelectItem>
                    <SelectItem value="regional">区域</SelectItem>
                    <SelectItem value="local">局部</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">分类</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: typeof formData.category) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="core_rule">核心规则</SelectItem>
                    <SelectItem value="detail">细节</SelectItem>
                    <SelectItem value="background">背景</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DetailSection>

          <DetailSection title="设定描述" description="给 AI 与后续写作引用的详细说明">
            <div className="space-y-2">
              <Label htmlFor="description">描述 *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="描述这个世界观元素的详细信息、规则与边界..."
                rows={10}
                className="min-h-[200px] resize-y"
                required
              />
            </div>
          </DetailSection>
        </div>
      </DetailWorkspace>
    </form>
  )
}
