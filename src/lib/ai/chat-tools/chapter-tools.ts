import { tool, zodSchema } from 'ai'
import { prisma } from '@/lib/db/prisma'
import type { Prisma } from '@/lib/generated/prisma/client'
import { CreateChapterInputSchema, UpdateChapterContentInputSchema } from './schemas'
import { countWords, updateProjectStats } from './helpers'
import type { ChatToolOptions } from './types'

export function createChapterTools({ projectId, chapterId }: ChatToolOptions) {
  return {
    updateChapterContent: tool({
      description: '修改章节内容（替换/追加/前置）。',
      inputSchema: zodSchema(UpdateChapterContentInputSchema),
      needsApproval: true,
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

        let nextContent = input.content
        if (input.mode === 'append') {
          nextContent = `${chapter.content}\n\n${input.content}`
        } else if (input.mode === 'prepend') {
          nextContent = `${input.content}\n\n${chapter.content}`
        }

        const updateData: Prisma.ChapterUpdateInput = {
          content: nextContent,
          wordCount: countWords(nextContent),
        }
        if (input.title !== undefined) updateData.title = input.title
        if (input.summary !== undefined) updateData.summary = input.summary
        if (input.notes !== undefined) updateData.notes = input.notes

        const updated = await prisma.chapter.update({
          where: { id: chapter.id },
          data: updateData,
        })

        await updateProjectStats(projectId)

        return {
          ok: true,
          chapter: {
            id: updated.id,
            chapterNumber: updated.chapterNumber,
            title: updated.title,
            wordCount: updated.wordCount,
          },
        }
      },
    }),
    createChapter: tool({
      description: '创建新章节。',
      inputSchema: zodSchema(CreateChapterInputSchema),
      needsApproval: true,
      execute: async (input) => {
        const chapter = await prisma.chapter.create({
          data: {
            projectId,
            chapterNumber: input.chapterNumber,
            title: input.title,
            content: input.content,
            wordCount: countWords(input.content),
            summary: input.summary ?? null,
            notes: input.notes ?? null,
            isKeyChapter: input.isKeyChapter ?? false,
            plotType: input.plotType ?? null,
          },
        })

        await updateProjectStats(projectId)

        return {
          ok: true,
          chapter: {
            id: chapter.id,
            chapterNumber: chapter.chapterNumber,
            title: chapter.title,
          },
        }
      },
    }),
  }
}
