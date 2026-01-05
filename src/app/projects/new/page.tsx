'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'

const GENRES = [
  '玄幻',
  '科幻',
  '都市',
  '言情',
  '武侠',
  '历史',
  '其他',
] as const

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '玄幻' as typeof GENRES[number],
    tags: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          genre: formData.genre,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/projects/${data.data.project.id}`)
      } else {
        alert(data.error?.message || '创建失败')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      alert('创建失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">创建新项目</h1>
        </div>
      </header>

      {/* Form */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>项目信息</CardTitle>
              <CardDescription>
                填写项目基本信息，创建后可以随时修改
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 标题 */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  项目标题 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="例如：仙侠世界"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  maxLength={200}
                />
              </div>

              {/* 简介 */}
              <div className="space-y-2">
                <Label htmlFor="description">项目简介</Label>
                <Textarea
                  id="description"
                  placeholder="简要描述你的小说创意..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  maxLength={1000}
                />
              </div>

              {/* 类型 */}
              <div className="space-y-2">
                <Label>
                  小说类型 <span className="text-red-500">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((genre) => (
                    <Button
                      key={genre}
                      type="button"
                      variant={formData.genre === genre ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData({ ...formData, genre })}
                    >
                      {genre}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 标签 */}
              <div className="space-y-2">
                <Label htmlFor="tags">标签</Label>
                <Input
                  id="tags"
                  placeholder="用逗号分隔，例如：修仙,热血,爽文"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  用逗号分隔多个标签
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 mt-6">
            <Button type="submit" disabled={loading || !formData.title}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              创建项目
            </Button>
            <Link href="/projects">
              <Button type="button" variant="outline" disabled={loading}>
                取消
              </Button>
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
