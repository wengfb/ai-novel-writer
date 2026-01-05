'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { Project } from '@/lib/generated/prisma/client'

interface ProjectSettingsFormProps {
  project: Project
}

const genres = [
  '玄幻', '仙侠', '武侠', '科幻', '都市', '历史', '军事',
  '游戏', '灵异', '悬疑', '探险', '耽美', '其他'
]

const statusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'writing', label: '创作中' },
  { value: 'completed', label: '已完成' },
]

export function ProjectSettingsForm({ project }: ProjectSettingsFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: project.title,
    description: project.description || '',
    genre: project.genre,
    tags: project.tags ? JSON.parse(project.tags as string).join(', ') : '',
    status: project.status,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 处理标签
      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          genre: formData.genre,
          tags: tagsArray.length > 0 ? tagsArray : undefined,
          status: formData.status,
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/projects/${project.id}`)
        router.refresh()
      } else {
        alert(data.error || '保存失败')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('保存项目设置失败:', error)
      alert('保存失败')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 标题 */}
      <div className="space-y-2">
        <Label htmlFor="title">项目标题 *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="输入项目标题"
          required
          disabled={isLoading}
        />
      </div>

      {/* 描述 */}
      <div className="space-y-2">
        <Label htmlFor="description">项目简介</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="简要描述你的小说项目..."
          rows={3}
          disabled={isLoading}
        />
      </div>

      {/* 类型 */}
      <div className="space-y-2">
        <Label htmlFor="genre">作品类型 *</Label>
        <Select
          value={formData.genre}
          onValueChange={(value) => setFormData({ ...formData, genre: value })}
          required
        >
          <SelectTrigger disabled={isLoading}>
            <SelectValue placeholder="选择作品类型" />
          </SelectTrigger>
          <SelectContent>
            {genres.map((genre) => (
              <SelectItem key={genre} value={genre}>
                {genre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 标签 */}
      <div className="space-y-2">
        <Label htmlFor="tags">标签</Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="用逗号分隔，例如：热血, 升级流, 系统"
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          用逗号分隔多个标签
        </p>
        {formData.tags && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.split(',').map((tag, index) => {
              const trimmedTag = tag.trim()
              if (!trimmedTag) return null
              return (
                <Badge key={index} variant="secondary">
                  {trimmedTag}
                </Badge>
              )
            })}
          </div>
        )}
      </div>

      {/* 状态 */}
      <div className="space-y-2">
        <Label htmlFor="status">项目状态</Label>
        <Select
          value={formData.status}
          onValueChange={(value: any) => setFormData({ ...formData, status: value })}
        >
          <SelectTrigger disabled={isLoading}>
            <SelectValue placeholder="选择项目状态" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            '保存更改'
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
