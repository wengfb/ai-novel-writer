'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { Chapter } from '@/lib/generated/prisma/client'

interface ChapterFormProps {
  projectId: string
  chapterNumber: number
  isEditing: boolean
  initialData?: Chapter
}

export function ChapterForm({ projectId, chapterNumber, isEditing, initialData }: ChapterFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    chapterNumber: initialData?.chapterNumber || chapterNumber,
    title: initialData?.title || '',
    content: initialData?.content || '',
    summary: initialData?.summary || '',
    notes: initialData?.notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = isEditing
        ? `/api/projects/${projectId}/chapters/${initialData?.id}`
        : `/api/projects/${projectId}/chapters`

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapterNumber: formData.chapterNumber,
          title: formData.title,
          content: formData.content || undefined,
          summary: formData.summary || undefined,
          notes: formData.notes || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/projects/${projectId}`)
        router.refresh()
      } else {
        alert(data.error || '保存失败')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('保存章节失败:', error)
      alert('保存失败')
      setIsLoading(false)
    }
  }

  // 计算字数
  const wordCount = formData.content.length

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 章节号 */}
      <div className="space-y-2">
        <Label htmlFor="chapterNumber">章节号 *</Label>
        <Input
          id="chapterNumber"
          type="number"
          value={formData.chapterNumber}
          onChange={(e) => setFormData({ ...formData, chapterNumber: parseInt(e.target.value) })}
          placeholder="章节号"
          required
          disabled={isEditing || isLoading}
          min={1}
        />
        <p className="text-xs text-muted-foreground">
          {isEditing ? '章节号不可修改' : '请输入章节号'}
        </p>
      </div>

      {/* 标题 */}
      <div className="space-y-2">
        <Label htmlFor="title">章节标题 *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="输入章节标题"
          required
          disabled={isLoading}
          maxLength={200}
        />
      </div>

      {/* 内容 */}
      <div className="space-y-2">
        <Label htmlFor="content">章节内容</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="输入章节内容..."
          rows={20}
          disabled={isLoading}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          当前字数：{wordCount.toLocaleString()} 字
        </p>
      </div>

      {/* 摘要 */}
      <div className="space-y-2">
        <Label htmlFor="summary">章节摘要</Label>
        <Textarea
          id="summary"
          value={formData.summary}
          onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
          placeholder="简要描述本章内容（用于 AI 上下文管理）"
          rows={3}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          摘要将用于 AI 生成时的上下文管理
        </p>
      </div>

      {/* 笔记 */}
      <div className="space-y-2">
        <Label htmlFor="notes">作者笔记</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="记录创作思路、待修改内容等"
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
            isEditing ? '保存更改' : '创建章节'
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
