import { tool, zodSchema } from 'ai'
import { prisma } from '@/lib/db/prisma'
import { GetProjectInfoInputSchema } from './schemas'
import type { ChatToolOptions } from './types'

export function createProjectTools({ projectId }: ChatToolOptions) {
  return {
    getProjectInfo: tool({
      description: '查询项目概览信息。',
      inputSchema: zodSchema(GetProjectInfoInputSchema),
      execute: async (input) => {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
        })

        if (!project) {
          return { ok: false, error: '项目不存在' }
        }

        const [chapterCount, characterCount, worldElementCount] = await Promise.all([
          prisma.chapter.count({ where: { projectId } }),
          prisma.character.count({ where: { projectId } }),
          prisma.worldElement.count({ where: { projectId } }),
        ])

        const result: Record<string, unknown> = {
          ok: true,
          project: {
            id: project.id,
            title: project.title,
            genre: project.genre,
            status: project.status,
            description: project.description,
          },
          counts: {
            chapters: chapterCount,
            characters: characterCount,
            worldElements: worldElementCount,
          },
        }

        if (input.includeChapters) {
          result.chapters = await prisma.chapter.findMany({
            where: { projectId },
            orderBy: { chapterNumber: 'asc' },
            take: input.chapterLimit,
            select: {
              id: true,
              chapterNumber: true,
              title: true,
              summary: true,
            },
          })
        }

        if (input.includeCharacters) {
          result.characters = await prisma.character.findMany({
            where: { projectId },
            orderBy: { importance: 'desc' },
            take: input.characterLimit,
            select: {
              id: true,
              name: true,
              role: true,
              personality: true,
            },
          })
        }

        if (input.includeWorldElements) {
          result.worldElements = await prisma.worldElement.findMany({
            where: { projectId },
            orderBy: { importance: 'desc' },
            take: input.worldElementLimit,
            select: {
              id: true,
              name: true,
              type: true,
              description: true,
            },
          })
        }

        return result
      },
    }),
  }
}
