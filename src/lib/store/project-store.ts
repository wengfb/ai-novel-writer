import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { useChapterStore } from './chapter-store'
import { projectsApi } from '@/lib/api/endpoints/projects'
import type { Project, CreateProjectParams, PovType } from '@/types'

export type { Project, CreateProjectParams }

type ProjectInput = Project | ProjectResponse

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  error: string | null

  fetchProjects: () => Promise<void>
  setCurrentProject: (project: ProjectInput | null) => void
  createProject: (data: CreateProjectParams) => Promise<Project>
  updateProject: (id: string, data: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  clearError: () => void
}

/** API 原始响应（日期可能是字符串，字段名可能混用） */
type ProjectResponse = Omit<Partial<Project>, 'createdAt' | 'updatedAt' | 'pov' | 'chapterCount'> & {
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
  pov?: string
  outlineMode?: string
  planningRange?: number | null
  createdAt: string | Date
  updatedAt: string | Date
}

function normalizeProject(project: ProjectResponse): Project {
  const pov = (project.pov || 'third_person') as PovType
  return {
    id: project.id,
    title: project.title,
    description: project.description ?? null,
    genre: project.genre,
    tags: project.tags ?? null,
    status: project.status,
    coverImage: project.coverImage ?? null,
    totalWords: project.totalWords ?? 0,
    chapterCount: project.chapterCount ?? project.totalChapters ?? 0,
    pov,
    outlineMode: (project.outlineMode as 'full' | 'progressive') || 'full',
    planningRange: project.planningRange ?? 10,
    createdAt: new Date(project.createdAt),
    updatedAt: new Date(project.updatedAt),
  }
}

export const useProjectStore = create<ProjectState>()(
  persist(
    immer((set, get) => ({
      projects: [],
      currentProject: null,
      isLoading: false,
      error: null,

      fetchProjects: async () => {
        const state = get()
        if (state.isLoading) return
        if (state.projects.length > 0) return

        set({ isLoading: true, error: null })
        try {
          const res = await projectsApi.list()
          const projects = (res.data?.projects ?? []).map((p) =>
            normalizeProject(p as ProjectResponse)
          )
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

      setCurrentProject: (project) => {
        const normalizedProject = project ? normalizeProject(project as ProjectResponse) : null
        const previousProjectId = get().currentProject?.id
        if (previousProjectId !== normalizedProject?.id) {
          useChapterStore.getState().clearProjectContext()
        }
        set({ currentProject: normalizedProject })
      },

      createProject: async (data) => {
        set({ isLoading: true, error: null })
        try {
          const res = await projectsApi.create(data)
          const payload = res.data?.project ?? (res.data as unknown as ProjectResponse)
          const newProject = normalizeProject(payload as ProjectResponse)

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

      updateProject: async (id, data) => {
        set({ isLoading: true, error: null })
        try {
          const res = await projectsApi.update(id, data)
          const payload = res.data?.project ?? (res.data as unknown as ProjectResponse)
          const updatedProject = normalizeProject(payload as ProjectResponse)

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

      deleteProject: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await projectsApi.delete(id)

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
