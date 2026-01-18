import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

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
  relationships: any
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
  error: string | null

  fetchCharacters: (projectId: string) => Promise<void>
  createCharacter: (data: CreateCharacterParams) => Promise<Character>
  updateCharacter: (id: string, data: Partial<Character>) => Promise<void>
  deleteCharacter: (id: string) => Promise<void>
  clearError: () => void
}

export const useCharacterStore = create<CharacterState>()(
  immer((set) => ({
    characters: [],
    isLoading: false,
    error: null,

    fetchCharacters: async (projectId: string) => {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch(`/api/projects/${projectId}/characters`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error.message)
        }

        set({ characters: data.data.characters, isLoading: false })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '获取角色列表失败',
          isLoading: false,
        })
      }
    },

    createCharacter: async (data) => {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch('/api/characters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error.message)
        }

        const newCharacter = result.data

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
        const response = await fetch(`/api/characters/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error.message)
        }

        const updatedCharacter = result.data

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
        const response = await fetch(`/api/characters/${id}`, {
          method: 'DELETE',
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error.message)
        }

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
