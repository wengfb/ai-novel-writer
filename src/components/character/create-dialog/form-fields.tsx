'use client'

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
import type { CharacterFormData } from './types'

interface CharacterFormFieldsProps {
  formData: CharacterFormData
  setFormData: React.Dispatch<React.SetStateAction<CharacterFormData>>
  /** 按分区渲染，便于详情页分组；不传则全部渲染 */
  section?: 'basic' | 'profile' | 'all'
}

/** 角色创建/编辑表单字段 */
export function CharacterFormFields({
  formData,
  setFormData,
  section = 'all',
}: CharacterFormFieldsProps) {
  const showBasic = section === 'all' || section === 'basic'
  const showProfile = section === 'all' || section === 'profile'

  return (
    <>
      {showBasic && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <Label htmlFor="role">角色类型</Label>
              <Select
                value={formData.role}
                onValueChange={(value: CharacterFormData['role']) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger id="role">
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
        </>
      )}

      {showProfile && (
        <>
          <div className="space-y-2">
            <Label htmlFor="appearance">外貌描述</Label>
            <Textarea
              id="appearance"
              value={formData.appearance}
              onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
              placeholder="描述角色的外貌特征..."
              rows={4}
              className="resize-y min-h-[96px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="personality">性格特点</Label>
            <Textarea
              id="personality"
              value={formData.personality}
              onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
              placeholder="描述角色的性格特点..."
              rows={4}
              className="resize-y min-h-[96px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="backstory">背景故事</Label>
            <Textarea
              id="backstory"
              value={formData.backstory}
              onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
              placeholder="描述角色的背景故事..."
              rows={4}
              className="resize-y min-h-[96px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivation">角色动机</Label>
            <Textarea
              id="motivation"
              value={formData.motivation}
              onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
              placeholder="描述角色的动机和目标..."
              rows={3}
              className="resize-y min-h-[80px]"
            />
          </div>
        </>
      )}
    </>
  )
}
