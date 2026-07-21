import { tool, zodSchema } from 'ai'
import { prisma } from '@/lib/db/prisma'
import type { Prisma } from '@/lib/generated/prisma/client'
import { CreateCharacterInputSchema, UpdateCharacterInputSchema } from './schemas'
import { normalizeArrayLike, normalizeJsonValue } from './helpers'
import type { ChatToolOptions } from './types'

export function createCharacterTools({ projectId }: ChatToolOptions) {
  return {
    createCharacter: tool({
      description: '创建角色档案。',
      inputSchema: zodSchema(CreateCharacterInputSchema),
      needsApproval: true,
      execute: async (input) => {
        const character = await prisma.character.create({
          data: {
            projectId,
            name: input.name,
            nickname: input.nickname ?? null,
            age: input.age ?? null,
            gender: input.gender ?? null,
            importance: input.importance ?? 5,
            role: input.role ?? 'supporting',
            appearance: input.appearance ?? null,
            personality: normalizeArrayLike(input.personality),
            backstory: input.backstory ?? null,
            motivation: input.motivation ?? null,
            dialogueStyle: input.dialogueStyle ?? null,
            characterArc: input.characterArc ?? null,
            avatar: input.avatar ?? null,
            relationships: normalizeJsonValue(input.relationships),
          },
        })

        return {
          ok: true,
          character: {
            id: character.id,
            name: character.name,
            role: character.role,
            importance: character.importance,
          },
        }
      },
    }),
    updateCharacter: tool({
      description: '更新角色信息（通过角色ID或角色名）。',
      inputSchema: zodSchema(UpdateCharacterInputSchema),
      needsApproval: true,
      execute: async (input) => {
        const targetId = input.characterId
        const targetName = input.characterName

        if (!targetId && !targetName) {
          return { ok: false, error: '缺少角色ID或角色名' }
        }

        const character = targetId
          ? await prisma.character.findUnique({ where: { id: targetId } })
          : await prisma.character.findFirst({
            where: { projectId, name: targetName as string },
          })

        if (!character) {
          return { ok: false, error: '未找到匹配的角色' }
        }

        const updates = input.updates
        const updateData: Prisma.CharacterUpdateInput = {}

        if (updates.name !== undefined) updateData.name = updates.name
        if (updates.nickname !== undefined) updateData.nickname = updates.nickname
        if (updates.age !== undefined) updateData.age = updates.age
        if (updates.gender !== undefined) updateData.gender = updates.gender
        if (updates.importance !== undefined) updateData.importance = updates.importance
        if (updates.role !== undefined) updateData.role = updates.role
        if (updates.appearance !== undefined) updateData.appearance = updates.appearance
        if (updates.personality !== undefined) {
          updateData.personality = normalizeArrayLike(updates.personality)
        }
        if (updates.backstory !== undefined) updateData.backstory = updates.backstory
        if (updates.motivation !== undefined) updateData.motivation = updates.motivation
        if (updates.dialogueStyle !== undefined) updateData.dialogueStyle = updates.dialogueStyle
        if (updates.characterArc !== undefined) updateData.characterArc = updates.characterArc
        if (updates.avatar !== undefined) updateData.avatar = updates.avatar
        if (updates.relationships !== undefined) {
          updateData.relationships = normalizeJsonValue(updates.relationships)
        }

        if (Object.keys(updateData).length === 0) {
          return { ok: false, error: '没有可更新的字段' }
        }

        const updated = await prisma.character.update({
          where: { id: character.id },
          data: updateData,
        })

        return {
          ok: true,
          character: {
            id: updated.id,
            name: updated.name,
            role: updated.role,
            importance: updated.importance,
          },
        }
      },
    }),
  }
}
