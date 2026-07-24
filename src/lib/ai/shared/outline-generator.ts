/**
 * 统一封装大纲生成
 * 走 outline agent + runAgentObject（共享 OutlineGenerationSchema）
 */

import { z } from 'zod'
import { getAIProviderAsync } from '@/lib/ai/providers'
import { runAgentObject } from '@/lib/ai/agents'
import { GeneratedOnboardingOutlineSchema } from '@/lib/api/schemas'

export type GeneratedOnboardingOutline = z.infer<typeof GeneratedOnboardingOutlineSchema>

/**
 * 生成侧宽松大纲 schema：模型常漏字段 / 尾部脏字符
 * 解析后再用 GeneratedOnboardingOutlineSchema 做最小规范化
 */
const LooseOutlineSchema = z
  .object({
    storySummary: z.string().optional(),
    mainConflict: z.string().optional(),
    suggestedTotalWords: z.number().optional(),
    wordCountRationale: z.string().optional(),
    characters: z.array(z.any()).optional(),
    worldSettings: z.array(z.any()).optional(),
    chapters: z.array(z.any()).optional(),
    plotTwists: z.array(z.any()).optional(),
  })
  .passthrough()

interface GenerateOutlineFromPromptOptions {
  prompt: string
  model?: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  /**
   * 是否使用 outline Agent 的 system 提示词
   * 为 true 时 systemPrompt 会作为 contextAppend 附加
   */
  useAgentSystem?: boolean
}

interface GeneratedOutlineResult {
  outline: GeneratedOnboardingOutline
  rawOutput: string
  tokensUsed?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  cost?: number
  duration: number
  provider: string
  model: string
}

/**
 * 统一封装大纲生成调用（结构化输出）
 */
export async function generateOutlineFromPrompt({
  prompt,
  model,
  systemPrompt,
  temperature = 0.7,
}: GenerateOutlineFromPromptOptions): Promise<GeneratedOutlineResult> {
  const ai = await getAIProviderAsync(model)
  const startTime = Date.now()

  const result = await runAgentObject({
    agentId: 'outline',
    userSlot: 'user.generate',
    model,
    temperature,
    maxTokens: 8000,
    userMessage: prompt,
    contextAppend: systemPrompt,
    schema: LooseOutlineSchema,
    schemaName: 'GeneratedOutline',
    schemaDescription:
      '完整大纲 JSON 对象：storySummary, mainConflict, characters[], worldSettings[], chapters[]',
  })

  const duration = Date.now() - startTime
  const loose = result.object
  const outline = GeneratedOnboardingOutlineSchema.parse({
    storySummary: loose.storySummary || '待补充故事梗概',
    mainConflict: loose.mainConflict,
    suggestedTotalWords: loose.suggestedTotalWords,
    wordCountRationale: loose.wordCountRationale,
    characters:
      Array.isArray(loose.characters) && loose.characters.length > 0
        ? loose.characters
        : [{ name: '主角', role: '主角' }],
    worldSettings:
      Array.isArray(loose.worldSettings) && loose.worldSettings.length > 0
        ? loose.worldSettings
        : [{ name: '核心设定', type: 'other', description: '待补充' }],
    chapters:
      Array.isArray(loose.chapters) && loose.chapters.length > 0
        ? loose.chapters
        : [{ chapterNumber: 1, title: '第一章', summary: '待补充' }],
    plotTwists: loose.plotTwists,
  })

  return {
    outline,
    rawOutput: result.text,
    tokensUsed: result.tokensUsed,
    cost: result.cost,
    duration: result.duration ?? duration,
    provider: result.provider || ai.name,
    model: result.modelUsed || model || ai.model,
  }
}

/** @deprecated 请使用 runAgentObject + OutlineGenerationSchema */
export function parseGeneratedOnboardingOutline(output: string): GeneratedOnboardingOutline {
  const trimmedOutput = output.trim()
  const jsonMatch =
    trimmedOutput.match(/```json\s*([\s\S]*?)\s*```/) || trimmedOutput.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('未找到可解析的 JSON 大纲')
  }
  const jsonStr = jsonMatch[1] || jsonMatch[0]
  return GeneratedOnboardingOutlineSchema.parse(JSON.parse(jsonStr))
}
