import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StoryIdeaCard } from '@/types'
import type { Outline } from '@/lib/store/outline-store'
import type { Character } from '@/lib/store/character-store'
import type { WorldElement } from '@/lib/store/world-store'
import type { AssistantScope, AssistantScopeType } from '@/lib/ai/agent-workspace'

/** 中间主内容区视图 */
export type MainView =
  | 'editor'
  | 'outline'
  | 'characters'
  | 'world'
  | 'ideas'
  | 'onboarding'
  | 'settings'
  | 'project'
  | 'projects'

/** 左侧本书资源分区；null 表示全部收起 */
export type BookSection = 'chapters' | 'outline' | 'characters' | 'world'

/** 大纲中间区：概览 / 共创规划 / 节点详情编辑 */
export type OutlineCenterMode = 'empty' | 'planning' | 'edit'

export interface OnboardingContext {
  mode: 'new' | 'resume' | 'prefill'
  resumeProject?: { id: string; title: string; genre: string; description: string }
  prefillIdea?: StoryIdeaCard
  prefillIdeaId?: string
}

export interface OutlineEditPayload {
  editingOutline?: Outline | null
  parentId?: string | null
  defaultType?: 'volume' | 'chapter' | 'scene'
}

export interface CharacterEditPayload {
  character?: Character | null
}

export interface WorldEditPayload {
  element?: WorldElement | null
}

interface UIState {
  leftSidebarCollapsed: boolean
  rightSidebarCollapsed: boolean
  activeTab: 'chat' | 'context' | 'generate'
  activeAssistantAgentId: string | null
  assistantScope: AssistantScope | null
  mainView: MainView
  bookSection: BookSection | null

  generateChapterPanelOpen: boolean

  outlineCenterMode: OutlineCenterMode
  isOutlineNodeCoCreating: boolean
  outlineEditPayload: OutlineEditPayload | null
  characterEditPayload: CharacterEditPayload | null
  worldEditPayload: WorldEditPayload | null

  onboardingContext: OnboardingContext | null

  toggleLeftSidebar: () => void
  toggleRightSidebar: () => void
  setRightSidebarCollapsed: (collapsed: boolean) => void
  setActiveTab: (tab: 'chat' | 'context' | 'generate') => void
  setActiveAssistantAgent: (agentId: string | null) => void
  openAssistantForScope: (scope: AssistantScope, agentId?: string) => void
  setMainView: (view: MainView) => void
  selectBookSection: (section: BookSection) => void
  setGenerateChapterPanelOpen: (open: boolean) => void

  openOutlinePlanning: () => void
  openOutlineEdit: (payload?: OutlineEditPayload) => void
  closeOutlineCenter: () => void
  setOutlineNodeCoCreating: (active: boolean) => void

  openCharacterEdit: (payload?: CharacterEditPayload) => void
  closeCharacterEdit: () => void

  openWorldEdit: (payload?: WorldEditPayload) => void
  closeWorldEdit: () => void

  startOnboarding: (context?: OnboardingContext) => void
  clearOnboarding: () => void
  openEditor: () => void
}

function mainViewForSection(section: BookSection): MainView {
  switch (section) {
    case 'outline':
      return 'outline'
    case 'characters':
      return 'characters'
    case 'world':
      return 'world'
    case 'chapters':
    default:
      return 'editor'
  }
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      leftSidebarCollapsed: false,
      rightSidebarCollapsed: false,
      activeTab: 'chat',
      activeAssistantAgentId: null,
      assistantScope: null,
      mainView: 'projects',
      bookSection: 'chapters',
      generateChapterPanelOpen: false,
      outlineCenterMode: 'empty',
      isOutlineNodeCoCreating: false,
      outlineEditPayload: null,
      characterEditPayload: null,
      worldEditPayload: null,
      onboardingContext: null,

      toggleLeftSidebar: () => {
        set((state) => ({ leftSidebarCollapsed: !state.leftSidebarCollapsed }))
      },

      toggleRightSidebar: () => {
        set((state) => ({ rightSidebarCollapsed: !state.rightSidebarCollapsed }))
      },

      setRightSidebarCollapsed: (collapsed) => {
        set({ rightSidebarCollapsed: collapsed })
      },

      setActiveTab: (tab) => {
        set({ activeTab: tab })
      },

      setActiveAssistantAgent: (agentId) => {
        set({ activeAssistantAgentId: agentId, activeTab: 'chat' })
      },

      openAssistantForScope: (scope, agentId) => {
        set({
          assistantScope: scope,
          activeAssistantAgentId: agentId ?? null,
          activeTab: 'chat',
          rightSidebarCollapsed: false,
        })
      },

      setMainView: (view) => {
        set({ mainView: view })
      },

      selectBookSection: (section) => {
        set((state) => {
          const sectionViews: MainView[] = ['editor', 'outline', 'characters', 'world']
          const alreadyOpen =
            sectionViews.includes(state.mainView) && state.bookSection === section
          // 再次点击已展开项：仅收起左侧列表
          if (alreadyOpen) {
            return { bookSection: null }
          }
          // 展开新分区：同步主视图，并清空各资源中间详情（避免串态）
          return {
            bookSection: section,
            mainView: mainViewForSection(section),
            outlineCenterMode: 'empty' as OutlineCenterMode,
            isOutlineNodeCoCreating: false,
            outlineEditPayload: null,
            characterEditPayload: null,
            worldEditPayload: null,
            generateChapterPanelOpen: false,
          }
        })
      },

      setGenerateChapterPanelOpen: (open) => {
        set({ generateChapterPanelOpen: open })
      },

      openOutlinePlanning: () => {
        set({
          bookSection: 'outline',
          mainView: 'outline',
          outlineCenterMode: 'planning',
          isOutlineNodeCoCreating: false,
          outlineEditPayload: null,
        })
      },

      openOutlineEdit: (payload = {}) => {
        const parentId = payload.parentId ?? null
        // 根级新建默认卷；有父节点时默认章；显式传入 type 时优先。
        const defaultType =
          payload.defaultType ?? (parentId ? 'chapter' : 'volume')
        set({
          bookSection: 'outline',
          mainView: 'outline',
          outlineCenterMode: 'edit',
          isOutlineNodeCoCreating: false,
          outlineEditPayload: {
            editingOutline: payload.editingOutline ?? null,
            parentId,
            defaultType,
          },
        })
      },

      closeOutlineCenter: () => {
        set({ outlineCenterMode: 'empty', isOutlineNodeCoCreating: false, outlineEditPayload: null })
      },

      setOutlineNodeCoCreating: (active) => {
        set({ isOutlineNodeCoCreating: active })
      },

      openCharacterEdit: (payload = {}) => {
        set({
          bookSection: 'characters',
          mainView: 'characters',
          characterEditPayload: {
            character: payload.character ?? null,
          },
        })
      },

      closeCharacterEdit: () => {
        set({ characterEditPayload: null })
      },

      openWorldEdit: (payload = {}) => {
        set({
          bookSection: 'world',
          mainView: 'world',
          worldEditPayload: {
            element: payload.element ?? null,
          },
        })
      },

      closeWorldEdit: () => {
        set({ worldEditPayload: null })
      },

      startOnboarding: (context) => {
        set({
          mainView: 'onboarding',
          onboardingContext: context ?? { mode: 'new' },
        })
      },

      clearOnboarding: () => {
        set({ onboardingContext: null })
      },

      openEditor: () => {
        set({
          mainView: 'editor',
          bookSection: 'chapters',
          generateChapterPanelOpen: false,
          outlineCenterMode: 'empty',
          isOutlineNodeCoCreating: false,
          outlineEditPayload: null,
          characterEditPayload: null,
          worldEditPayload: null,
        })
      },
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        leftSidebarCollapsed: state.leftSidebarCollapsed,
        rightSidebarCollapsed: state.rightSidebarCollapsed,
        activeTab: state.activeTab,
        bookSection: state.bookSection,
        mainView:
          state.mainView === 'editor' ||
          state.mainView === 'outline' ||
          state.mainView === 'characters' ||
          state.mainView === 'world'
            ? state.mainView
            : state.mainView === 'projects'
              ? 'projects'
              : 'editor',
      }),
    }
  )
)
