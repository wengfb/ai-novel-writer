import { z } from 'zod'
import { getAIProviderAsync } from '@/lib/ai/providers'
import { runAgent } from '@/lib/ai/agents'
import {
  GeneratedOnboardingOutlineSchema,
} from '@/lib/api/schemas'

export type GeneratedOnboardingOutline = z.infer<typeof GeneratedOnboardingOutlineSchema>

interface GenerateOutlineFromPromptOptions {
  prompt: string
  model?: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  /**
   * 是否使用 outline-architect Agent 的 system 提示词
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
 * 统一封装大纲生成调用
 * 走 outline-architect Agent（system 可编辑）；user 内容由调用方渲染后传入
 */
export async function generateOutlineFromPrompt({
  prompt,
  model,
  systemPrompt,
  temperature = 0.7,
  useAgentSystem = true,
}: GenerateOutlineFromPromptOptions): Promise<GeneratedOutlineResult> {
  const ai = await getAIProviderAsync(model)
  const startTime = Date.now()

  let rawOutput: string
  let tokensUsed: GeneratedOutlineResult['tokensUsed']
  let cost: number | undefined

  if (useAgentSystem) {
    const agentResult = await runAgent({
      agentId: 'outline-architect',
      model,
      temperature,
      userMessage: prompt,
      contextAppend: systemPrompt,
    })
    rawOutput = agentResult.text
  } else {
    const result = await ai.generate({
      type: 'outline',
      model: model || ai.model,
      prompt,
      systemPrompt,
      temperature,
      maxTokens: 8000,
    })
    if (result.status === 'error' || !result.output) {
      throw new Error('AI 生成失败')
    }
    rawOutput = result.output
    tokensUsed = result.tokensUsed
    cost = result.cost
  }

  const duration = Date.now() - startTime

  if (!rawOutput?.trim()) {
    throw new Error('AI 生成失败')
  }

  return {
    outline: parseGeneratedOnboardingOutline(rawOutput),
    rawOutput,
    tokensUsed,
    cost,
    duration,
    provider: ai.name,
    model: model || ai.model,
  }
}
