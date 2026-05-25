import { apiClient } from '../client'

export interface SettingsData {
  settings: Record<string, string>
  categories: Record<string, { key: string; value: string; description: string }[]>
}

export const settingsApi = {
  list: () => apiClient.get<SettingsData>('/settings'),

  update: (settings: Record<string, string>) =>
    apiClient.put<{ message: string }>('/settings', { settings }),
}
