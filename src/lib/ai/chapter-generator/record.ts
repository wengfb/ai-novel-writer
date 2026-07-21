import { prisma } from '@/lib/db/prisma'

/** 记录一次 AI 生成历史（失败不阻断主流程） */
export async function recordGeneration(
  ai: { name: string; model: string },
  params: {
    projectId: string
    type: string
    model?: string
    prompt: string
    systemPrompt?: string
    output: string
    duration?: number
    targetId?: string
  }
) {
  try {
    return await prisma.generation.create({
      data: {
        projectId: params.projectId,
        type: params.type,
        targetId: params.targetId,
        provider: ai.name,
        model: params.model || ai.model,
        prompt: params.prompt,
        systemPrompt: params.systemPrompt,
        output: params.output,
        duration: params.duration,
        status: 'success',
      },
    })
  } catch (error) {
    console.error('Failed to record generation:', error)
    return null
  }
}
