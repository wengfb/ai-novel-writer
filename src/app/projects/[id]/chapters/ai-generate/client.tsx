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

interface AIGenerateChapterClientProps {
  projectId: string
  projectTitle: string
  nextChapterNumber: number
}

const modelOptions = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash（推荐）' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
]

export function AIGenerateChapterClient({ projectId, projectTitle, nextChapterNumber }: AIGenerateChapterClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [chapterId, setChapterId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    chapterNumber: nextChapterNumber.toString(),
    chapterTitle: '',
    chapterOutline: '',
    targetWords: '3000',
    model: 'gemini-2.5-flash',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setGeneratedContent('')
    setChapterId(null)

    try {
      const response = await fetch('/api/ai/generate/chapter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          chapterNumber: parseInt(formData.chapterNumber),
          chapterTitle: formData.chapterTitle,
          chapterOutline: formData.chapterOutline,
          targetWords: parseInt(formData.targetWords),
          model: formData.model,
        }),
      })

      if (!response.ok) {
        throw new Error('生成失败')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('无法读取响应流')
      }

      let content = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              continue
            }
            try {
              const json = JSON.parse(data)
              if (json.content) {
                content += json.content
                setGeneratedContent(content)
              }
              if (json.chapterId) {
                setChapterId(json.chapterId)
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      alert('章节生成完成！')
    } catch (error) {
      console.error('生成章节失败:', error)
      alert('生成失败')
    } finally {
      setIsLoading(false)
    }
  }

  const wordCount = generatedContent.length

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
              <h1 className="text-2xl font-bold">AI 生成章节</h1>
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
                AI 将根据章节大纲自动生成完整的章节内容
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* 章节号 */}
                  <div className="space-y-2">
                    <Label htmlFor="chapterNumber">章节号 *</Label>
                    <Input
                      id="chapterNumber"
                      type="number"
                      value={formData.chapterNumber}
                      onChange={(e) => setFormData({ ...formData, chapterNumber: e.target.value })}
                      placeholder="章节号"
                      required
                      disabled={isLoading}
                      min={1}
                    />
                  </div>

                  {/* 目标字数 */}
                  <div className="space-y-2">
                    <Label htmlFor="targetWords">目标字数</Label>
                    <Input
                      id="targetWords"
                      type="number"
                      value={formData.targetWords}
                      onChange={(e) => setFormData({ ...formData, targetWords: e.target.value })}
                      placeholder="3000"
                      disabled={isLoading}
                      min={500}
                      max={20000}
                    />
                  </div>
                </div>

                {/* 章节标题 */}
                <div className="space-y-2">
                  <Label htmlFor="chapterTitle">章节标题 *</Label>
                  <Input
                    id="chapterTitle"
                    value={formData.chapterTitle}
                    onChange={(e) => setFormData({ ...formData, chapterTitle: e.target.value })}
                    placeholder="输入章节标题"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* 章节大纲 */}
                <div className="space-y-2">
                  <Label htmlFor="chapterOutline">章节大纲 *</Label>
                  <Textarea
                    id="chapterOutline"
                    value={formData.chapterOutline}
                    onChange={(e) => setFormData({ ...formData, chapterOutline: e.target.value })}
                    placeholder="描述本章的主要情节、场景、角色互动等...&#10;例如：主角在修炼时突破瓶颈，引发天地异象，吸引了宗门长老的注意"
                    rows={6}
                    required
                    disabled={isLoading}
                    minLength={10}
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
          {(generatedContent || isLoading) && (
            <Card>
              <CardHeader>
                <CardTitle>生成内容</CardTitle>
                <CardDescription>
                  当前字数：{wordCount.toLocaleString()} 字
                  {isLoading && ' - 正在生成中...'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg max-h-[600px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {generatedContent || '等待生成...'}
                  </pre>
                </div>

                {chapterId && !isLoading && (
                  <div className="flex gap-3">
                    <Link href={`/projects/${projectId}/chapters/${chapterId}`} className="flex-1">
                      <Button className="w-full">
                        编辑章节
                      </Button>
                    </Link>
                    <Link href={`/projects/${projectId}?tab=chapters`}>
                      <Button variant="outline">
                        查看章节列表
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
