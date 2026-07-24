/**
 * 任务型结构化输出 Schema（与 chat-tools / API 共用契约）
 *
 * 约定：
 * - 业务侧禁止再从模型散文里 regex 抠 JSON
 * - 任务按钮走 runAgentObject + 本文件 schema
 * - 对话写库仍走 chat-tools，字段形状尽量对齐
 */

import { z } from 'zod'
import {
  CharacterRoleSchema,
  WorldElementTypeSchema,
  WorldElementScopeSchema,
  WorldElementCategorySchema,
  ForeshadowingTypeSchema,
} from '@/lib/ai/chat-tools/schemas'
import { GeneratedOnboardingOutlineSchema, StoryIdeaCardSchema } from '@/lib/api/schemas'

// ---------- 创意 ----------

export const StoryIdeaCardOutputSchema = StoryIdeaCardSchema
export const StoryIdeaListSchema = z.array(StoryIdeaCardOutputSchema).min(1).max(5)

// ---------- 角色 / 世界观（生成卡片，对齐 create 工具字段） ----------

export const GeneratedCharacterCardSchema = z.object({
  name: z.string().min(1),
  nickname: z.string().optional().nullable(),
  age: z.union([z.number().int().positive(), z.string()]).optional().nullable(),
  gender: z.string().optional().nullable(),
  role: CharacterRoleSchema.or(z.string()).optional(),
  appearance: z.string().optional().nullable(),
  personality: z.union([z.string(), z.array(z.string())]).optional(),
  backstory: z.string().optional().nullable(),
  motivation: z.string().optional().nullable(),
  dialogueStyle: z.string().optional().nullable(),
  dialogueExample: z.array(z.string()).optional(),
  characterArc: z.string().optional().nullable(),
  relationships: z
    .union([z.record(z.string(), z.string()), z.string(), z.array(z.any())])
    .optional()
    .nullable(),
})

export const GeneratedWorldElementCardSchema = z.object({
  name: z.string().min(1),
  type: WorldElementTypeSchema.or(z.string()).optional(),
  description: z.string().min(1),
  importance: z.number().int().min(1).max(10).optional(),
  scope: WorldElementScopeSchema.optional(),
  category: WorldElementCategorySchema.optional(),
  isEvolvable: z.boolean().optional(),
  attributes: z.union([z.record(z.string(), z.any()), z.string()]).optional().nullable(),
  constraints: z
    .union([
      z.array(z.object({ description: z.string(), rule: z.string().optional() })),
      z.record(z.string(), z.any()),
      z.string(),
    ])
    .optional()
    .nullable(),
  exceptions: z
    .union([
      z.array(z.object({ condition: z.string(), description: z.string().optional() })),
      z.record(z.string(), z.any()),
      z.string(),
    ])
    .optional()
    .nullable(),
  evolutionSpace: z.string().optional().nullable(),
  storyRelation: z.string().optional().nullable(),
  relatedTo: z.union([z.array(z.string()), z.string()]).optional().nullable(),
})

// ---------- 大纲 ----------

export const OutlineGenerationSchema = GeneratedOnboardingOutlineSchema

export const OutlineRefinementSchema = z.object({
  chapterNumber: z.number().int().positive(),
  scenes: z
    .array(
      z.object({
        order: z.number().int().positive().optional(),
        title: z.string().optional(),
        goal: z.string().optional(),
        location: z.string().optional(),
        characters: z.array(z.string()).optional(),
        keyEvents: z.array(z.string()).optional(),
        estimatedWords: z.number().int().positive().optional(),
      })
    )
    .min(1),
})

// ---------- 章节场景规划 ----------

export const ScenePlanItemSchema = z.object({
  title: z.string().min(1),
  goal: z.string().min(1),
  location: z.string().optional(),
  characters: z.array(z.string()).optional(),
  estimatedWords: z.number().int().positive().optional(),
})

export const ScenePlanSchema = z.object({
  scenes: z.array(ScenePlanItemSchema).min(1).max(8),
})

// ---------- 一致性 ----------

export const ConsistencyReportSchema = z.object({
  personalityConsistency: z.number().min(0).max(10).optional(),
  dialogueConsistency: z.number().min(0).max(10).optional(),
  hasContradictions: z.boolean().optional(),
  issues: z.array(z.string()).optional(),
  suggestions: z.array(z.string()).optional(),
})

// ---------- Onboarding 各步 ----------

export const OnboardingArchitectureSchema = z.object({
  storySummary: z.string().min(1),
  mainConflict: z.string().min(1),
  suggestedTotalWords: z.number().int().positive(),
  wordCountRationale: z.string().optional().default(''),
  actStructure: z
    .array(
      z.object({
        act: z.number().int().positive(),
        chapterRange: z.tuple([z.number(), z.number()]).or(z.array(z.number()).min(2).max(2)),
        description: z.string(),
        emotionalArc: z.string().optional().default(''),
      })
    )
    .min(1),
  volumePlan: z
    .array(
      z.object({
        volumeNumber: z.number().int().positive(),
        title: z.string(),
        description: z.string(),
        chapterRange: z.tuple([z.number(), z.number()]).or(z.array(z.number()).min(2).max(2)),
      })
    )
    .min(1),
  thematicThread: z.string().optional().default(''),
})

export const OnboardingCharacterItemSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  description: z.string().optional().default(''),
  personality: z.union([z.string(), z.array(z.string())]),
  goal: z.string().optional().default(''),
  characterArc: z.string().optional().default(''),
  dialogueStyle: z.string().optional().default(''),
  relationships: z
    .array(
      z.object({
        targetName: z.string(),
        relation: z.string(),
        description: z.string().optional().default(''),
      })
    )
    .optional()
    .default([]),
  firstAppearance: z.string().optional().default(''),
})

export const OnboardingCharactersSchema = z.object({
  characters: z.array(OnboardingCharacterItemSchema).min(1),
})

export const OnboardingWorldElementSchema = z.object({
  type: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  importance: z.number().int().min(1).max(10).optional().default(5),
  scope: z.enum(['global', 'regional', 'local']).optional().default('global'),
  category: z.enum(['core_rule', 'detail', 'background']).optional().default('detail'),
  constraints: z
    .array(z.object({ description: z.string(), rule: z.string().optional().default('') }))
    .optional()
    .default([]),
  exceptions: z
    .array(z.object({ condition: z.string(), description: z.string().optional().default('') }))
    .optional()
    .default([]),
  relatedTo: z.array(z.string()).optional().default([]),
  isEvolvable: z.boolean().optional().default(false),
  evolutionSpace: z.string().optional().default(''),
})

export const OnboardingWorldSchema = z.object({
  worldSettings: z.array(OnboardingWorldElementSchema).min(1),
})

export const OnboardingChapterItemSchema = z.object({
  chapterNumber: z.number().int().positive(),
  title: z.string().min(1),
  summary: z.string().min(1),
  emotionalGoal: z.string().optional().default(''),
  plotFunction: z.string().optional().default('推进'),
  tensionLevel: z.number().int().min(1).max(10).optional().default(5),
  keyEvents: z.array(z.string()).optional().default([]),
  characters: z.array(z.string()).optional().default([]),
  estimatedWords: z.number().int().positive().optional().default(2000),
  act: z.number().int().positive().optional().default(1),
  causalFrom: z.string().optional().default(''),
  causalTo: z.string().optional().default(''),
})

export const OnboardingChaptersSchema = z.object({
  overallOutline: z.string().optional(),
  plannedTotalChapters: z.number().int().positive().optional(),
  chapters: z.array(OnboardingChapterItemSchema).min(1),
  suggestedTotalWords: z.number().int().positive().optional(),
  wordCountRationale: z.string().optional().default(''),
  tensionArcSummary: z.string().optional().default(''),
})

export const OnboardingForeshadowingItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: ForeshadowingTypeSchema.or(z.string()),
  importance: z.number().int().min(1).max(10).optional().default(5),
  plantedInChapterNumber: z.number().int().positive().optional(),
  expectedChapterNumber: z.number().int().positive().optional(),
  relatedCharacters: z.array(z.string()).optional().default([]),
  relatedElements: z.array(z.string()).optional().default([]),
})

export const OnboardingForeshadowingsSchema = z.object({
  foreshadowings: z.array(OnboardingForeshadowingItemSchema).min(1),
})

export type StoryIdeaList = z.infer<typeof StoryIdeaListSchema>
export type GeneratedCharacterCard = z.infer<typeof GeneratedCharacterCardSchema>
export type GeneratedWorldElementCard = z.infer<typeof GeneratedWorldElementCardSchema>
export type ScenePlanOutput = z.infer<typeof ScenePlanSchema>
export type ConsistencyReport = z.infer<typeof ConsistencyReportSchema>
