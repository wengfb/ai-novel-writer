import { prisma } from '@/lib/db/prisma'
import { notFound } from 'next/navigation'
import { AIGenerateWorldElementClient } from './client'

async function getProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
  })

  return project
}

export default async function AIGenerateWorldElementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await getProject(id)

  if (!project) {
    notFound()
  }

  return <AIGenerateWorldElementClient projectId={id} projectTitle={project.title} />
}
