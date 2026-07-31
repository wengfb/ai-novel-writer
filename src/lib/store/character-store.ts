import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { charactersApi } from '@/lib/api/endpoints/characters'

export interface Character {
  id: string
  projectId: string
  name: string
  nickname: string | null
  age: number | null
  gender: string | null
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  importance: number
  appearance: string | null
  personality: string | null
  backstory: string | null
  relationships: Record<string, unknown> | string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateCharacterParams {
  projectId: string
  name: string
  nickname?: string
  age?: number
  gender?: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  importance?: number
  appearance?: string
  personality?: string
  backstory?: string
}

interface CharacterState {
  characters: Character[]
  isLoading: boolean
  loadedProjectId: string | null
  loadingProjectId: string | null
  error: string | null

  fetchCharacters: (projectId: string, force?: boolean) => Promise<void>
  createCharacter: (data: CreateCharacterParams) => Promise<Character>
  updateCharacter: (id: string, data: Partial<Character>) => Promise<void>
  deleteCharacter: (id: string) => Promise<void>
  clearError: () => void
}

export const useCharacterStore = create<CharacterState>()(
  immer((set, get) => ({
    characters: [],
    isLoading: false,
    loadedProjectId: null,
    loadingProjectId: null,
    error: null,

    fetchCharacters: async (projectId, force = false) => {
      const { loadedProjectId, loadingProjectId } = get()
      if (!force && (loadedProjectId === projectId || loadingProjectId === projectId)) return

      set({ isLoading: true, loadingProjectId: projectId, error: null })
      try {
        const res = await charactersApi.list(projectId)
        set({
          characters: res.data?.characters ?? [],
          isLoading: false,
          loadedProjectId: projectId,
          loadingProjectId: null,
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '获取角色列表失败',
          isLoading: false,
          loadingProjectId: null,
        })
      }
    },

    createCharacter: async (data) => {
      set({ isLoading: true, error: null })
      try {
        const res = await charactersApi.create(data)
        const newCharacter = (res.data?.character ?? res.data) as Character

        set((state) => {
          state.characters.push(newCharacter)
          state.isLoading = false
        })

        return newCharacter
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '创建角色失败',
          isLoading: false,
        })
        throw error
      }
    },

    updateCharacter: async (id, data) => {
      set({ isLoading: true, error: null })
      try {
        const res = await charactersApi.update(id, data)
        const updatedCharacter = (res.data?.character ?? res.data) as Character

        set((state) => {
          const index = state.characters.findIndex((c) => c.id === id)
          if (index !== -1) {
            state.characters[index] = updatedCharacter
          }
          state.isLoading = false
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '更新角色失败',
          isLoading: false,
        })
        throw error
      }
    },

    deleteCharacter: async (id) => {
      set({ isLoading: true, error: null })
      try {
        await charactersApi.delete(id)

        set((state) => {
          state.characters = state.characters.filter((c) => c.id !== id)
          state.isLoading = false
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '删除角色失败',
          isLoading: false,
        })
        throw error
      }
    },

    clearError: () => {
      set({ error: null })
    },
  }))
)
