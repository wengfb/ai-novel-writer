/**
 * POST /api/ai/agents/run
 * 任务型 Agent 统一执行（非多轮 chat）
 *
 * body: { agentId, variables?, userMessage?, contextAppend?, model?, temperature? }
 * 与 {@link runAgent} 同语义；界面按钮应优先走此入口或直接 import runAgent。
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ApiErrors, apiSuccess } from '@/lib/api/response'
import { validateRequest, Validation_error } from '@/lib/api/validators'
import { runAgent } from '@/lib/ai/agents'

const RunSchema = z.object({
  agentId: z.string().min(1),
  model: z.string().optional(),
  variables: z.record(z.string(), z.unknown()).optional(),
  userMessage: z.string().optional(),
  contextAppend: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = validateRequest(RunSchema, body)
    const result = await runAgent(data)
    return apiSuccess(result)
  } catch (error) {
    console.error('Run agent error:', error)
    if (error instanceof Validation_error) {
      return ApiErrors.badRequest('请求参数错误', error.errors)
    }
    if (error instanceof Error && error.message.startsWith('未知 Agent')) {
      return ApiErrors.notFound('Agent')
    }
    return ApiErrors.serverError(error instanceof Error ? error.message : undefined)
  }
}
