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

interface AIGenerateOutlineClientProps {
  projectId: string
  projectTitle: string
}

const modelOptions = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash（推荐）', description: '快速生成，成本较低' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: '高质量生成，成本较高' },
]

export function AIGenerateOutlineClient({ projectId, projectTitle }: AIGenerateOutlineClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [formData, setFormData] = useState({
    coreIdea: '',
    style: '',
    targetWords: '100000',
    chapterCount: '50',
    model: 'gemini-2.5-flash',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/ai/generate/outline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          coreIdea: formData.coreIdea,
          style: formData.style || undefined,
          targetWords: parseInt(formData.targetWords),
          chapterCount: parseInt(formData.chapterCount),
          model: formData.model,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data)
        alert('大纲生成成功！')
      } else {
        alert(data.error || '生成失败')
      }
    } catch (error) {
      console.error('生成大纲失败:', error)
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
              <h1 className="text-2xl font-bold">AI 生成大纲</h1>
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
                根据核心创意自动生成完整的故事大纲、角色设定和世界观
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 核心创意 */}
                <div className="space-y-2">
                  <Label htmlFor="coreIdea">核心创意 *</Label>
                  <Textarea
                    id="coreIdea"
                    value={formData.coreIdea}
                    onChange={(e) => setFormData({ ...formData, coreIdea: e.target.value })}
                    placeholder="描述你的小说核心创意、主题、故事背景等...&#10;例如：一个现代程序员穿越到修仙世界，利用编程思维修炼成仙的故事"
                    rows={6}
                    required
                    disabled={isLoading}
                    minLength={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    至少 10 个字符，越详细越好
                  </p>
                </div>

                {/* 写作风格 */}
                <div className="space-y-2">
                  <Label htmlFor="style">写作风格</Label>
                  <Input
                    id="style"
                    value={formData.style}
                    onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                    placeholder="例如：轻松幽默、热血激昂、悬疑紧张等"
                    disabled={isLoading}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* 目标字数 */}
                  <div className="space-y-2">
                    <Label htmlFor="targetWords">目标字数</Label>
                    <Input
                      id="targetWords"
                      type="number"
                      value={formData.targetWords}
                      onChange={(e) => setFormData({ ...formData, targetWords: e.target.value })}
                      placeholder="100000"
                      disabled={isLoading}
                      min={10000}
                      max={10000000}
                    />
                    <p className="text-xs text-muted-foreground">
                      建议 10 万字以上
                    </p>
                  </div>

                  {/* 章节数 */}
                  <div className="space-y-2">
                    <Label htmlFor="chapterCount">章节数</Label>
                    <Input
                      id="chapterCount"
                      type="number"
                      value={formData.chapterCount}
                      onChange={(e) => setFormData({ ...formData, chapterCount: e.target.value })}
                      placeholder="50"
                      disabled={isLoading}
                      min={1}
                      max={200}
                    />
                    <p className="text-xs text-muted-foreground">
                      最多 200 章
                    </p>
                  </div>
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
                          <div>
                            <div>{option.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {option.description}
                            </div>
                          </div>
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
                  大纲、角色和世界观已自动保存到项目中
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    ✅ 生成成功！已创建：
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• 大纲节点：{result.outline?.length || 0} 个</li>
                    <li>• 角色：{result.characters?.length || 0} 个</li>
                    <li>• 世界观元素：{result.worldElements?.length || 0} 个</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Link href={`/projects/${projectId}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      查看项目
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setResult(null)
                      setFormData({
                        coreIdea: '',
                        style: '',
                        targetWords: '100000',
                        chapterCount: '50',
                        model: 'gemini-2.5-flash',
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
