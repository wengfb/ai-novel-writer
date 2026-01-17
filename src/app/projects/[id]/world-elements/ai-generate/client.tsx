'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react'

interface AIGenerateWorldElementClientProps {
  projectId: string
  projectTitle: string
}

const elementTypes = [
  { value: 'location', label: '地点' },
  { value: 'history', label: '历史' },
  { value: 'magic', label: '魔法' },
  { value: 'organization', label: '组织' },
  { value: 'item', label: '物品' },
  { value: 'other', label: '其他' },
]

const modelOptions = [
  { value: 'gemini-3-flash', label: 'Gemini 3 Flash（推荐）' },
  { value: 'gemini-3-pro', label: 'Gemini 3 Pro' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
]

export function AIGenerateWorldElementClient({ projectId, projectTitle }: AIGenerateWorldElementClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [formData, setFormData] = useState({
    elementType: '',
    storyContext: '',
    requirements: '',
    model: 'gemini-3-flash',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 客户端验证
    if (!formData.elementType) {
      alert('请选择设定类型')
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/ai/generate/world-element', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          elementType: formData.elementType,
          storyContext: formData.storyContext || undefined,
          requirements: formData.requirements || undefined,
          model: formData.model,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data.worldElement)
        alert('世界观元素生成成功！')
      } else {
        alert(data.error || '生成失败')
      }
    } catch (error) {
      console.error('生成世界观元素失败:', error)
      alert('生成失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/projects/${projectId}?tab=ai`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回项目
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">AI 生成世界观</h1>
              <p className="text-sm text-muted-foreground">{projectTitle}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          {/* 生成表单 */}
          <Card>
            <CardHeader>
              <CardTitle>生成参数</CardTitle>
              <CardDescription>
                AI 将根据你的要求自动生成世界观元素
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 设定类型 */}
                <div className="space-y-2">
                  <Label htmlFor="elementType">设定类型 *</Label>
                  <Select
                    value={formData.elementType}
                    onValueChange={(value) => setFormData({ ...formData, elementType: value })}
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
                </div>

                {/* 故事背景 */}
                <div className="space-y-2">
                  <Label htmlFor="storyContext">故事背景</Label>
                  <Textarea
                    id="storyContext"
                    value={formData.storyContext}
                    onChange={(e) => setFormData({ ...formData, storyContext: e.target.value })}
                    placeholder="简要描述故事的世界观、时代背景等，帮助 AI 更好地生成设定"
                    rows={4}
                    disabled={isLoading}
                  />
                </div>

                {/* 特殊要求 */}
                <div className="space-y-2">
                  <Label htmlFor="requirements">特殊要求</Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    placeholder="对世界观元素的特殊要求，如特点、功能、历史等"
                    rows={4}
                    disabled={isLoading}
                  />
                </div>

                {/* AI 模型选择 */}
                <div className="space-y-2">
                  <Label htmlFor="model">AI 模型</Label>
                  <Select
                    value={formData.model}
                    onValueChange={(value) => setFormData({ ...formData, model: value })}
                  >
                    <SelectTrigger disabled={isLoading}>
                      <SelectValue placeholder="选择 AI 模型" />
                    </SelectTrigger>
                    <SelectContent>
                      {modelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 按钮 */}
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      开始生成
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 生成结果 */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle>生成结果</CardTitle>
                <CardDescription>
                  世界观元素已自动保存到项目中
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold">{result.name}</h3>
                    <p className="text-sm text-muted-foreground">类型：{result.type}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-1">描述</h4>
                    <p className="text-sm text-muted-foreground">{result.description}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link href={`/projects/${projectId}/world-elements/${result.id}`} className="flex-1">
                    <Button className="w-full">
                      编辑设定
                    </Button>
                  </Link>
                  <Link href={`/projects/${projectId}?tab=world`}>
                    <Button variant="outline">
                      查看设定列表
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setResult(null)
                      setFormData({
                        elementType: '',
                        storyContext: '',
                        requirements: '',
                        model: 'gemini-3-flash',
                      })
                    }}
                  >
                    重新生成
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
