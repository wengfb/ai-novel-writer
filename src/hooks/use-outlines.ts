import { useEffect } from 'react'
import { useOutlineStore } from '@/lib/store/outline-store'

/**
 * 大纲列表 Hook
 */
export function useOutlines(projectId: string) {
  const outlines = useOutlineStore((s) => s.outlines)
  const flatOutlines = useOutlineStore((s) => s.flatOutlines)
  const isLoading = useOutlineStore((s) => s.isLoading)
  const error = useOutlineStore((s) => s.error)
  const lastFetchedProjectId = useOutlineStore((s) => s.lastFetchedProjectId)

  useEffect(() => {
    if (!projectId) return
    const state = useOutlineStore.getState()
    // 已有缓存数据且非 loading 中，不发起请求
    if (state.lastFetchedProjectId === projectId) return
    state.fetchOutlines(projectId)
  }, [projectId, lastFetchedProjectId])

  return {
    outlines,
    flatOutlines,
    isLoading,
    error,
    refetch: () => useOutlineStore.getState().fetchOutlines(projectId),
  }
}

/**
 * 当前大纲 Hook
 */
export function useCurrentOutline() {
  const currentOutline = useOutlineStore((s) => s.currentOutline)
  const setCurrentOutline = useOutlineStore((s) => s.setCurrentOutline)

  return {
    currentOutline,
    setCurrentOutline,
  }
}
