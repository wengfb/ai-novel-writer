import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Sparkles, FileText, Users, Settings } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">AI Novel Writer</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                系统设置
              </Button>
            </Link>
            <Link href="/projects">
              <Button size="sm">进入工作台</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-4">
            AI 辅助小说创作系统
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            基于 Gemini 2.5 的智能小说创作工具，支持大纲生成、章节创作、角色管理等功能
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/projects/new">
              <Button size="lg">
                <FileText className="mr-2 h-5 w-5" />
                创建新项目
              </Button>
            </Link>
            <Link href="/projects">
              <Button size="lg" variant="outline">
                <BookOpen className="mr-2 h-5 w-5" />
                我的项目
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <Sparkles className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>AI 智能生成</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                基于 Gemini 2.5 Flash/Pro，支持大纲自动生成、章节创作、角色塑造等功能
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BookOpen className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>完整创作管理</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                项目管理、章节编辑、大纲规划、角色设定、世界观构建一站式完成
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>角色与世界观</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                完善的角色管理系统和世界观设定，确保长篇小说的一致性和连贯性
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/50 dark:bg-slate-900/50 mt-20">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>AI Novel Writer - 基于 Next.js 15 + Gemini 2.5 构建</p>
        </div>
      </footer>
    </div>
  )
}
