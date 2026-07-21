import { z } from 'zod'

export const CharacterRoleSchema = z.enum(['protagonist', 'antagonist', 'supporting', 'minor'])
export const WorldElementTypeSchema = z.enum(['location', 'history', 'magic', 'organization', 'item', 'other'])
export const WorldElementScopeSchema = z.enum(['global', 'regional', 'local'])
export const WorldElementCategorySchema = z.enum(['core_rule', 'detail', 'background'])
export const ForeshadowingTypeSchema = z.enum(['plot', 'character', 'world', 'mystery'])
export const ForeshadowingStatusSchema = z.enum(['planned', 'planted', 'resolved', 'abandoned'])
export const OutlineTypeSchema = z.enum(['volume', 'chapter', 'scene'])
export const ChapterPlotTypeSchema = z.enum(['setup', 'conflict', 'climax', 'resolution'])

export const CreateCharacterInputSchema = z.object({
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

export const UpdateCharacterInputSchema = z.object({
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

export const CreateWorldElementInputSchema = z.object({
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

export const UpdateWorldElementInputSchema = z.object({
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

export const UpdateChapterContentInputSchema = z.object({
  chapterId: z.string().optional(),
  chapterNumber: z.number().int().positive().optional(),
  mode: z.enum(['replace', 'append', 'prepend']).optional().default('replace'),
  content: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  summary: z.string().optional(),
  notes: z.string().optional(),
})

export const GetProjectInfoInputSchema = z.object({
  includeChapters: z.boolean().optional().default(true),
  includeCharacters: z.boolean().optional().default(true),
  includeWorldElements: z.boolean().optional().default(true),
  chapterLimit: z.number().int().positive().max(50).optional().default(5),
  characterLimit: z.number().int().positive().max(50).optional().default(10),
  worldElementLimit: z.number().int().positive().max(50).optional().default(10),
})

export const CreateChapterInputSchema = z.object({
  chapterNumber: z.number().int().positive(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  summary: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isKeyChapter: z.boolean().optional(),
  plotType: ChapterPlotTypeSchema.optional().nullable(),
})

export const CreateOutlineInputSchema = z.object({
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

export const UpdateOutlineInputSchema = z.object({
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

export const CreateForeshadowingInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  type: ForeshadowingTypeSchema,
  importance: z.number().int().min(1).max(10).optional(),
  expectedChapterNumber: z.number().int().positive().optional().nullable(),
  relatedCharacters: z.union([z.array(z.string()), z.string()]).optional().nullable(),
  relatedElements: z.union([z.array(z.string()), z.string()]).optional().nullable(),
  tags: z.union([z.array(z.string()), z.string()]).optional().nullable(),
})

export const ResolveForeshadowingInputSchema = z.object({
  foreshadowingId: z.string().optional(),
  foreshadowingTitle: z.string().optional(),
  resolvedContent: z.string().optional().nullable(),
})

export const ListForeshadowingsInputSchema = z.object({
  status: ForeshadowingStatusSchema.optional(),
  type: ForeshadowingTypeSchema.optional(),
  importanceMin: z.number().int().min(1).max(10).optional(),
  limit: z.number().int().positive().max(50).optional().default(20),
})

export const CheckConsistencyInputSchema = z.object({
  chapterId: z.string().optional(),
  chapterNumber: z.number().int().positive().optional(),
})
