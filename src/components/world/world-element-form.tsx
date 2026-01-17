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

const scopeOptions = [
  { value: 'global', label: '全局（影响整个世界）' },
  { value: 'regional', label: '区域（影响某个区域）' },
  { value: 'local', label: '局部（影响特定地点）' },
]

const categoryOptions = [
  { value: 'core_rule', label: '核心规则（不可违反的基础设定）' },
  { value: 'detail', label: '细节设定（具体的描述）' },
  { value: 'background', label: '背景信息（辅助性内容）' },
]

export function WorldElementForm({ projectId, isEditing, initialData }: WorldElementFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: initialData?.type || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    attributes: initialData?.attributes || '',
    importance: initialData?.importance || 5,
    scope: initialData?.scope || 'local',
    category: initialData?.category || 'detail',
    isEvolvable: initialData?.isEvolvable || false,
    constraints: initialData?.constraints || '',
    exceptions: initialData?.exceptions || '',
    evolutionSpace: initialData?.evolutionSpace || '',
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
          importance: formData.importance,
          scope: formData.scope,
          category: formData.category,
          isEvolvable: formData.isEvolvable,
          constraints: formData.constraints || undefined,
          exceptions: formData.exceptions || undefined,
          evolutionSpace: formData.evolutionSpace || undefined,
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

      {/* 重要性 */}
      <div className="space-y-2">
        <Label htmlFor="importance">重要性 *</Label>
        <div className="flex items-center gap-4">
          <Input
            id="importance"
            type="number"
            min="1"
            max="10"
            value={formData.importance}
            onChange={(e) => setFormData({ ...formData, importance: parseInt(e.target.value) || 5 })}
            disabled={isLoading}
            className="w-24"
          />
          <span className="text-sm text-muted-foreground">
            {formData.importance}/10 - {formData.importance >= 8 ? '核心设定' : formData.importance >= 5 ? '重要设定' : '次要设定'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          重要性越高，在 AI 生成时权重越大
        </p>
      </div>

      {/* 作用范围 */}
      <div className="space-y-2">
        <Label htmlFor="scope">作用范围 *</Label>
        <Select
          value={formData.scope}
          onValueChange={(value) => setFormData({ ...formData, scope: value })}
          required
        >
          <SelectTrigger disabled={isLoading}>
            <SelectValue placeholder="选择作用范围" />
          </SelectTrigger>
          <SelectContent>
            {scopeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 设定分类 */}
      <div className="space-y-2">
        <Label htmlFor="category">设定分类 *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
          required
        >
          <SelectTrigger disabled={isLoading}>
            <SelectValue placeholder="选择设定分类" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      {/* 是否可演化 */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isEvolvable"
          checked={formData.isEvolvable}
          onChange={(e) => setFormData({ ...formData, isEvolvable: e.target.checked })}
          disabled={isLoading}
          className="h-4 w-4"
        />
        <Label htmlFor="isEvolvable" className="cursor-pointer">
          可演化设定（该设定可能随剧情发展而变化）
        </Label>
      </div>

      {/* 约束条件 */}
      <div className="space-y-2">
        <Label htmlFor="constraints">约束条件（JSON 格式）</Label>
        <Textarea
          id="constraints"
          value={formData.constraints}
          onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
          placeholder='该设定的限制和边界，例如：&#10;[&#10;  {&#10;    "description": "筑基期需要100年",&#10;    "rule": "筑基,100年"&#10;  }&#10;]'
          rows={4}
          disabled={isLoading}
          className="font-mono text-sm"
        />
      </div>

      {/* 例外情况 */}
      <div className="space-y-2">
        <Label htmlFor="exceptions">例外情况（JSON 格式）</Label>
        <Textarea
          id="exceptions"
          value={formData.exceptions}
          onChange={(e) => setFormData({ ...formData, exceptions: e.target.value })}
          placeholder='特殊情况下的例外，例如：&#10;[&#10;  {&#10;    "condition": "天才修士",&#10;    "description": "可缩短至50年"&#10;  }&#10;]'
          rows={4}
          disabled={isLoading}
          className="font-mono text-sm"
        />
      </div>

      {/* 演化空间 */}
      <div className="space-y-2">
        <Label htmlFor="evolutionSpace">演化空间</Label>
        <Textarea
          id="evolutionSpace"
          value={formData.evolutionSpace}
          onChange={(e) => setFormData({ ...formData, evolutionSpace: e.target.value })}
          placeholder="描述该设定可能的演化方向，例如：主角可能突破传统境界体系，开创新的修炼之路"
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
