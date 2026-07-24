/**
 * POST /api/onboarding/extract
 * 将当前步骤对话内容整理为可落库的结构化结果
 * JSON 步骤走 runAgentObject + 共享 schema；风格锚点走散文 runAgent
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { apiSuccess, withErrorHandler, ApiErrors } from '@/lib/api/response'
import { parseJsonBody } from '@/lib/api/validators'
import { StoryIdeaCardSchema } from '@/lib/api/schemas'
import { runAgent, runAgentObject } from '@/lib/ai/agents/runner'
import {
  OnboardingArchitectureSchema,
  OnboardingCharactersSchema,
  OnboardingWorldSchema,
  OnboardingChaptersSchema,
  OnboardingForeshadowingsSchema,
} from '@/lib/ai/agents/schemas'
import { calculateChapterCount } from '@/lib/ai/onboarding/normalize'
import {
  STEP_AGENT_ID,
  STEP_SYSTEM_SLOT,
  buildExtractTaskBody,
  getExtractSchemaInstruction,
} from '@/lib/ai/onboarding/bootstrap-chat'
import type { StepKey } from '@/components/onboarding/step3/types'

const StepKeySchema = z.enum([
  'architecture',
  'characters',
  'world',
  'volume',
  'foreshadowings',
  'styleAnchor',
])

const RequestSchema = z.object({
  stepKey: StepKeySchema,
  conversationText: z.string().min(1),
  idea: StoryIdeaCardSchema,
  projectTitle: z.string().default('未命名项目'),
  targetWords: z.number().int().min(200000).default(1000000),
  pace: z.enum(['fast', 'medium', 'slow']).default('medium'),
  audience: z.string().optional(),
  tone: z.string().optional(),
  pov: z.string().optional(),
  prior: z
    .object({
      architecture: z.any().optional(),
      characters: z.any().optional(),
      worldSettings: z.any().optional(),
      chapters: z.any().optional(),
      overallOutline: z.string().optional(),
      plannedTotalChapters: z.number().optional(),
    })
    .optional(),
  model: z.string().optional(),
})

function extractArr(v: unknown): unknown[] {
  if (Array.isArray(v)) return v
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    if (Array.isArray(o.characters)) return o.characters
    if (Array.isArray(o.worldSettings)) return o.worldSettings
    if (Array.isArray(o.chapters)) return o.chapters
    if (Array.isArray(o.foreshadowings)) return o.foreshadowings
  }
  return []
}

function normalizeStepPayload(stepKey: StepKey, raw: unknown): Record<string, unknown> {
  if (stepKey === 'styleAnchor') {
    const content = typeof raw === 'string' ? raw : String((raw as any)?.content ?? raw ?? '')
    return {
      content: content.trim(),
      wordCount: content.replace(/\s/g, '').length,
    }
  }

  const data = raw as Record<string, unknown>
  switch (stepKey) {
    case 'architecture': {
      const architecture = (data as any).architecture || data
      return { architecture }
    }
    case 'characters': {
      if (Array.isArray(data)) return { characters: { characters: data } }
      if (Array.isArray((data as any).characters)) {
        return { characters: { characters: (data as any).characters } }
      }
      const characters = (data as any).characters?.characters
        ? (data as any).characters
        : { characters: (data as any).characters || [] }
      return { characters }
    }
    case 'world': {
      if (Array.isArray(data)) return { worldSettings: { worldSettings: data } }
      if (Array.isArray((data as any).worldSettings)) {
        return { worldSettings: { worldSettings: (data as any).worldSettings } }
      }
      return {
        worldSettings:
          (data as any).worldSettings?.worldSettings != null
            ? (data as any).worldSettings
            : data,
      }
    }
    case 'volume': {
      const outline = (data as any).chapters?.chapters ? (data as any).chapters : data
      return outline as Record<string, unknown>
    }
    case 'foreshadowings': {
      if (Array.isArray(data)) return { foreshadowings: { foreshadowings: data } }
      if (Array.isArray((data as any).foreshadowings)) {
        return { foreshadowings: { foreshadowings: (data as any).foreshadowings } }
      }
      return data as Record<string, unknown>
    }
    default:
      return data as Record<string, unknown>
  }
}

function schemaForStep(stepKey: StepKey): z.ZodType<unknown> | null {
  switch (stepKey) {
    case 'architecture':
      return OnboardingArchitectureSchema
    case 'characters':
      return OnboardingCharactersSchema
    case 'world':
      return OnboardingWorldSchema
    case 'volume':
      return OnboardingChaptersSchema
    case 'foreshadowings':
      return OnboardingForeshadowingsSchema
    default:
      return null
  }
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const body = await parseJsonBody<unknown>(request)
    const data = RequestSchema.parse(body)
    const stepKey = data.stepKey as StepKey
    const agentId = STEP_AGENT_ID[stepKey]
    const systemSlot = STEP_SYSTEM_SLOT[stepKey]
    const calc = calculateChapterCount(data.targetWords, data.pace)

    const schemaHint = getExtractSchemaInstruction(stepKey)
    const taskRef = buildExtractTaskBody(stepKey, {
      idea: data.idea as any,
      projectTitle: data.projectTitle,
      targetWords: data.targetWords,
      pace: data.pace,
      audience: data.audience,
      tone: data.tone,
      pov: data.pov as any,
      architecture: data.prior?.architecture,
      characters: extractArr(data.prior?.characters),
      worldSettings: extractArr(data.prior?.worldSettings),
      chapters: extractArr(data.prior?.chapters),
      plannedTotalChapters: data.prior?.plannedTotalChapters,
      overallOutline: data.prior?.overallOutline,
    } as any)

    const isStyle = stepKey === 'styleAnchor'
    const userMessage = isStyle
      ? `请根据以下对话讨论，整理并输出最终样章正文（800-1200 字），不要说明文字。

【对话记录】
${data.conversationText.slice(0, 24000)}

【参考任务】
${taskRef.slice(0, 4000)}`
      : `请根据【对话记录】中已达成一致的内容，输出一份符合 schema 的结构化结果。

若对话未覆盖某些字段，请基于上下文合理补全，保持与对话不矛盾。

【Schema 说明】
${schemaHint}

【对话记录】
${data.conversationText.slice(0, 24000)}

【完整字段参考任务（可忽略数量上限，以对话为准做合理精简）】
${taskRef.slice(0, 6000)}`

    let payload: Record<string, unknown>

    if (isStyle) {
      const result = await runAgent({
        agentId,
        systemSlot,
        model: data.model,
        temperature: 0.75,
        maxTokens: 4000,
        userMessage,
        contextAppend: '当前任务是输出可直接作为风格锚点的样章正文。',
      })
      if (!result.text?.trim()) {
        return ApiErrors.badRequest('提取结果为空，请先多聊几轮再确认')
      }
      payload = normalizeStepPayload(stepKey, result.text)
    } else {
      const schema = schemaForStep(stepKey)
      if (!schema) {
        return ApiErrors.badRequest('未知步骤')
      }
      try {
        const result = await runAgentObject({
          agentId,
          systemSlot,
          model: data.model,
          temperature: 0.3,
          maxTokens: 8000,
          userMessage,
          contextAppend: '当前任务是结构化提取：严格按 schema 输出对象。',
          schema: schema as any,
          schemaName: `OnboardingExtract_${stepKey}`,
        })
        payload = normalizeStepPayload(stepKey, result.object)
      } catch (error) {
        console.error('extract structured failed:', error)
        return ApiErrors.badRequest(
          error instanceof Error
            ? `结构化提取失败：${error.message}`
            : '结构化提取失败，请再聊几轮后重试'
        )
      }
    }

    if (stepKey === 'architecture') {
      payload.chapterCalculation = calc
    }

    return apiSuccess({
      stepKey,
      data: payload,
    })
  })
}
