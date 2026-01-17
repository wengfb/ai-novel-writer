import { prisma } from '@/lib/db/prisma'
import { notFound } from 'next/navigation'
import { AIGenerateChapterClient } from './client'

async function getProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
  })

  return project
}

async function getNextChapterNumber(projectId: string) {
  const lastChapter = await prisma.chapter.findFirst({
    where: { projectId },
    orderBy: { chapterNumber: 'desc' },
  })

  return lastChapter ? lastChapter.chapterNumber + 1 : 1
}

export default async function AIGenerateChapterPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await getProject(id)
  const nextChapterNumber = await getNextChapterNumber(id)

  if (!project) {
    notFound()
  }

  return (
    <AIGenerateChapterClient
      projectId={id}
      projectTitle={project.title}
      nextChapterNumber={nextChapterNumber}
    />
  )
}
