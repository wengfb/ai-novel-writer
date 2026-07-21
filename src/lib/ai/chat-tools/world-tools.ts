import { tool, zodSchema } from 'ai'
import { prisma } from '@/lib/db/prisma'
import type { Prisma } from '@/lib/generated/prisma/client'
import { CreateWorldElementInputSchema, UpdateWorldElementInputSchema } from './schemas'
import { normalizeJsonValue } from './helpers'
import type { ChatToolOptions } from './types'

export function createWorldTools({ projectId }: ChatToolOptions) {
  return {
    createWorldElement: tool({
      description: '创建世界观元素。',
      inputSchema: zodSchema(CreateWorldElementInputSchema),
      needsApproval: true,
      execute: async (input) => {
        const attributes = normalizeJsonValue(input.attributes)
        const constraints = normalizeJsonValue(input.constraints)
        const exceptions = normalizeJsonValue(input.exceptions)
        const relatedTo = Array.isArray(input.relatedTo) ? JSON.stringify(input.relatedTo) : input.relatedTo ?? null
        const references = Array.isArray(input.references) ? JSON.stringify(input.references) : input.references ?? null

        const element = await prisma.worldElement.create({
          data: {
            projectId,
            name: input.name,
            type: input.type,
            description: input.description,
            attributes,
            importance: input.importance ?? 5,
            scope: input.scope ?? 'local',
            category: input.category ?? 'detail',
            isEvolvable: input.isEvolvable ?? false,
            parentId: input.parentId ?? null,
            constraints,
            exceptions,
            evolutionSpace: input.evolutionSpace ?? null,
            relatedTo,
            references,
          },
        })

        return {
          ok: true,
          worldElement: {
            id: element.id,
            name: element.name,
            type: element.type,
            scope: element.scope,
          },
        }
      },
    }),
    updateWorldElement: tool({
      description: '更新世界观元素（通过元素ID或名称）。',
      inputSchema: zodSchema(UpdateWorldElementInputSchema),
      needsApproval: true,
      execute: async (input) => {
        const targetId = input.elementId
        const targetName = input.elementName

        if (!targetId && !targetName) {
          return { ok: false, error: '缺少元素ID或名称' }
        }

        const element = targetId
          ? await prisma.worldElement.findUnique({ where: { id: targetId } })
          : await prisma.worldElement.findFirst({
            where: { projectId, name: targetName as string },
          })

        if (!element) {
          return { ok: false, error: '未找到匹配的世界观元素' }
        }

        const updates = input.updates
        const updateData: Prisma.WorldElementUncheckedUpdateInput = {}

        if (updates.name !== undefined) updateData.name = updates.name
        if (updates.type !== undefined) updateData.type = updates.type
        if (updates.description !== undefined) updateData.description = updates.description
        if (updates.importance !== undefined) updateData.importance = updates.importance
        if (updates.scope !== undefined) updateData.scope = updates.scope
        if (updates.category !== undefined) updateData.category = updates.category
        if (updates.isEvolvable !== undefined) updateData.isEvolvable = updates.isEvolvable
        if (updates.parentId !== undefined) updateData.parentId = updates.parentId
        if (updates.evolutionSpace !== undefined) updateData.evolutionSpace = updates.evolutionSpace

        if (updates.attributes !== undefined) {
          updateData.attributes = normalizeJsonValue(updates.attributes)
        }
        if (updates.constraints !== undefined) {
          updateData.constraints = normalizeJsonValue(updates.constraints)
        }
        if (updates.exceptions !== undefined) {
          updateData.exceptions = normalizeJsonValue(updates.exceptions)
        }
        if (updates.relatedTo !== undefined) {
          updateData.relatedTo = Array.isArray(updates.relatedTo)
            ? JSON.stringify(updates.relatedTo)
            : updates.relatedTo
        }
        if (updates.references !== undefined) {
          updateData.references = Array.isArray(updates.references)
            ? JSON.stringify(updates.references)
            : updates.references
        }

        if (Object.keys(updateData).length === 0) {
          return { ok: false, error: '没有可更新的字段' }
        }

        const updated = await prisma.worldElement.update({
          where: { id: element.id },
          data: updateData,
        })

        return {
          ok: true,
          worldElement: {
            id: updated.id,
            name: updated.name,
            type: updated.type,
            scope: updated.scope,
          },
        }
      },
    }),
  }
}
