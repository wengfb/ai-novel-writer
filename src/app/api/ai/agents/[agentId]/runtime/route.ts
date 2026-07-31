import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ApiErrors, apiSuccess } from '@/lib/api/response'
import { validateRequest, Validation_error } from '@/lib/api/validators'
import { getAgentCatalogItem, requireAgentDefinition } from '@/lib/ai/agents'
import { saveAgentRuntimeConfig } from '@/lib/ai/agents/runtime-config'
import { clearConfigCache } from '@/lib/ai/config'

const RuntimeConfigSchema = z.object({
  /** 空字符串表示清除专属模型、回退全局 */
  model: z.string().trim().max(200).nullable().optional(),
  temperature: z.number().min(0).max(2).nullable().optional(),
  maxTokens: z.number().int().positive().max(1_000_000).nullable().optional(),
})

interface RouteContext {
  params: Promise<{ agentId: string }>
}

/** 保存 Agent 专属模型与采样参数；未填字段将回退到全局配置。 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { agentId } = await params
    requireAgentDefinition(agentId)
    const data = validateRequest(RuntimeConfigSchema, await request.json())
    await saveAgentRuntimeConfig(agentId, {
      // null / 空串 = 清除专属配置，回退全局
      model: data.model?.trim() || undefined,
      temperature: data.temperature ?? undefined,
      maxTokens: data.maxTokens ?? undefined,
    })
    clearConfigCache()
    return apiSuccess({ agent: await getAgentCatalogItem(agentId) })
  } catch (error) {
    if (error instanceof Validation_error) {
      return ApiErrors.badRequest('请求参数错误', error.errors)
    }
    if (error instanceof Error && error.message.startsWith('未知 Agent')) {
      return ApiErrors.notFound('Agent')
    }
    console.error('Save agent runtime config error:', error)
    return ApiErrors.serverError()
  }
}
