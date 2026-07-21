/**
 * GET /api/ai/agents
 * - 无 id：列出全部 Agent + 已解析提示词槽位
 * - ?id=：单个 Agent（设置页编辑用）
 *
 * 数据来自 registry + prompt-store，不触发模型调用。
 */

import { NextRequest } from 'next/server'
import { ApiErrors, apiSuccess } from '@/lib/api/response'
import { getAgentCatalogItem, listAgentCatalog } from '@/lib/ai/agents'

export async function GET(request: NextRequest) {
  try {
    const agentId = request.nextUrl.searchParams.get('id')

    if (agentId) {
      try {
        const item = await getAgentCatalogItem(agentId)
        return apiSuccess(item)
      } catch (error) {
        return ApiErrors.notFound('Agent')
      }
    }

    const catalog = await listAgentCatalog()
    return apiSuccess({ agents: catalog })
  } catch (error) {
    console.error('List agents error:', error)
    return ApiErrors.serverError()
  }
}
