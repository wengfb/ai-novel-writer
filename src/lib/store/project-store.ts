import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export interface Project {
  id: string
  title: string
  description: string | null
  genre: string
  status: 'draft' | 'writing' | 'completed' | 'archived'
  totalWords: number
  totalChapters: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateProjectParams {
  title: string
  description?: string
  genre: string
  status?: 'draft' | 'writing' | 'completed' | 'archived'
}

interface ProjectState {
  // 状态
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  error: string | null

  // Actions
  fetchProjects: () => Promise<void>
  setCurrentProject: (project: Project | null) => void
  createProject: (data: CreateProjectParams) => Promise<Project>
  updateProject: (id: string, data: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  clearError: () => void
}

export const useProjectStore = create<ProjectState>()(
  persist(
    immer((set, get) => ({
      // 初始状态
      projects: [],
      currentProject: null,
      isLoading: false,
      error: null,

      // 获取项目列表
      fetchProjects: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/projects')
          const data = await response.json()

          if (!data.success) {
            throw new Error(data.error.message)
          }

          set({ projects: data.data.projects, isLoading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '获取项目列表失败',
            isLoading: false,
          })
        }
      },

      // 设置当前项目
      setCurrentProject: (project) => {
        set({ currentProject: project })
      },

      // 创建项目
      createProject: async (data) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })

          const result = await response.json()

          if (!result.success) {
            throw new Error(result.error.message)
          }

          const newProject = result.data

          set((state) => {
            state.projects.push(newProject)
            state.currentProject = newProject
            state.isLoading = false
          })

          return newProject
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '创建项目失败',
            isLoading: false,
          })
          throw error
        }
      },

      // 更新项目
      updateProject: async (id, data) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`/api/projects/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })

          const result = await response.json()

          if (!result.success) {
            throw new Error(result.error.message)
          }

          const updatedProject = result.data

          set((state) => {
            const index = state.projects.findIndex((p) => p.id === id)
            if (index !== -1) {
              state.projects[index] = updatedProject
            }
            if (state.currentProject?.id === id) {
              state.currentProject = updatedProject
            }
            state.isLoading = false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '更新项目失败',
            isLoading: false,
          })
          throw error
        }
      },

      // 删除项目
      deleteProject: async (id) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`/api/projects/${id}`, {
            method: 'DELETE',
          })

          const result = await response.json()

          if (!result.success) {
            throw new Error(result.error.message)
          }

          set((state) => {
            state.projects = state.projects.filter((p) => p.id !== id)
            if (state.currentProject?.id === id) {
              state.currentProject = null
            }
            state.isLoading = false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '删除项目失败',
            isLoading: false,
          })
          throw error
        }
      },

      // 清除错误
      clearError: () => {
        set({ error: null })
      },
    })),
    {
      name: 'project-store',
      partialize: (state) => ({
        currentProject: state.currentProject,
      }),
    }
  )
)
