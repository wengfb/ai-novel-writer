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
import { useCharacterStore } from '@/lib/store/character-store'
import { toast } from 'sonner'

interface CreateCharacterDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateCharacterDialog({
  projectId,
  open,
  onOpenChange,
}: CreateCharacterDialogProps) {
  const { createCharacter } = useCharacterStore()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // 表单状态
  const [formData, setFormData] = React.useState({
    name: '',
    nickname: '',
    age: '',
    gender: '',
    role: 'supporting' as 'protagonist' | 'antagonist' | 'supporting' | 'minor',
    importance: '5',
    appearance: '',
    personality: '',
    backstory: '',
    motivation: '',
  })

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      nickname: '',
      age: '',
      gender: '',
      role: 'supporting',
      importance: '5',
      appearance: '',
      personality: '',
      backstory: '',
      motivation: '',
    })
  }

  // 处理提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('请输入角色名称')
      return
    }

    setIsSubmitting(true)
    try {
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
        motivation: formData.motivation.trim() || undefined,
      })

      toast.success('角色创建成功')
      resetForm()
      onOpenChange(false)
    } catch (error) {
      toast.error('创建角色失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建角色</DialogTitle>
          <DialogDescription>
            添加新的角色到你的小说项目中
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">角色名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：林轩"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">昵称</Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="例如：剑圣"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">年龄</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="例如：25"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">性别</Label>
              <Input
                id="gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                placeholder="例如：男"
              />
            </div>

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
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">角色类型</Label>
            <Select
              value={formData.role}
              onValueChange={(value: any) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="protagonist">主角</SelectItem>
                <SelectItem value="antagonist">反派</SelectItem>
                <SelectItem value="supporting">配角</SelectItem>
                <SelectItem value="minor">次要角色</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 外貌描述 */}
          <div className="space-y-2">
            <Label htmlFor="appearance">外貌描述</Label>
            <Textarea
              id="appearance"
              value={formData.appearance}
              onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
              placeholder="描述角色的外貌特征..."
              rows={3}
            />
          </div>

          {/* 性格特点 */}
          <div className="space-y-2">
            <Label htmlFor="personality">性格特点</Label>
            <Textarea
              id="personality"
              value={formData.personality}
              onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
              placeholder="描述角色的性格特点..."
              rows={3}
            />
          </div>

          {/* 背景故事 */}
          <div className="space-y-2">
            <Label htmlFor="backstory">背景故事</Label>
            <Textarea
              id="backstory"
              value={formData.backstory}
              onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
              placeholder="描述角色的背景故事..."
              rows={3}
            />
          </div>

          {/* 动机 */}
          <div className="space-y-2">
            <Label htmlFor="motivation">角色动机</Label>
            <Textarea
              id="motivation"
              value={formData.motivation}
              onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
              placeholder="描述角色的动机和目标..."
              rows={3}
            />
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
              {isSubmitting ? '创建中...' : '创建角色'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
