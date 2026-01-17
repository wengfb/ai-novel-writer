import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db/prisma'
import { notFound } from 'next/navigation'
import { WorldElementForm } from '@/components/world/world-element-form'

async function getProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
  })

  return project
}

async function getWorldElement(projectId: string, elementId: string) {
  const element = await prisma.worldElement.findUnique({
    where: {
      id: elementId,
      projectId: projectId,
    },
  })

  return element
}

export default async function EditWorldElementPage({
  params,
}: {
  params: Promise<{ id: string; elementId: string }>
}) {
  const { id, elementId } = await params
  const project = await getProject(id)
  const element = await getWorldElement(id, elementId)

  if (!project || !element) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/projects/${id}?tab=world`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回项目
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">编辑世界观设定</h1>
              <p className="text-sm text-muted-foreground">
                {project.title} - {element.name}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>世界观设定信息</CardTitle>
          </CardHeader>
          <CardContent>
            <WorldElementForm
              projectId={id}
              isEditing={true}
              initialData={element}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
