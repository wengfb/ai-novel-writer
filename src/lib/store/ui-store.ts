import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  // 侧边栏状态
  leftSidebarCollapsed: boolean
  rightSidebarCollapsed: boolean

  // 右侧边栏激活的标签页
  activeTab: 'chat' | 'context' | 'generate'

  // Actions
  toggleLeftSidebar: () => void
  toggleRightSidebar: () => void
  setActiveTab: (tab: 'chat' | 'context' | 'generate') => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // 初始状态
      leftSidebarCollapsed: false,
      rightSidebarCollapsed: false,
      activeTab: 'chat',

      // 切换左侧边栏
      toggleLeftSidebar: () => {
        set((state) => ({ leftSidebarCollapsed: !state.leftSidebarCollapsed }))
      },

      // 切换右侧边栏
      toggleRightSidebar: () => {
        set((state) => ({ rightSidebarCollapsed: !state.rightSidebarCollapsed }))
      },

      // 设置激活的标签页
      setActiveTab: (tab) => {
        set({ activeTab: tab })
      },
    }),
    {
      name: 'ui-store',
    }
  )
)
