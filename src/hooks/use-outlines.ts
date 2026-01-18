import { useEffect } from 'react'
import { useOutlineStore } from '@/lib/store/outline-store'

/**
 * 大纲列表 Hook
 */
export function useOutlines(projectId: string) {
  const { outlines, flatOutlines, isLoading, error, fetchOutlines } = useOutlineStore()

  useEffect(() => {
    if (projectId) {
      fetchOutlines(projectId)
    }
  }, [projectId, fetchOutlines])

  return {
    outlines,
    flatOutlines,
    isLoading,
    error,
    refetch: () => fetchOutlines(projectId),
  }
}

/**
 * 当前大纲 Hook
 */
export function useCurrentOutline() {
  const { currentOutline, setCurrentOutline } = useOutlineStore()

  return {
    currentOutline,
    setCurrentOutline,
  }
}
