import { tool, zodSchema } from 'ai'
import { prisma } from '@/lib/db/prisma'
import type { Prisma } from '@/lib/generated/prisma/client'
import {
  CreateForeshadowingInputSchema,
  ListForeshadowingsInputSchema,
  ResolveForeshadowingInputSchema,
} from './schemas'
import type { ChatToolOptions } from './types'

export function createForeshadowingTools({ projectId, chapterId }: ChatToolOptions) {
  return {
    createForeshadowing: tool({
      description: '创建伏笔记录，用于后续章节回收。',
      inputSchema: zodSchema(CreateForeshadowingInputSchema),
      needsApproval: true,
      execute: async (input) => {
        const relatedCharacters = Array.isArray(input.relatedCharacters)
          ? JSON.stringify(input.relatedCharacters)
          : input.relatedCharacters ?? null
        const relatedElements = Array.isArray(input.relatedElements)
          ? JSON.stringify(input.relatedElements)
          : input.relatedElements ?? null
        const tags = Array.isArray(input.tags)
          ? JSON.stringify(input.tags)
          : input.tags ?? null

        const foreshadowing = await prisma.foreshadowing.create({
          data: {
            projectId,
            title: input.title,
            description: input.description,
            type: input.type,
            importance: input.importance ?? 5,
            expectedChapterNumber: input.expectedChapterNumber ?? null,
            relatedCharacters,
            relatedElements,
            tags,
            status: 'planned',
          },
        })

        return {
          ok: true,
          foreshadowing: {
            id: foreshadowing.id,
            title: foreshadowing.title,
            type: foreshadowing.type,
            status: foreshadowing.status,
          },
        }
      },
    }),
    resolveForeshadowing: tool({
      description: '标记伏笔已回收（通过ID或标题定位）。',
      inputSchema: zodSchema(ResolveForeshadowingInputSchema),
      needsApproval: true,
      execute: async (input) => {
        const targetId = input.foreshadowingId
        const targetTitle = input.foreshadowingTitle

        if (!targetId && !targetTitle) {
          return { ok: false, error: '缺少伏笔ID或标题' }
        }

        const foreshadowing = targetId
          ? await prisma.foreshadowing.findUnique({ where: { id: targetId } })
          : await prisma.foreshadowing.findFirst({
            where: { projectId, title: targetTitle as string },
          })

        if (!foreshadowing) {
          return { ok: false, error: '未找到匹配的伏笔' }
        }

        if (foreshadowing.status === 'resolved') {
          return { ok: false, error: '该伏笔已被回收' }
        }

        const updated = await prisma.foreshadowing.update({
          where: { id: foreshadowing.id },
          data: {
            status: 'resolved',
            resolvedInChapterId: chapterId ?? null,
            resolvedContent: input.resolvedContent ?? null,
            resolvedAt: new Date(),
          },
        })

        return {
          ok: true,
          foreshadowing: {
            id: updated.id,
            title: updated.title,
            type: updated.type,
            status: updated.status,
          },
        }
      },
    }),
    listForeshadowings: tool({
      description: '查询伏笔列表，可按状态/类型/重要性筛选。',
      inputSchema: zodSchema(ListForeshadowingsInputSchema),
      execute: async (input) => {
        const where: Prisma.ForeshadowingWhereInput = { projectId }

        if (input.status) where.status = input.status
        if (input.type) where.type = input.type
        if (input.importanceMin) {
          where.importance = { gte: input.importanceMin }
        }

        const [foreshadowings, total] = await Promise.all([
          prisma.foreshadowing.findMany({
            where,
            orderBy: { importance: 'desc' },
            take: input.limit,
            select: {
              id: true,
              title: true,
              description: true,
              type: true,
              importance: true,
              status: true,
              expectedChapterNumber: true,
              resolvedInChapterId: true,
            },
          }),
          prisma.foreshadowing.count({ where }),
        ])

        return {
          ok: true,
          foreshadowings,
          total,
        }
      },
    }),
  }
}
