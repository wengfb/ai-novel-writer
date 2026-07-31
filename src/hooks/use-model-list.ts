'use client'

/**
 * 设置页共用的模型列表 hook：内存缓存 + 单飞请求。
 */

import { useCallback, useState, useSyncExternalStore } from 'react'
import {
  fetchModelList,
  getCachedModelList,
  hasCachedModelList,
  type ModelOption,
} from '@/lib/ai/model-list'
import { toast } from 'sonner'

type Listener = () => void
const listeners = new Set<Listener>()
let version = 0

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return version
}

function notify() {
  version += 1
  listeners.forEach((listener) => listener())
}

export function useModelList() {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const [isLoading, setIsLoading] = useState(false)
  const models = getCachedModelList()

  const refresh = useCallback(async (opts?: { force?: boolean; toastOnSuccess?: boolean }) => {
    const force = opts?.force === true
    if (!force && hasCachedModelList()) {
      notify()
      return getCachedModelList()
    }

    setIsLoading(true)
    try {
      const next = await fetchModelList({ force })
      notify()
      if (opts?.toastOnSuccess) {
        toast.success(`已获取 ${next.length} 个模型`)
      }
      return next
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取模型列表失败'
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /** 打开下拉时确保有列表；已有缓存则不请求、不弹 toast */
  const ensureLoaded = useCallback(async () => {
    if (hasCachedModelList()) return getCachedModelList()
    try {
      return await refresh({ force: false })
    } catch {
      return getCachedModelList()
    }
  }, [refresh])

  return {
    models,
    isLoading,
    refresh,
    ensureLoaded,
  }
}

export type { ModelOption }
