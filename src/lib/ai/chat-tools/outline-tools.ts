import { tool, zodSchema } from 'ai'
import { prisma } from '@/lib/db/prisma'
import type { Prisma } from '@/lib/generated/prisma/client'
import { CreateOutlineInputSchema, UpdateOutlineInputSchema } from './schemas'
import type { ChatToolOptions } from './types'

export function createOutlineTools({ projectId }: ChatToolOptions) {
  return {
    createOutline: tool({
      description: '创建大纲节点（卷/章/场景）。',
      inputSchema: zodSchema(CreateOutlineInputSchema),
      needsApproval: true,
      execute: async (input) => {
        const outline = await prisma.outline.create({
          data: {
            projectId,
            type: input.type,
            order: input.order,
            title: input.title,
            description: input.description ?? null,
            parentId: input.parentId ?? null,
            targetWords: input.targetWords ?? null,
            emotionalGoal: input.emotionalGoal ?? null,
            plotFunction: input.plotFunction ?? '推进',
            tensionLevel: input.tensionLevel ?? 5,
          },
        })

        return {
          ok: true,
          outline: {
            id: outline.id,
            title: outline.title,
            type: outline.type,
          },
        }
      },
    }),
    updateOutline: tool({
      description: '更新大纲节点（通过ID或标题定位）。',
      inputSchema: zodSchema(UpdateOutlineInputSchema),
      needsApproval: true,
      execute: async (input) => {
        const targetId = input.outlineId
        const targetTitle = input.outlineTitle

        if (!targetId && !targetTitle) {
          return { ok: false, error: '缺少大纲ID或标题' }
        }

        const outline = targetId
          ? await prisma.outline.findUnique({ where: { id: targetId } })
          : await prisma.outline.findFirst({
            where: { projectId, title: targetTitle as string },
          })

        if (!outline) {
          return { ok: false, error: '未找到匹配的大纲节点' }
        }

        const updates = input.updates
        const updateData: Prisma.OutlineUpdateInput = {}

        if (updates.title !== undefined) updateData.title = updates.title
        if (updates.description !== undefined) updateData.description = updates.description
        if (updates.emotionalGoal !== undefined) updateData.emotionalGoal = updates.emotionalGoal
        if (updates.plotFunction !== undefined) updateData.plotFunction = updates.plotFunction
        if (updates.tensionLevel !== undefined) updateData.tensionLevel = updates.tensionLevel
        if (updates.targetWords !== undefined) updateData.targetWords = updates.targetWords
        if (updates.status !== undefined) updateData.status = updates.status

        if (Object.keys(updateData).length === 0) {
          return { ok: false, error: '没有可更新的字段' }
        }

        const updated = await prisma.outline.update({
          where: { id: outline.id },
          data: updateData,
        })

        return {
          ok: true,
          outline: {
            id: updated.id,
            title: updated.title,
            type: updated.type,
          },
        }
      },
    }),
  }
}
