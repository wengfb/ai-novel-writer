'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react'

interface AIGenerateCharacterClientProps {
  projectId: string
  projectTitle: string
}

const modelOptions = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash（推荐）' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
]

export function AIGenerateCharacterClient({ projectId, projectTitle }: AIGenerateCharacterClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [formData, setFormData] = useState({
    role: '',
    storyContext: '',
    requirements: '',
    model: 'gemini-2.5-flash',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/ai/generate/character', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          role: formData.role,
          storyContext: formData.storyContext || undefined,
          requirements: formData.requirements || undefined,
          model: formData.model,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data.character)
        alert('角色生成成功！')
      } else {
        alert(data.error || '生成失败')
      }
    } catch (error) {
      console.error('生成角色失败:', error)
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
              <h1 className="text-2xl font-bold">AI 生成角色</h1>
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
                AI 将根据你的要求自动生成完整的角色卡
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 角色定位 */}
                <div className="space-y-2">
                  <Label htmlFor="role">角色定位 *</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="例如：主角、反派、配角、导师等"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* 故事背景 */}
                <div className="space-y-2">
                  <Label htmlFor="storyContext">故事背景</Label>
                  <Textarea
                    id="storyContext"
                    value={formData.storyContext}
                    onChange={(e) => setFormData({ ...formData, storyContext: e.target.value })}
                    placeholder="简要描述故事的世界观、时代背景等，帮助 AI 更好地生成角色"
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
                    placeholder="对角色的特殊要求，如性格特点、能力、背景故事等"
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
                  角色已自动保存到项目中
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold">{result.name}</h3>
                    {result.nickname && (
                      <p className="text-sm text-muted-foreground">昵称：{result.nickname}</p>
                    )}
                  </div>

                  {result.appearance && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">外貌</h4>
                      <p className="text-sm text-muted-foreground">{result.appearance}</p>
                    </div>
                  )}

                  {result.personality && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">性格</h4>
                      <p className="text-sm text-muted-foreground">{result.personality}</p>
                    </div>
                  )}

                  {result.backstory && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">背景故事</h4>
                      <p className="text-sm text-muted-foreground">{result.backstory}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Link href={`/projects/${projectId}/characters/${result.id}`} className="flex-1">
                    <Button className="w-full">
                      编辑角色
                    </Button>
                  </Link>
                  <Link href={`/projects/${projectId}?tab=characters`}>
                    <Button variant="outline">
                      查看角色列表
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setResult(null)
                      setFormData({
                        role: '',
                        storyContext: '',
                        requirements: '',
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

export default function AIGenerateCharacterPage({ params }: { params: { id: string } }) {
  return (
    <AIGenerateCharacterClient
      projectId={params.id}
      projectTitle="项目"
    />
  )
}
