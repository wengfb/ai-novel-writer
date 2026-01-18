import { useEffect } from 'react'
import { useProjectStore } from '@/lib/store/project-store'

/**
 * 项目列表 Hook
 */
export function useProjects() {
  const { projects, isLoading, error, fetchProjects } = useProjectStore()

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return {
    projects,
    isLoading,
    error,
    refetch: fetchProjects,
  }
}

/**
 * 当前项目 Hook
 */
export function useCurrentProject() {
  const { currentProject, setCurrentProject } = useProjectStore()

  return {
    currentProject,
    setCurrentProject,
  }
}
