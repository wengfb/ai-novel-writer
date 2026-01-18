import { useEffect } from 'react'
import { useWorldStore } from '@/lib/store/world-store'

/**
 * 世界观元素列表 Hook
 */
export function useWorldElements(projectId: string) {
  const { worldElements, isLoading, error, fetchWorldElements } = useWorldStore()

  useEffect(() => {
    if (projectId) {
      fetchWorldElements(projectId)
    }
  }, [projectId, fetchWorldElements])

  return {
    worldElements,
    isLoading,
    error,
    refetch: () => fetchWorldElements(projectId),
  }
}
