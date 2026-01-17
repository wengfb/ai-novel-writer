import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db/prisma'
import { notFound } from 'next/navigation'
import { ChapterForm } from '@/components/chapter/chapter-form'

async function getProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
  })

  return project
}

async function getChapter(projectId: string, chapterId: string) {
  const chapter = await prisma.chapter.findUnique({
    where: {
      id: chapterId,
      projectId: projectId,
    },
  })

  return chapter
}

export default async function EditChapterPage({
  params,
}: {
  params: Promise<{ id: string; chapterId: string }>
}) {
  const { id, chapterId } = await params
  const project = await getProject(id)
  const chapter = await getChapter(id, chapterId)

  if (!project || !chapter) {
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
              <h1 className="text-2xl font-bold">编辑章节</h1>
              <p className="text-sm text-muted-foreground">
                {project.title} - 第{chapter.chapterNumber}章
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>章节信息</CardTitle>
          </CardHeader>
          <CardContent>
            <ChapterForm
              projectId={id}
              chapterNumber={chapter.chapterNumber}
              isEditing={true}
              initialData={chapter}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
