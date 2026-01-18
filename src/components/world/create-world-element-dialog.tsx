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
import { useWorldStore } from '@/lib/store/world-store'
import { toast } from 'sonner'

interface CreateWorldElementDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateWorldElementDialog({
  projectId,
  open,
  onOpenChange,
}: CreateWorldElementDialogProps) {
  const { createWorldElement } = useWorldStore()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // 表单状态
  const [formData, setFormData] = React.useState({
    name: '',
    type: 'location' as 'location' | 'organization' | 'item' | 'other' | 'concept',
    description: '',
    importance: '5',
    scope: 'local' as 'global' | 'regional' | 'local',
    category: 'detail' as 'core_rule' | 'detail' | 'background',
  })

  // 重置表单
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

  // 处理提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
      await createWorldElement({
        projectId,
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description.trim(),
        importance: parseInt(formData.importance),
        scope: formData.scope,
      })

      toast.success('世界观元素创建成功')
      resetForm()
      onOpenChange(false)
    } catch (error) {
      toast.error('创建世界观元素失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建世界观元素</DialogTitle>
          <DialogDescription>
            添加新的世界观元素到你的小说项目中
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
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
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
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

          {/* 描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">描述 *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="描述这个世界观元素的详细信息..."
              rows={4}
              required
            />
          </div>

          {/* 配置选项 */}
          <div className="grid grid-cols-3 gap-4">
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
                onValueChange={(value: any) => setFormData({ ...formData, scope: value })}
              >
                <SelectTrigger>
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
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '创建中...' : '创建世界观元素'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
