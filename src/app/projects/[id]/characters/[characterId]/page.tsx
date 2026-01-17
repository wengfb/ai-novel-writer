import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db/prisma'
import { notFound } from 'next/navigation'
import { CharacterForm } from '@/components/character/character-form'

async function getProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
  })

  return project
}

async function getCharacter(projectId: string, characterId: string) {
  const character = await prisma.character.findUnique({
    where: {
      id: characterId,
      projectId: projectId,
    },
  })

  return character
}

export default async function EditCharacterPage({
  params,
}: {
  params: Promise<{ id: string; characterId: string }>
}) {
  const { id, characterId } = await params
  const project = await getProject(id)
  const character = await getCharacter(id, characterId)

  if (!project || !character) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/projects/${id}?tab=characters`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回项目
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">编辑角色</h1>
              <p className="text-sm text-muted-foreground">
                {project.title} - {character.name}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>角色信息</CardTitle>
          </CardHeader>
          <CardContent>
            <CharacterForm
              projectId={id}
              isEditing={true}
              initialData={character}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
