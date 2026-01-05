import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, BookOpen, FileText, Users, Globe } from 'lucide-react'
import { prisma } from '@/lib/db/prisma'
import { ProjectDeleteButton } from '@/components/project/project-delete-button'

async function getProjects() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: {
          chapters: true,
          characters: true,
          worldElements: true,
        },
      },
    },
  })
  return projects
}

export default async function ProjectsPage() {
  const projects = await getProjects()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                ← 返回首页
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">我的项目</h1>
          </div>
          <Link href="/projects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新建项目
            </Button>
          </Link>
        </div>
      </header>

      {/* Projects List */}
      <main className="container mx-auto px-4 py-8">
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">还没有项目</h2>
            <p className="text-muted-foreground mb-6">
              创建你的第一个小说项目，开始 AI 辅助创作之旅
            </p>
            <Link href="/projects/new">
              <Button size="lg">
                <Plus className="mr-2 h-4 w-4" />
                创建新项目
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                        {project.status === 'draft' && '草稿'}
                        {project.status === 'writing' && '创作中'}
                        {project.status === 'completed' && '已完成'}
                      </Badge>
                      <ProjectDeleteButton projectId={project.id} projectTitle={project.title} />
                    </div>
                  </div>
                  {project.description && (
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>{project._count.chapters} 章</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{project._count.characters} 角色</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      <span>{project._count.worldElements} 设定</span>
                    </div>
                  </div>
                  <div className="mt-3 text-sm">
                    <span className="text-muted-foreground">类型：</span>
                    <Badge variant="outline" className="ml-1">
                      {project.genre}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/projects/${project.id}`} className="w-full">
                    <Button variant="outline" className="w-full">
                      查看详情
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
