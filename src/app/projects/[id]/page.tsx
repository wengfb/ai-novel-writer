import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, BookOpen, Users, Globe, Sparkles, FileText, Settings, Plus } from 'lucide-react'
import { prisma } from '@/lib/db/prisma'
import { notFound } from 'next/navigation'
import { ProjectDeleteButton } from '@/components/project/project-delete-button'

async function getProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      chapters: {
        orderBy: { chapterNumber: 'asc' },
        take: 10,
      },
      characters: {
        take: 5,
      },
      worldElements: {
        take: 5,
      },
      _count: {
        select: {
          chapters: true,
          characters: true,
          worldElements: true,
        },
      },
    },
  })

  return project
}

export default async function ProjectDetailPage({
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/projects">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  返回
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{project.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {project.genre} · {project._count.chapters} 章节 · {project.totalWords.toLocaleString()} 字
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/projects/${project.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  编辑
                </Button>
              </Link>
              <ProjectDeleteButton projectId={project.id} projectTitle={project.title} redirectTo="/projects" />
            </div>
          </div>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="chapters" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="chapters">
              <FileText className="mr-2 h-4 w-4" />
              章节
            </TabsTrigger>
            <TabsTrigger value="characters">
              <Users className="mr-2 h-4 w-4" />
              角色
            </TabsTrigger>
            <TabsTrigger value="world">
              <Globe className="mr-2 h-4 w-4" />
              世界观
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Sparkles className="mr-2 h-4 w-4" />
              AI 生成
            </TabsTrigger>
          </TabsList>

          {/* Chapters Tab */}
          <TabsContent value="chapters" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">章节列表</h2>
              <Link href={`/projects/${project.id}/chapters/new`}>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  新建章节
                </Button>
              </Link>
            </div>

            {project.chapters.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">还没有章节</p>
                  <Link href={`/projects/${project.id}/chapters/new`}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      创建第一章
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {project.chapters.map((chapter) => (
                  <Card key={chapter.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">
                            第{chapter.chapterNumber}章 {chapter.title}
                          </CardTitle>
                          {chapter.summary && (
                            <CardDescription className="mt-1">
                              {chapter.summary}
                            </CardDescription>
                          )}
                        </div>
                        <Badge variant="secondary">{chapter.wordCount} 字</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Link href={`/projects/${project.id}/chapters/${chapter.id}`}>
                          <Button variant="outline" size="sm">
                            编辑
                          </Button>
                        </Link>
                        <Link href={`/projects/${project.id}/chapters/${chapter.id}`}>
                          <Button variant="outline" size="sm">
                            AI 续写
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Characters Tab */}
          <TabsContent value="characters" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">角色 ({project._count.characters})</h2>
              <Link href={`/projects/${project.id}/characters/new`}>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  新建角色
                </Button>
              </Link>
            </div>

            {project.characters.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">还没有角色</p>
                  <Link href={`/projects/${project.id}/characters/new`}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      创建角色
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {project.characters.map((character) => (
                  <Card key={character.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{character.name}</CardTitle>
                      {character.nickname && (
                        <CardDescription>昵称：{character.nickname}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {character.personality && (
                          <p><span className="text-muted-foreground">性格：</span>{character.personality}</p>
                        )}
                        {character.motivation && (
                          <p><span className="text-muted-foreground">动机：</span>{character.motivation}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* World Elements Tab */}
          <TabsContent value="world" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">世界观设定 ({project._count.worldElements})</h2>
              <Link href={`/projects/${project.id}/world-elements/new`}>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  新建设定
                </Button>
              </Link>
            </div>

            {project.worldElements.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">还没有世界观设定</p>
                  <Link href={`/projects/${project.id}/world-elements/new`}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      创建设定
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {project.worldElements.map((element) => (
                  <Card key={element.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{element.name}</CardTitle>
                        <Badge variant="outline">{element.type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {element.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* AI Generation Tab */}
          <TabsContent value="ai" className="space-y-4">
            <h2 className="text-xl font-semibold">AI 生成</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>生成大纲</CardTitle>
                  <CardDescription>
                    根据项目信息自动生成完整的故事大纲
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/projects/${project.id}/ai/generate/outline`}>
                    <Button className="w-full">
                      <Sparkles className="mr-2 h-4 w-4" />
                      开始生成
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>生成角色</CardTitle>
                  <CardDescription>
                    AI 辅助创建角色卡，包含外貌、性格、背景等
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/projects/${project.id}/characters/ai-generate`}>
                    <Button className="w-full">
                      <Sparkles className="mr-2 h-4 w-4" />
                      生成角色
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>生成世界观</CardTitle>
                  <CardDescription>
                    创建地理、历史、魔法等世界观设定
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/projects/${project.id}/world-elements/ai-generate`}>
                    <Button className="w-full">
                      <Sparkles className="mr-2 h-4 w-4" />
                      生成设定
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>生成章节</CardTitle>
                  <CardDescription>
                    根据大纲自动生成章节内容
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/projects/${project.id}/chapters/ai-generate`}>
                    <Button className="w-full">
                      <Sparkles className="mr-2 h-4 w-4" />
                      生成章节
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
