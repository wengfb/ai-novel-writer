import { useEffect } from 'react'
import { useChapterStore } from '@/lib/store/chapter-store'

/**
 * 章节列表 Hook
 */
export function useChapters(projectId: string) {
  const { chapters, isLoading, error, fetchChapters } = useChapterStore()

  useEffect(() => {
    if (projectId) {
      fetchChapters(projectId)
    }
  }, [projectId, fetchChapters])

  return {
    chapters,
    isLoading,
    error,
    refetch: () => fetchChapters(projectId),
  }
}

/**
 * 当前章节 Hook
 */
export function useCurrentChapter() {
  const { currentChapter, setCurrentChapter } = useChapterStore()

  return {
    currentChapter,
    setCurrentChapter,
  }
}
