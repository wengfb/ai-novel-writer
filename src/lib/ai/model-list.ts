/**
 * 模型列表共享缓存：设置页多处共用，避免重复请求上游 /models。
 * 模块级单飞：并发 ensureLoaded / refresh 只打一次网络。
 */

import { aiModelsApi, type ModelOption } from '@/lib/api/endpoints/ai-models'

export type { ModelOption }

let cachedModels: ModelOption[] | null = null
let inflight: Promise<ModelOption[]> | null = null

export function getCachedModelList(): ModelOption[] {
  return cachedModels ?? []
}

export function hasCachedModelList(): boolean {
  return cachedModels !== null
}

async function requestModelList(): Promise<ModelOption[]> {
  const result = await aiModelsApi.list()
  if (!result.success || !result.data?.models) {
    throw new Error(result.error?.message || '获取模型列表失败')
  }
  cachedModels = result.data.models
  return cachedModels
}

/**
 * 获取模型列表。默认复用缓存与进行中请求；force 时在当前请求结束后再拉一次。
 */
export function fetchModelList(options?: { force?: boolean }): Promise<ModelOption[]> {
  const force = options?.force === true

  if (!force && cachedModels) {
    return Promise.resolve(cachedModels)
  }

  if (inflight) {
    if (!force) return inflight
    return inflight.catch(() => undefined).then(() => fetchModelList({ force: true }))
  }

  const request = requestModelList().finally(() => {
    if (inflight === request) inflight = null
  })
  inflight = request
  return request
}

export function clearModelListCache() {
  cachedModels = null
  inflight = null
}
