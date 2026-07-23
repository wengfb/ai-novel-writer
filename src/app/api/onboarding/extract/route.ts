/**
 * POST /api/onboarding/extract
 * 将当前步骤对话内容整理为可落库的结构化结果（JSON / 样章正文）
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { apiSuccess, withErrorHandler, ApiErrors } from '@/lib/api/response'
import { parseJsonBody } from '@/lib/api/validators'
import { StoryIdeaCardSchema } from '@/lib/api/schemas'
import { runAgent } from '@/lib/ai/agents/runner'
import { calculateChapterCount } from '@/lib/ai/onboarding/normalize'
import {
  STEP_AGENT_ID,
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
  /** 已确认的前置步骤数据（extract 需要完整 schema 时用） */
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

function extractJSON(output: string): unknown {
  const trimmed = output.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    // continue
  }
  const codeBlockMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/)
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1])
    } catch {
      // continue
    }
  }
  const bracketMatch = trimmed.match(/\{[\s\S]*\}/) || trimmed.match(/\[[\s\S]*\]/)
  if (bracketMatch) {
    return JSON.parse(bracketMatch[0])
  }
  throw new Error('无法从 AI 输出中提取有效 JSON')
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
      const characters = (data as any).characters?.characters
        ? (data as any).characters
        : { characters: Array.isArray((data as any).characters) ? (data as any).characters : (data as any).characters || [] }
      // 若直接是数组
      if (Array.isArray(data)) return { characters: { characters: data } }
      if (Array.isArray((data as any).characters)) {
        return { characters: { characters: (data as any).characters } }
      }
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
      // 前端/finalize 期望 chapters 字段
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

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const body = await parseJsonBody<unknown>(request)
    const data = RequestSchema.parse(body)
    const stepKey = data.stepKey as StepKey
    const agentId = STEP_AGENT_ID[stepKey]
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
      : `你是结构化提取助手。请根据【对话记录】中已达成一致的内容，输出**一份**符合 schema 的纯 JSON（不要 markdown 代码块、不要解释）。

若对话未覆盖某些字段，请基于上下文合理补全，保持与对话不矛盾。

【Schema】
${schemaHint}

【对话记录】
${data.conversationText.slice(0, 24000)}

【完整字段参考任务（可忽略数量上限，以对话为准做合理精简）】
${taskRef.slice(0, 6000)}`

    const result = await runAgent({
      agentId,
      model: data.model,
      temperature: isStyle ? 0.75 : 0.3,
      maxTokens: isStyle ? 4000 : 8000,
      userMessage,
      contextAppend: isStyle
        ? '当前任务是输出可直接作为风格锚点的样章正文。'
        : '当前任务是结构化提取：只输出 JSON，不要对话。',
    })

    if (!result.text?.trim()) {
      return ApiErrors.badRequest('提取结果为空，请先多聊几轮再确认')
    }

    let payload: Record<string, unknown>
    if (isStyle) {
      payload = normalizeStepPayload(stepKey, result.text)
    } else {
      try {
        const parsed = extractJSON(result.text)
        payload = normalizeStepPayload(stepKey, parsed)
      } catch {
        // 再试一次更严
        const retry = await runAgent({
          agentId,
          model: data.model,
          temperature: 0.1,
          userMessage: `${userMessage}

【重要】上一次输出无法解析为 JSON。请只输出纯 JSON 对象，不要任何其它文字。`,
        })
        const parsed = extractJSON(retry.text)
        payload = normalizeStepPayload(stepKey, parsed)
      }
    }

    // architecture 附带字数计算
    if (stepKey === 'architecture') {
      payload.chapterCalculation = calc
    }

    return apiSuccess({
      stepKey,
      data: payload,
      provider: result.provider,
      model: result.modelUsed,
      duration: result.duration,
    })
  })
}

function extractArr(data: unknown): any[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (typeof data === 'object') {
    for (const v of Object.values(data as object)) {
      if (Array.isArray(v)) return v
    }
  }
  return []
}
