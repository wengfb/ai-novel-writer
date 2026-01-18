import { useEffect } from 'react'
import { useCharacterStore } from '@/lib/store/character-store'

/**
 * 角色列表 Hook
 */
export function useCharacters(projectId: string) {
  const { characters, isLoading, error, fetchCharacters } = useCharacterStore()

  useEffect(() => {
    if (projectId) {
      fetchCharacters(projectId)
    }
  }, [projectId, fetchCharacters])

  return {
    characters,
    isLoading,
    error,
    refetch: () => fetchCharacters(projectId),
  }
}
