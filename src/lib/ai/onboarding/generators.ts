/**
 * Onboarding 各步 AI 生成器
 *
 * 统一路径：build*Prompt → runAgentObject(onboarding + system.*) 或 runAgent（风格锚点散文）
 * Schema 见 @/lib/ai/agents/schemas
 */

import { getAIProviderAsync } from '@/lib/ai/providers'
import { runAgent, runAgentObject } from '@/lib/ai/agents/runner'
import {
  OnboardingArchitectureSchema,
  OnboardingCharactersSchema,
  OnboardingWorldSchema,
  OnboardingChaptersSchema,
  OnboardingForeshadowingsSchema,
} from '@/lib/ai/agents/schemas'
import {
  dedupeGeneratedEntities,
} from './normalize'
import type {
  StoryArchitecture,
  CharacterEnsemble,
  WorldSettings,
  ChapterOutline,
  ForeshadowingPlan,
  StyleAnchorResult,
} from './types'

interface StepMeta {
  raw: string
  provider: string
  modelUsed: string
  duration: number
  tokensUsed?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  cost?: number
}

function toMeta(result: {
  text: string
  provider?: string
  modelUsed?: string
  duration?: number
  tokensUsed?: StepMeta['tokensUsed']
  cost?: number
}, model?: string): StepMeta {
  return {
    raw: result.text,
    provider: result.provider || 'unknown',
    modelUsed: result.modelUsed || model || 'unknown',
    duration: result.duration || 0,
    tokensUsed: result.tokensUsed,
    cost: result.cost,
  }
}

/** 生成故事架构 */
export async function generateArchitecture(
  prompt: string,
  model?: string
): Promise<{
  architecture: StoryArchitecture
  raw: string
  provider: string
  modelUsed: string
  duration: number
  tokensUsed?: StepMeta['tokensUsed']
  cost?: number
}> {
  const result = await runAgentObject({
    agentId: 'onboarding',
    systemSlot: 'system.architecture',
    model,
    temperature: 0.7,
    maxTokens: 6000,
    schema: OnboardingArchitectureSchema,
    schemaName: 'StoryArchitecture',
    variables: { taskBody: prompt, extraConstraints: '' },
  })

  const architecture = normalizeArchitecture(result.object)
  return { architecture, ...toMeta(result, model) }
}

function normalizeArchitecture(obj: unknown): StoryArchitecture {
  const data = obj as StoryArchitecture
  return {
    ...data,
    actStructure: (data.actStructure || []).map((a) => ({
      ...a,
      chapterRange: normalizeRange(a.chapterRange as any),
      emotionalArc: a.emotionalArc || '',
    })),
    volumePlan: (data.volumePlan || []).map((v) => ({
      ...v,
      chapterRange: normalizeRange(v.chapterRange as any),
    })),
    thematicThread: data.thematicThread || '',
    wordCountRationale: data.wordCountRationale || '',
  }
}

function normalizeRange(r: [number, number] | number[]): [number, number] {
  if (Array.isArray(r) && r.length >= 2) return [Number(r[0]), Number(r[1])]
  return [1, 1]
}

/** 生成角色群像 */
export async function generateCharacters(
  prompt: string,
  model?: string
): Promise<{
  characters: CharacterEnsemble
  raw: string
  provider: string
  modelUsed: string
  duration: number
  tokensUsed?: StepMeta['tokensUsed']
  cost?: number
}> {
  const result = await runAgentObject({
    agentId: 'onboarding',
    systemSlot: 'system.characters',
    model,
    temperature: 0.8,
    maxTokens: 8000,
    schema: OnboardingCharactersSchema,
    schemaName: 'CharacterEnsemble',
    variables: { taskBody: prompt, extraConstraints: '' },
  })
  return {
    characters: {
      ...result.object as CharacterEnsemble,
      characters: dedupeGeneratedEntities(
        (result.object as CharacterEnsemble).characters || []
      ),
    },
    ...toMeta(result, model),
  }
}

/** 生成世界观 */
export async function generateWorldElements(
  prompt: string,
  model?: string
): Promise<{
  worldSettings: WorldSettings
  raw: string
  provider: string
  modelUsed: string
  duration: number
  tokensUsed?: StepMeta['tokensUsed']
  cost?: number
}> {
  const result = await runAgentObject({
    agentId: 'onboarding',
    systemSlot: 'system.world',
    model,
    temperature: 0.7,
    maxTokens: 8000,
    schema: OnboardingWorldSchema,
    schemaName: 'WorldSettings',
    variables: { taskBody: prompt, extraConstraints: '' },
  })
  return {
    worldSettings: {
      ...result.object as WorldSettings,
      worldSettings: dedupeGeneratedEntities(
        (result.object as WorldSettings).worldSettings || []
      ),
    },
    ...toMeta(result, model),
  }
}

/** 生成章节大纲（总纲 + 前几章） */
export async function generateChapters(
  prompt: string,
  model?: string
): Promise<{
  chapters: ChapterOutline
  raw: string
  provider: string
  modelUsed: string
  duration: number
  tokensUsed?: StepMeta['tokensUsed']
  cost?: number
}> {
  const result = await runAgentObject({
    agentId: 'onboarding',
    systemSlot: 'system.chapters',
    model,
    temperature: 0.6,
    maxTokens: 6000,
    schema: OnboardingChaptersSchema,
    schemaName: 'ChapterOutline',
    variables: { taskBody: prompt, extraConstraints: '' },
  })
  return {
    chapters: result.object as ChapterOutline,
    ...toMeta(result, model),
  }
}

/** 生成伏笔计划 */
export async function generateForeshadowings(
  prompt: string,
  model?: string
): Promise<{
  foreshadowings: ForeshadowingPlan
  raw: string
  provider: string
  modelUsed: string
  duration: number
  tokensUsed?: StepMeta['tokensUsed']
  cost?: number
}> {
  const result = await runAgentObject({
    agentId: 'onboarding',
    systemSlot: 'system.foreshadowings',
    model,
    temperature: 0.7,
    maxTokens: 6000,
    schema: OnboardingForeshadowingsSchema,
    schemaName: 'ForeshadowingPlan',
    variables: { taskBody: prompt, extraConstraints: '' },
  })
  return {
    foreshadowings: result.object as ForeshadowingPlan,
    ...toMeta(result, model),
  }
}

/** 生成风格锚点样章正文（散文，非 JSON） */
export async function generateStyleAnchorText(
  prompt: string,
  model?: string
): Promise<{
  styleAnchor: StyleAnchorResult
  raw: string
  provider: string
  modelUsed: string
  duration: number
  tokensUsed?: StepMeta['tokensUsed']
  cost?: number
}> {
  const result = await runAgent({
    agentId: 'onboarding',
    systemSlot: 'system.style-anchor',
    model,
    temperature: 0.8,
    maxTokens: 3000,
    variables: { taskBody: prompt, extraConstraints: '' },
  })

  const content = result.text.trim()
  const chineseChars = (content.match(/[一-龥]/g) || []).length

  if (!content) {
    const ai = await getAIProviderAsync(model)
    throw new Error(`风格锚点生成失败（provider: ${ai.name}）`)
  }

  return {
    styleAnchor: { content, wordCount: chineseChars },
    ...toMeta(result, model),
  }
}
