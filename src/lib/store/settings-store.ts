import { create } from 'zustand'
import { settingsApi } from '@/lib/api/endpoints/settings'

export const FONT_SIZE_MAP: Record<string, string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
  xlarge: '20px',
}

export const EDITOR_WIDTH_MAP: Record<string, string> = {
  narrow: '600px',
  normal: '800px',
  wide: '1000px',
  full: '100%',
}

interface SettingsState {
  settings: Record<string, string>
  isLoading: boolean
  isSaving: boolean
  isLoaded: boolean

  loadSettings: () => Promise<void>
  saveSettings: (updates: Record<string, string>) => Promise<void>
  updateSetting: (key: string, value: string) => void
  getSetting: (key: string, defaultValue?: string) => string
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  settings: {},
  isLoading: false,
  isSaving: false,
  isLoaded: false,

  loadSettings: async () => {
    const { isLoaded, isLoading } = get()
    if (isLoaded || isLoading) return

    set({ isLoading: true })
    try {
      const res = await settingsApi.list()
      if (res.success && res.data) {
        set({ settings: res.data.settings, isLoaded: true })
      }
    } catch {
      // 静默失败，使用默认值
    } finally {
      set({ isLoading: false })
    }
  },

  saveSettings: async (updates) => {
    set({ isSaving: true })
    try {
      await settingsApi.update(updates)
      set((state) => ({
        settings: { ...state.settings, ...updates },
      }))
    } finally {
      set({ isSaving: false })
    }
  },

  updateSetting: (key, value) => {
    set((state) => ({
      settings: { ...state.settings, [key]: value },
    }))
  },

  getSetting: (key, defaultValue = '') => {
    return get().settings[key] || defaultValue
  },
}))
