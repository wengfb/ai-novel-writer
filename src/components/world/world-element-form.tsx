'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { WorldElement } from '@/lib/generated/prisma/client'

interface WorldElementFormProps {
  projectId: string
  isEditing: boolean
  initialData?: WorldElement
}

const elementTypes = [
  { value: 'location', label: '地点' },
  { value: 'history', label: '历史' },
  { value: 'magic', label: '魔法' },
  { value: 'organization', label: '组织' },
  { value: 'item', label: '物品' },
  { value: 'other', label: '其他' },
]

export function WorldElementForm({ projectId, isEditing, initialData }: WorldElementFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: initialData?.type || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    attributes: initialData?.attributes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = isEditing
        ? `/api/world-elements/${initialData?.id}`
        : `/api/projects/${projectId}/world-elements`

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          name: formData.name,
          description: formData.description,
          attributes: formData.attributes || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/projects/${projectId}?tab=world`)
        router.refresh()
      } else {
        alert(data.error || '保存失败')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('保存世界观元素失败:', error)
      alert('保存失败')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 类型 */}
      <div className="space-y-2">
        <Label htmlFor="type">设定类型 *</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
          required
        >
          <SelectTrigger disabled={isLoading}>
            <SelectValue placeholder="选择设定类型" />
          </SelectTrigger>
          <SelectContent>
            {elementTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          选择世界观元素的类型
        </p>
      </div>

      {/* 名称 */}
      <div className="space-y-2">
        <Label htmlFor="name">名称 *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="输入世界观元素名称"
          required
          disabled={isLoading}
          maxLength={200}
        />
      </div>

      {/* 描述 */}
      <div className="space-y-2">
        <Label htmlFor="description">描述 *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="详细描述这个世界观元素..."
          rows={8}
          required
          disabled={isLoading}
        />
      </div>

      {/* 扩展属性 */}
      <div className="space-y-2">
        <Label htmlFor="attributes">扩展属性（JSON 格式）</Label>
        <Textarea
          id="attributes"
          value={formData.attributes}
          onChange={(e) => setFormData({ ...formData, attributes: e.target.value })}
          placeholder='可选的 JSON 格式扩展属性，例如：&#10;{&#10;  "population": "10万人",&#10;  "climate": "温带海洋性气候",&#10;  "specialties": ["魔法学院", "炼金术"]&#10;}'
          rows={6}
          disabled={isLoading}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          可以使用 JSON 格式添加更多自定义属性
        </p>
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
            isEditing ? '保存更改' : '创建设定'
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
