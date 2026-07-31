import { NextRequest } from 'next/server'
import { generateText } from 'ai'
import { z } from 'zod'
import { apiError, apiSuccess } from '@/lib/api/response'
import { validateRequest, Validation_error } from '@/lib/api/validators'
import { getAIProviderConfigAsync, normalizeAIProvider } from '@/lib/ai/config'
import { getLanguageModelAsync } from '@/lib/ai/providers'
import { requireAgentDefinition } from '@/lib/ai/agents'
import { getAgentRuntimeConfig } from '@/lib/ai/agents/runtime-config'

const RequestSchema = z.object({
  action: z.enum(['list', 'test']),
  model: z.string().trim().max(200).optional(),
  agentId: z.string().trim().optional(),
})

interface ProviderModel {
  id: string
  name: string
}

/** 获取当前服务商可用模型，或向指定模型发起最小连通性测试。 */
export async function POST(request: NextRequest) {
  try {
    const data = validateRequest(RequestSchema, await request.json())
    const agentConfig = data.agentId
      ? await getAgentRuntimeConfig(requireAgentDefinition(data.agentId).id)
      : undefined
    const model = data.model || agentConfig?.model

    if (data.action === 'list') {
      const config = await getAIProviderConfigAsync()
      const models = await listModels(config)
      return apiSuccess({ models, provider: config.provider })
    }

    const { model: languageModel, provider, modelId } = await getLanguageModelAsync(model)
    const result = await generateText({
      model: languageModel,
      prompt: '请只回复“连接成功”。',
      maxOutputTokens: 16,
      temperature: 0,
    })
    return apiSuccess({
      ok: true,
      provider,
      model: model || modelId,
      response: result.text.trim(),
    })
  } catch (error) {
    console.error('AI model utility error:', error)
    if (error instanceof Validation_error) {
      return apiError('INVALID_REQUEST', '请求参数错误', error.errors, 400)
    }
    return apiError('AI_MODEL_ERROR', error instanceof Error ? error.message : '模型请求失败', undefined, 400)
  }
}

async function listModels(config: Awaited<ReturnType<typeof getAIProviderConfigAsync>>): Promise<ProviderModel[]> {
  if (normalizeAIProvider(config.provider) === 'gemini') {
    const url = new URL('/v1beta/models', config.baseURL || 'https://generativelanguage.googleapis.com')
    url.searchParams.set('key', config.apiKey)
    const response = await fetch(url, { cache: 'no-store' })
    if (!response.ok) throw new Error(`获取 Gemini 模型列表失败（${response.status}）`)
    const body = await response.json() as { models?: Array<{ name?: string; displayName?: string; supportedGenerationMethods?: string[] }> }
    return (body.models || [])
      .filter((item) => item.name && (!item.supportedGenerationMethods || item.supportedGenerationMethods.includes('generateContent')))
      .map((item) => ({ id: item.name!.replace(/^models\//, ''), name: item.displayName || item.name!.replace(/^models\//, '') }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  const baseURL = config.baseURL || 'https://api.openai.com/v1'
  const url = new URL('models', `${baseURL.replace(/\/$/, '')}/`)
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${config.apiKey}` },
  })
  if (!response.ok) throw new Error(`获取模型列表失败（${response.status}）`)
  const body = await response.json() as { data?: Array<{ id?: string }> }
  return (body.data || [])
    .filter((item): item is { id: string } => Boolean(item.id))
    .map((item) => ({ id: item.id, name: item.id }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
