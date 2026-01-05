import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db/prisma'
import { notFound } from 'next/navigation'
import { ProjectSettingsForm } from '@/components/project/project-settings-form'

async function getProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
  })

  return project
}

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await getProject(id)

  if (!project) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/projects/${id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回项目
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">编辑项目</h1>
              <p className="text-sm text-muted-foreground">修改项目信息</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>编辑项目的基本信息</CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectSettingsForm project={project} />
            </CardContent>
          </Card>

          {/* AI 配置 */}
          <Card>
            <CardHeader>
              <CardTitle>AI 生成配置</CardTitle>
              <CardDescription>配置 AI 生成参数和模型选择</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">AI 模型</label>
                  <p className="text-xs text-muted-foreground mt-1">
                    选择用于生成内容的 AI 模型
                  </p>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Gemini 2.5 Flash</div>
                        <div className="text-xs text-muted-foreground">
                          快速生成，成本较低，适合日常创作
                        </div>
                      </div>
                      <Badge variant="default">推荐</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Gemini 2.5 Pro</div>
                        <div className="text-xs text-muted-foreground">
                          高质量生成，成本较高，适合精修
                        </div>
                      </div>
                      <Badge variant="outline">高级</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">生成温度</label>
                  <p className="text-xs text-muted-foreground mt-1">
                    控制生成的随机性和创造性（0.0 - 1.0）
                  </p>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    defaultValue="0.7"
                    className="w-full mt-2"
                    disabled
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>保守</span>
                    <span>0.7</span>
                    <span>创造性</span>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    💡 <strong>提示：</strong>AI 配置选项将在生成时动态选择，无需在此预先配置。
                    不同的生成任务（大纲、章节、角色等）会自动使用最合适的模型。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 封面图片 */}
          <Card>
            <CardHeader>
              <CardTitle>封面图片</CardTitle>
              <CardDescription>为项目设置封面图片</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.coverImage ? (
                  <div className="relative aspect-video w-full max-w-sm">
                    <img
                      src={project.coverImage}
                      alt={project.title}
                      className="object-cover rounded-lg border"
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full max-w-sm bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">暂无封面图片</p>
                  </div>
                )}
                <div>
                  <Button variant="outline" size="sm" disabled>
                    上传封面
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    支持 JPG、PNG 格式，建议尺寸 1200x630
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 危险操作 */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">危险操作</CardTitle>
              <CardDescription>这些操作不可逆，请谨慎操作</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">删除项目</div>
                    <div className="text-sm text-muted-foreground">
                      永久删除项目及其所有章节、角色和世界观设定
                    </div>
                  </div>
                  <Link href={`/projects/${id}`}>
                    <Button variant="destructive" size="sm">
                      删除项目
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
