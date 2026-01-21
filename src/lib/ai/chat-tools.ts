import { tool, zodSchema } from 'ai'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'

const CharacterRoleSchema = z.enum(['protagonist', 'antagonist', 'supporting', 'minor'])
const WorldElementTypeSchema = z.enum(['location', 'history', 'magic', 'organization', 'item', 'other'])
const WorldElementScopeSchema = z.enum(['global', 'regional', 'local'])
const WorldElementCategorySchema = z.enum(['core_rule', 'detail', 'background'])

const CreateCharacterInputSchema = z.object({
  name: z.string().min(1).max(100),
  nickname: z.string().max(50).optional().nullable(),
  age: z.number().int().positive().optional().nullable(),
  gender: z.string().max(20).optional().nullable(),
  importance: z.number().int().min(1).max(10).optional(),
  role: CharacterRoleSchema.optional(),
  appearance: z.string().optional().nullable(),
  personality: z.union([z.string(), z.array(z.string())]).optional(),
  backstory: z.string().optional().nullable(),
  motivation: z.string().optional().nullable(),
  dialogueStyle: z.string().optional().nullable(),
  characterArc: z.string().optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  relationships: z.union([z.record(z.string(), z.string()), z.string()]).optional().nullable(),
})

const UpdateCharacterInputSchema = z.object({
  characterId: z.string().optional(),
  characterName: z.string().optional(),
  updates: z.object({
    name: z.string().min(1).max(100).optional(),
    nickname: z.string().max(50).optional().nullable(),
    age: z.number().int().positive().optional().nullable(),
    gender: z.string().max(20).optional().nullable(),
    importance: z.number().int().min(1).max(10).optional(),
    role: CharacterRoleSchema.optional(),
    appearance: z.string().optional().nullable(),
    personality: z.union([z.string(), z.array(z.string())]).optional(),
    backstory: z.string().optional().nullable(),
    motivation: z.string().optional().nullable(),
    dialogueStyle: z.string().optional().nullable(),
    characterArc: z.string().optional().nullable(),
    avatar: z.string().url().optional().nullable(),
    relationships: z.union([z.record(z.string(), z.string()), z.string()]).optional().nullable(),
  }),
})

const CreateWorldElementInputSchema = z.object({
  name: z.string().min(1).max(200),
  type: WorldElementTypeSchema,
  description: z.string().min(1),
  attributes: z.union([z.record(z.string(), z.any()), z.string()]).optional().nullable(),
  importance: z.number().int().min(1).max(10).optional(),
  scope: WorldElementScopeSchema.optional(),
  category: WorldElementCategorySchema.optional(),
  isEvolvable: z.boolean().optional(),
  parentId: z.string().optional().nullable(),
  constraints: z.union([z.record(z.string(), z.any()), z.string(), z.array(z.any())]).optional().nullable(),
  exceptions: z.union([z.record(z.string(), z.any()), z.string(), z.array(z.any())]).optional().nullable(),
  evolutionSpace: z.string().optional().nullable(),
  relatedTo: z.union([z.array(z.string()), z.string()]).optional().nullable(),
  references: z.union([z.array(z.string()), z.string()]).optional().nullable(),
})

const UpdateWorldElementInputSchema = z.object({
  elementId: z.string().optional(),
  elementName: z.string().optional(),
  updates: z.object({
    name: z.string().min(1).max(200).optional(),
    type: WorldElementTypeSchema.optional(),
    description: z.string().optional(),
    attributes: z.union([z.record(z.string(), z.any()), z.string()]).optional().nullable(),
    importance: z.number().int().min(1).max(10).optional(),
    scope: WorldElementScopeSchema.optional(),
    category: WorldElementCategorySchema.optional(),
    isEvolvable: z.boolean().optional(),
    parentId: z.string().optional().nullable(),
    constraints: z.union([z.record(z.string(), z.any()), z.string(), z.array(z.any())]).optional().nullable(),
    exceptions: z.union([z.record(z.string(), z.any()), z.string(), z.array(z.any())]).optional().nullable(),
    evolutionSpace: z.string().optional().nullable(),
    relatedTo: z.union([z.array(z.string()), z.string()]).optional().nullable(),
    references: z.union([z.array(z.string()), z.string()]).optional().nullable(),
  }),
})

const UpdateChapterContentInputSchema = z.object({
  chapterId: z.string().optional(),
  chapterNumber: z.number().int().positive().optional(),
  mode: z.enum(['replace', 'append', 'prepend']).optional().default('replace'),
  content: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  summary: z.string().optional(),
  notes: z.string().optional(),
})

const GetProjectInfoInputSchema = z.object({
  includeChapters: z.boolean().optional().default(true),
  includeCharacters: z.boolean().optional().default(true),
  includeWorldElements: z.boolean().optional().default(true),
  chapterLimit: z.number().int().positive().max(50).optional().default(5),
  characterLimit: z.number().int().positive().max(50).optional().default(10),
  worldElementLimit: z.number().int().positive().max(50).optional().default(10),
})

type ChatToolOptions = {
  projectId: string
  chapterId?: string
}

function normalizeArrayLike(value?: string | string[] | null): string | null {
  if (!value) return null
  return Array.isArray(value) ? value.join('、') : value
}

function normalizeJsonValue(value?: unknown): string | null {
  if (value === undefined || value === null) return null
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

async function updateProjectStats(projectId: string) {
  const [totalWords, chapterCount] = await Promise.all([
    prisma.chapter.aggregate({
      where: { projectId },
      _sum: { wordCount: true },
    }),
    prisma.chapter.count({ where: { projectId } }),
  ])

  await prisma.project.update({
    where: { id: projectId },
    data: {
      totalWords: totalWords._sum.wordCount || 0,
      chapterCount,
    },
  })
}

function countWords(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
  return chineseChars + englishWords
}

export function buildChatTools(options: ChatToolOptions) {
  const { projectId, chapterId } = options

  return {
    createCharacter: tool({
      description: '创建角色档案。',
      inputSchema: zodSchema(CreateCharacterInputSchema),
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
        const updateData: Record<string, any> = {}

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
    createWorldElement: tool({
      description: '创建世界观元素。',
      inputSchema: zodSchema(CreateWorldElementInputSchema),
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
        const updateData: Record<string, any> = {}

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
    updateChapterContent: tool({
      description: '修改章节内容（替换/追加/前置）。',
      inputSchema: zodSchema(UpdateChapterContentInputSchema),
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

        const updateData: Record<string, any> = {
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

        const result: any = {
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
