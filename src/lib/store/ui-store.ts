import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  // 侧边栏状态
  leftSidebarCollapsed: boolean
  rightSidebarCollapsed: boolean

  // 右侧边栏激活的标签页
  activeTab: 'chat' | 'context' | 'generate'

  // 主内容区视图
  mainView: 'editor' | 'outline'

  // Actions
  toggleLeftSidebar: () => void
  toggleRightSidebar: () => void
  setActiveTab: (tab: 'chat' | 'context' | 'generate') => void
  setMainView: (view: 'editor' | 'outline') => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // 初始状态
      leftSidebarCollapsed: false,
      rightSidebarCollapsed: false,
      activeTab: 'chat',
      mainView: 'editor',

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

      // 设置主内容区视图
      setMainView: (view) => {
        set({ mainView: view })
      },
    }),
    {
      name: 'ui-store',
    }
  )
)
