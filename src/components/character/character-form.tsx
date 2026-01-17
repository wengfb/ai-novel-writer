'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { Character } from '@/lib/generated/prisma/client'

interface CharacterFormProps {
  projectId: string
  isEditing: boolean
  initialData?: Character
}

const genderOptions = [
  { value: '男', label: '男' },
  { value: '女', label: '女' },
  { value: '其他', label: '其他' },
]

export function CharacterForm({ projectId, isEditing, initialData }: CharacterFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    nickname: initialData?.nickname || '',
    age: initialData?.age?.toString() || '',
    gender: initialData?.gender || '',
    appearance: initialData?.appearance || '',
    personality: initialData?.personality || '',
    backstory: initialData?.backstory || '',
    motivation: initialData?.motivation || '',
    dialogueStyle: initialData?.dialogueStyle || '',
    characterArc: initialData?.characterArc || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = isEditing
        ? `/api/characters/${initialData?.id}`
        : `/api/projects/${projectId}/characters`

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          nickname: formData.nickname || undefined,
          age: formData.age ? parseInt(formData.age) : undefined,
          gender: formData.gender || undefined,
          appearance: formData.appearance || undefined,
          personality: formData.personality || undefined,
          backstory: formData.backstory || undefined,
          motivation: formData.motivation || undefined,
          dialogueStyle: formData.dialogueStyle || undefined,
          characterArc: formData.characterArc || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/projects/${projectId}?tab=characters`)
        router.refresh()
      } else {
        alert(data.error || '保存失败')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('保存角色失败:', error)
      alert('保存失败')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基础信息 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">基础信息</h3>

        {/* 姓名 */}
        <div className="space-y-2">
          <Label htmlFor="name">角色姓名 *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="输入角色姓名"
            required
            disabled={isLoading}
            maxLength={100}
          />
        </div>

        {/* 昵称 */}
        <div className="space-y-2">
          <Label htmlFor="nickname">昵称/别名</Label>
          <Input
            id="nickname"
            value={formData.nickname}
            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            placeholder="角色的昵称或别名"
            disabled={isLoading}
            maxLength={50}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* 年龄 */}
          <div className="space-y-2">
            <Label htmlFor="age">年龄</Label>
            <Input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="角色年龄"
              disabled={isLoading}
              min={0}
            />
          </div>

          {/* 性别 */}
          <div className="space-y-2">
            <Label htmlFor="gender">性别</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => setFormData({ ...formData, gender: value })}
            >
              <SelectTrigger disabled={isLoading}>
                <SelectValue placeholder="选择性别" />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 外貌描述 */}
      <div className="space-y-2">
        <Label htmlFor="appearance">外貌描述</Label>
        <Textarea
          id="appearance"
          value={formData.appearance}
          onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
          placeholder="描述角色的外貌特征、穿着打扮等"
          rows={4}
          disabled={isLoading}
        />
      </div>

      {/* 性格特点 */}
      <div className="space-y-2">
        <Label htmlFor="personality">性格特点</Label>
        <Textarea
          id="personality"
          value={formData.personality}
          onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
          placeholder="描述角色的性格特征、行为习惯等"
          rows={4}
          disabled={isLoading}
        />
      </div>

      {/* 背景故事 */}
      <div className="space-y-2">
        <Label htmlFor="backstory">背景故事</Label>
        <Textarea
          id="backstory"
          value={formData.backstory}
          onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
          placeholder="角色的成长经历、过往故事等"
          rows={5}
          disabled={isLoading}
        />
      </div>

      {/* 角色动机 */}
      <div className="space-y-2">
        <Label htmlFor="motivation">角色动机</Label>
        <Textarea
          id="motivation"
          value={formData.motivation}
          onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
          placeholder="角色的目标、追求、内心驱动力等"
          rows={3}
          disabled={isLoading}
        />
      </div>

      {/* 对话风格 */}
      <div className="space-y-2">
        <Label htmlFor="dialogueStyle">对话风格</Label>
        <Textarea
          id="dialogueStyle"
          value={formData.dialogueStyle}
          onChange={(e) => setFormData({ ...formData, dialogueStyle: e.target.value })}
          placeholder="角色的说话方式、口头禅、语言特点等"
          rows={3}
          disabled={isLoading}
        />
      </div>

      {/* 角色弧光 */}
      <div className="space-y-2">
        <Label htmlFor="characterArc">角色弧光</Label>
        <Textarea
          id="characterArc"
          value={formData.characterArc}
          onChange={(e) => setFormData({ ...formData, characterArc: e.target.value })}
          placeholder="角色在故事中的成长变化轨迹"
          rows={3}
          disabled={isLoading}
        />
      </div>

      {/* 按钮组 */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            isEditing ? '保存更改' : '创建角色'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          取消
        </Button>
      </div>
    </form>
  )
}
