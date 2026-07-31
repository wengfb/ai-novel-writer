'use client'

/**
 * 模型连通性测试：统一 toast + 行内结果状态。
 */

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { aiModelsApi } from '@/lib/api/endpoints/ai-models'
import { ApiError } from '@/lib/api/client'
import type { ModelTestStatus } from '@/components/settings/model-test-result'

interface TestInput {
  model?: string
  agentId?: string
  /** loading toast 文案 */
  label?: string
}

export function useModelTest() {
  const [isTesting, setIsTesting] = useState(false)
  const [result, setResult] = useState<ModelTestStatus>(null)

  const clearResult = useCallback(() => setResult(null), [])

  const test = useCallback(async (input: TestInput = {}) => {
    setIsTesting(true)
    setResult(null)
    const label = input.label || input.model || '默认模型'
    const loadingId = toast.loading(`正在测试 ${label}…`)

    try {
      const response = await aiModelsApi.test({
        model: input.model || undefined,
        agentId: input.agentId,
      })
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || '模型连接失败')
      }

      const parsed: Exclude<ModelTestStatus, null> = {
        ok: true,
        message: `连接成功：${response.data.model}`,
        detail: response.data.response
          ? `模型回复：${response.data.response}`
          : undefined,
      }
      setResult(parsed)
      toast.success(parsed.message, { id: loadingId, description: parsed.detail })
      return parsed
    } catch (error) {
      const detail =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : '网络错误，请稍后重试'
      const parsed: Exclude<ModelTestStatus, null> = {
        ok: false,
        message: '模型连接失败',
        detail,
      }
      setResult(parsed)
      toast.error(parsed.message, { id: loadingId, description: parsed.detail })
      return parsed
    } finally {
      setIsTesting(false)
    }
  }, [])

  return {
    isTesting,
    result,
    test,
    clearResult,
    setResult,
  }
}
