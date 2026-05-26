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
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { useOutlineStore } from '@/lib/store/outline-store'
import { useOutlines } from '@/hooks/use-outlines'
import { toast } from 'sonner'
import type { Outline } from '@/lib/store/outline-store'

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

  // 表单状态
  const [formData, setFormData] = React.useState({
    type: defaultType,
    parentId: parentId || '__none__',
    order: '1',
    title: '',
    description: '',
    targetWords: '',
    planningMode: 'full' as 'full' | 'progressive',
    planningRange: '',
    isFlexible: false,
    confidence: [5],
    emotionalGoal: '',
    plotFunction: '推进' as '推进' | '转折' | '铺垫' | '高潮' | '过渡',
    tensionLevel: [5],
  })

  // 重置表单
  const resetForm = () => {
    setFormData({
      type: defaultType,
      parentId: parentId || '__none__',
      order: '1',
      title: '',
      description: '',
      targetWords: '',
      planningMode: 'full',
      planningRange: '',
      isFlexible: false,
      confidence: [5],
      emotionalGoal: '',
      plotFunction: '推进',
      tensionLevel: [5],
    })
  }

  // 当编辑或打开对话框时，填充表单
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

  // 处理提交
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
          type: formData.type as 'volume' | 'chapter' | 'scene',
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
          type: formData.type as 'volume' | 'chapter' | 'scene',
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
    } catch (error) {
      toast.error(isEditing ? '更新大纲失败' : '创建大纲失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理删除
  const handleDelete = async () => {
    if (!editingOutline) return

    setIsDeleting(true)
    try {
      await deleteOutline(editingOutline.id)
      toast.success('大纲删除成功')
      onOpenChange(false)
    } catch (error) {
      toast.error('删除大纲失败')
    } finally {
      setIsDeleting(false)
    }
  }

  // 过滤可选的父节点（不能选择自己或自己的子孙节点）
  const getAvailableParents = () => {
    if (!isEditing || !editingOutline) {
      return flatOutlines
    }

    // 获取所有子孙节点 ID
    const getDescendantIds = (node: Outline): string[] => {
      const ids = [node.id]
      if (node.children) {
        node.children.forEach(child => {
          ids.push(...getDescendantIds(child))
        })
      }
      return ids
    }

    const descendantIds = getDescendantIds(editingOutline)

    return flatOutlines.filter(outline => !descendantIds.includes(outline.id))
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
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">节点类型 *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="volume">卷</SelectItem>
                  <SelectItem value="chapter">章</SelectItem>
                  <SelectItem value="scene">场景</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">排序</Label>
              <Input
                id="order"
                type="number"
                min="0"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">标题 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="例如：第一章 - 开始"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentId">父节点</Label>
            <Select
              value={formData.parentId}
              onValueChange={(value) => setFormData({ ...formData, parentId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="无父节点（顶级节点）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">无父节点（顶级节点）</SelectItem>
                {availableParents.map((outline) => (
                  <SelectItem key={outline.id} value={outline.id}>
                    {outline.type === 'volume' ? '卷' : outline.type === 'chapter' ? '章' : '场景'} - {outline.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="描述此大纲节点的内容..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetWords">目标字数</Label>
            <Input
              id="targetWords"
              type="number"
              min="0"
              value={formData.targetWords}
              onChange={(e) => setFormData({ ...formData, targetWords: e.target.value })}
              placeholder="例如：3000"
            />
          </div>

          {/* 结构化创作意图 */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-medium">结构化创作意图</h3>
            <p className="text-xs text-muted-foreground">
              这些设置将作为 AI 生成章节时的 prompt 约束
            </p>

            <div className="space-y-2">
              <Label htmlFor="emotionalGoal">情感目标</Label>
              <Textarea
                id="emotionalGoal"
                value={formData.emotionalGoal}
                onChange={(e) => setFormData({ ...formData, emotionalGoal: e.target.value })}
                placeholder="例如：让读者为角色的命运感到揪心、营造温暖治愈的氛围..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plotFunction">情节功能</Label>
              <Select
                value={formData.plotFunction}
                onValueChange={(value: any) => setFormData({ ...formData, plotFunction: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="推进">推进 - 推动主线剧情向前发展</SelectItem>
                  <SelectItem value="转折">转折 - 形成剧情拐点或意外发展</SelectItem>
                  <SelectItem value="铺垫">铺垫 - 为后续关键剧情做伏笔铺垫</SelectItem>
                  <SelectItem value="高潮">高潮 - 营造紧张激烈的剧情高潮</SelectItem>
                  <SelectItem value="过渡">过渡 - 衔接上下文，节奏缓冲</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="tensionLevel">张力等级: {formData.tensionLevel[0]}</Label>
                <span className="text-xs text-muted-foreground">
                  {formData.tensionLevel[0] <= 3 ? '舒缓' : formData.tensionLevel[0] <= 5 ? '适中' : formData.tensionLevel[0] <= 7 ? '紧张' : '极高'}
                </span>
              </div>
              <Slider
                id="tensionLevel"
                min={1}
                max={10}
                step={1}
                value={formData.tensionLevel}
                onValueChange={(value) => setFormData({ ...formData, tensionLevel: value })}
                className="w-full"
              />
            </div>
          </div>

          {/* 渐进式规划选项 */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-medium">渐进式规划选项</h3>

            <div className="space-y-2">
              <Label htmlFor="planningMode">规划模式</Label>
              <Select
                value={formData.planningMode}
                onValueChange={(value: any) => setFormData({ ...formData, planningMode: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">完整规划</SelectItem>
                  <SelectItem value="progressive">渐进式规划</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.planningMode === 'progressive' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="planningRange">规划范围（章节数）</Label>
                  <Input
                    id="planningRange"
                    type="number"
                    min="1"
                    value={formData.planningRange}
                    onChange={(e) => setFormData({ ...formData, planningRange: e.target.value })}
                    placeholder="例如：5"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isFlexible">灵活调整</Label>
                    <p className="text-xs text-muted-foreground">
                      允许根据实际写作情况调整规划
                    </p>
                  </div>
                  <Switch
                    id="isFlexible"
                    checked={formData.isFlexible}
                    onCheckedChange={(checked) => setFormData({ ...formData, isFlexible: checked })}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="confidence">置信度: {formData.confidence[0]}</Label>
                <span className="text-xs text-muted-foreground">
                  {formData.confidence[0] <= 3 ? '低' : formData.confidence[0] <= 7 ? '中' : '高'}
                </span>
              </div>
              <Slider
                id="confidence"
                min={1}
                max={10}
                step={1}
                value={formData.confidence}
                onValueChange={(value) => setFormData({ ...formData, confidence: value })}
                className="w-full"
              />
            </div>
          </div>

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
