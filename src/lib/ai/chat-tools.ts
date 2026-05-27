import { tool, zodSchema } from 'ai'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import type { Prisma } from '@/lib/generated/prisma/client'
import { getWorldConsistencyChecker } from '@/lib/ai/world-consistency-checker'

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

const ForeshadowingTypeSchema = z.enum(['plot', 'character', 'world', 'mystery'])
const ForeshadowingStatusSchema = z.enum(['planned', 'planted', 'resolved', 'abandoned'])
const OutlineTypeSchema = z.enum(['volume', 'chapter', 'scene'])
const ChapterPlotTypeSchema = z.enum(['setup', 'conflict', 'climax', 'resolution'])

const GetProjectInfoInputSchema = z.object({
  includeChapters: z.boolean().optional().default(true),
  includeCharacters: z.boolean().optional().default(true),
  includeWorldElements: z.boolean().optional().default(true),
  chapterLimit: z.number().int().positive().max(50).optional().default(5),
  characterLimit: z.number().int().positive().max(50).optional().default(10),
  worldElementLimit: z.number().int().positive().max(50).optional().default(10),
})

const CreateChapterInputSchema = z.object({
  chapterNumber: z.number().int().positive(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  summary: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isKeyChapter: z.boolean().optional(),
  plotType: ChapterPlotTypeSchema.optional().nullable(),
})

const CreateOutlineInputSchema = z.object({
  type: OutlineTypeSchema,
  order: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  targetWords: z.number().int().positive().optional().nullable(),
  emotionalGoal: z.string().optional().nullable(),
  plotFunction: z.enum(['推进', '转折', '铺垫', '高潮', '过渡']).optional(),
  tensionLevel: z.number().int().min(1).max(10).optional(),
})

const UpdateOutlineInputSchema = z.object({
  outlineId: z.string().optional(),
  outlineTitle: z.string().optional(),
  updates: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional().nullable(),
    emotionalGoal: z.string().optional().nullable(),
    plotFunction: z.enum(['推进', '转折', '铺垫', '高潮', '过渡']).optional(),
    tensionLevel: z.number().int().min(1).max(10).optional(),
    targetWords: z.number().int().positive().optional().nullable(),
    status: z.enum(['planned', 'writing', 'completed']).optional(),
  }),
})

const CreateForeshadowingInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  type: ForeshadowingTypeSchema,
  importance: z.number().int().min(1).max(10).optional(),
  expectedChapterNumber: z.number().int().positive().optional().nullable(),
  relatedCharacters: z.union([z.array(z.string()), z.string()]).optional().nullable(),
  relatedElements: z.union([z.array(z.string()), z.string()]).optional().nullable(),
  tags: z.union([z.array(z.string()), z.string()]).optional().nullable(),
})

const ResolveForeshadowingInputSchema = z.object({
  foreshadowingId: z.string().optional(),
  foreshadowingTitle: z.string().optional(),
  resolvedContent: z.string().optional().nullable(),
})

const ListForeshadowingsInputSchema = z.object({
  status: ForeshadowingStatusSchema.optional(),
  type: ForeshadowingTypeSchema.optional(),
  importanceMin: z.number().int().min(1).max(10).optional(),
  limit: z.number().int().positive().max(50).optional().default(20),
})

const CheckConsistencyInputSchema = z.object({
  chapterId: z.string().optional(),
  chapterNumber: z.number().int().positive().optional(),
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
