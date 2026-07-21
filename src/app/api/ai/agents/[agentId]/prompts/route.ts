/**
 * Agent 提示词写接口
 * - PUT    保存某一槽位 content
 * - DELETE 重置：?slot=key 单槽；无 slot 则全部恢复默认
 *
 * 落库 Prisma AgentPrompt；保存后清 prompt-store 缓存。
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ApiErrors, apiSuccess } from '@/lib/api/response'
import { validateRequest, Validation_error } from '@/lib/api/validators'
import {
  requireAgentDefinition,
  saveAgentPrompt,
  resetAgentPrompt,
  resetAllAgentPrompts,
  getAgentCatalogItem,
} from '@/lib/ai/agents'

const SaveSchema = z.object({
  slotKey: z.string().min(1),
  content: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params
    const definition = requireAgentDefinition(agentId)
    const body = await request.json()
    const data = validateRequest(SaveSchema, body)

    const slot = await saveAgentPrompt(definition, {
      agentId,
      slotKey: data.slotKey,
      content: data.content,
      name: data.name,
      description: data.description,
    })

    return apiSuccess({ slot, agent: await getAgentCatalogItem(agentId) })
  } catch (error) {
    console.error('Save agent prompt error:', error)
    if (error instanceof Validation_error) {
      return ApiErrors.badRequest('请求参数错误', error.errors)
    }
    if (error instanceof Error && error.message.startsWith('未知 Agent')) {
      return ApiErrors.notFound('Agent')
    }
    if (error instanceof Error && error.message.includes('没有提示词槽位')) {
      return ApiErrors.badRequest(error.message)
    }
    return ApiErrors.serverError()
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params
    const definition = requireAgentDefinition(agentId)
    const slotKey = request.nextUrl.searchParams.get('slot')

    if (slotKey) {
      const slot = await resetAgentPrompt(definition, slotKey)
      return apiSuccess({ slot, agent: await getAgentCatalogItem(agentId) })
    }

    const slots = await resetAllAgentPrompts(definition)
    return apiSuccess({ slots, agent: await getAgentCatalogItem(agentId) })
  } catch (error) {
    console.error('Reset agent prompt error:', error)
    if (error instanceof Error && error.message.startsWith('未知 Agent')) {
      return ApiErrors.notFound('Agent')
    }
    return ApiErrors.serverError()
  }
}
