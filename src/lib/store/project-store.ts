import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { useChapterStore } from './chapter-store'

export interface Project {
  id: string
  title: string
  description: string | null
  genre: string
  tags: string | null
  status: 'draft' | 'writing' | 'completed' | 'archived'
  coverImage: string | null
  totalWords: number
  totalChapters: number
  outlineMode: 'full' | 'progressive'
  planningRange: number | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateProjectParams {
  title: string
  description?: string
  genre: string
  status?: 'draft' | 'writing' | 'completed'
}

type ProjectInput = Project | ProjectResponse

interface ProjectState {
  // 状态
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  error: string | null

  // Actions
  fetchProjects: () => Promise<void>
  setCurrentProject: (project: ProjectInput | null) => void
  createProject: (data: CreateProjectParams) => Promise<Project>
  updateProject: (id: string, data: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  clearError: () => void
}

type ProjectResponse = Omit<Partial<Project>, 'createdAt' | 'updatedAt'> & {
  id: string
  title: string
  description?: string | null
  genre: string
  tags?: string | null
  status: Project['status']
  coverImage?: string | null
  totalWords?: number
  totalChapters?: number
  chapterCount?: number
  outlineMode?: string
  planningRange?: number | null
  createdAt: string | Date
  updatedAt: string | Date
}

function normalizeProject(project: ProjectResponse): Project {
  return {
    id: project.id,
    title: project.title,
    description: project.description ?? null,
    genre: project.genre,
    tags: project.tags ?? null,
    status: project.status,
    coverImage: project.coverImage ?? null,
    totalWords: project.totalWords ?? 0,
    totalChapters: project.totalChapters ?? project.chapterCount ?? 0,
    outlineMode: (project.outlineMode as 'full' | 'progressive') || 'full',
    planningRange: project.planningRange ?? 10,
    createdAt: new Date(project.createdAt),
    updatedAt: new Date(project.updatedAt),
  }
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
        // 正在请求中或已有数据，跳过重复请求
        const state = get()
        if (state.isLoading) return
        if (state.projects.length > 0) return

        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/projects')
          const data = await response.json()

          if (!data.success) {
            throw new Error(data.error.message)
          }

          const projects: Project[] = data.data.projects.map((project: ProjectResponse) => normalizeProject(project))
          const currentProject = get().currentProject
          const validCurrentProject = currentProject
            ? projects.find((project) => project.id === currentProject.id) ?? null
            : null

          if (currentProject && !validCurrentProject) {
            useChapterStore.getState().clearProjectContext()
          }

          set({ projects, currentProject: validCurrentProject, isLoading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '获取项目列表失败',
            isLoading: false,
          })
        }
      },

      // 设置当前项目
      setCurrentProject: (project) => {
        const normalizedProject = project ? normalizeProject(project) : null
        const previousProjectId = get().currentProject?.id
        if (previousProjectId !== normalizedProject?.id) {
          useChapterStore.getState().clearProjectContext()
        }
        set({ currentProject: normalizedProject })
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

          const newProject = normalizeProject(result.data.project ?? result.data)

          useChapterStore.getState().clearProjectContext()

          set((state) => {
            state.projects.unshift(newProject)
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

          const updatedProject = normalizeProject(result.data.project ?? result.data)

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

          const shouldClearProject = get().currentProject?.id === id

          if (shouldClearProject) {
            useChapterStore.getState().clearProjectContext()
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
