import { z } from 'zod'
import { getAIProviderAsync } from '@/lib/ai/providers'
import {
  GeneratedOnboardingOutlineSchema,
  OutlinePlotFunctionValues,
} from '@/lib/api/schemas'

export type GeneratedOnboardingOutline = z.infer<typeof GeneratedOnboardingOutlineSchema>

interface GenerateOutlineFromPromptOptions {
  prompt: string
  model?: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
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
 * 从模型输出中提取 JSON 并做 schema 校验
 */
export function parseGeneratedOnboardingOutline(output: string): GeneratedOnboardingOutline {
  const trimmedOutput = output.trim()
  const jsonMatch = trimmedOutput.match(/```json\s*([\s\S]*?)\s*```/) || trimmedOutput.match(/\{[\s\S]*\}/)

  if (!jsonMatch) {
    throw new Error('未找到可解析的 JSON 大纲')
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0]
  const parsed = JSON.parse(jsonStr)
  return GeneratedOnboardingOutlineSchema.parse(parsed)
}

/**
 * 统一封装大纲生成调用，供普通大纲生成与 onboarding 初始化共用
 */
export async function generateOutlineFromPrompt({
  prompt,
  model,
  systemPrompt,
  maxTokens = 8000,
  temperature = 0.7,
}: GenerateOutlineFromPromptOptions): Promise<GeneratedOutlineResult> {
  const ai = await getAIProviderAsync(model)
  const startTime = Date.now()
  const result = await ai.generate({
    type: 'outline',
    model: model || ai.model,
    prompt,
    systemPrompt,
    temperature,
    maxTokens,
  })
  const duration = Date.now() - startTime

  if (result.status === 'error' || !result.output) {
    throw new Error('AI 生成失败')
  }

  return {
    outline: parseGeneratedOnboardingOutline(result.output),
    rawOutput: result.output,
    tokensUsed: result.tokensUsed,
    cost: result.cost,
    duration,
    provider: ai.name,
    model: model || ai.model,
  }
}
