import { tool, zodSchema } from 'ai'
import { prisma } from '@/lib/db/prisma'
import { getWorldConsistencyChecker } from '@/lib/ai/world-consistency-checker'
import { CheckConsistencyInputSchema } from './schemas'
import type { ChatToolOptions } from './types'

export function createConsistencyTools({ projectId, chapterId }: ChatToolOptions) {
  return {
    checkWorldConsistency: tool({
      description: '检查章节内容与世界观设定的一致性。',
      inputSchema: zodSchema(CheckConsistencyInputSchema),
      execute: async (input) => {
        const targetId = input.chapterId ?? chapterId
        const targetNumber = input.chapterNumber

        if (!targetId && !targetNumber) {
          return { ok: false, error: '缺少章节ID或章节号' }
        }

        const chapter = targetId
          ? await prisma.chapter.findFirst({ where: { id: targetId, projectId } })
          : await prisma.chapter.findFirst({ where: { projectId, chapterNumber: targetNumber as number } })

        if (!chapter) {
          return { ok: false, error: '未找到匹配的章节' }
        }

        const worldElements = await prisma.worldElement.findMany({
          where: { projectId },
        })

        const checker = getWorldConsistencyChecker()
        const issues = await checker.checkChapter(
          {
            id: chapter.id,
            projectId: chapter.projectId,
            chapterNumber: chapter.chapterNumber,
            title: chapter.title,
            content: chapter.content,
            wordCount: chapter.wordCount,
            summary: chapter.summary ?? undefined,
            notes: chapter.notes ?? undefined,
            isKeyChapter: chapter.isKeyChapter,
            plotType: (chapter.plotType as 'setup' | 'conflict' | 'climax' | 'resolution') ?? undefined,
            createdAt: chapter.createdAt,
            updatedAt: chapter.updatedAt,
          },
          worldElements.map((e) => ({
            id: e.id,
            projectId: e.projectId,
            type: e.type as 'location' | 'history' | 'magic' | 'organization' | 'item' | 'other',
            name: e.name,
            description: e.description,
            attributes: e.attributes ?? undefined,
            importance: e.importance,
            scope: e.scope as 'global' | 'regional' | 'local',
            category: e.category as 'core_rule' | 'detail' | 'background',
            isEvolvable: e.isEvolvable,
            parentId: e.parentId ?? undefined,
            constraints: e.constraints ?? undefined,
            exceptions: e.exceptions ?? undefined,
            evolutionSpace: e.evolutionSpace ?? undefined,
            relatedTo: e.relatedTo ?? undefined,
            references: e.references ?? undefined,
            usageCount: e.usageCount,
            lastUsedAt: e.lastUsedAt ?? undefined,
            createdAt: e.createdAt,
            updatedAt: e.updatedAt,
          }))
        )

        return {
          ok: true,
          chapterNumber: chapter.chapterNumber,
          issues: issues.map((issue) => ({
            type: issue.type,
            severity: issue.severity,
            elementName: issue.elementName,
            description: issue.description,
            suggestion: issue.suggestion,
          })),
        }
      },
    }),
  }
}
