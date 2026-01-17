"use client"

import { ProjectCard } from "@/components/project/project-card"
import { CreateProjectDialog } from "@/components/project/create-project-dialog"

// 临时模拟数据
const mockProjects = [
  {
    id: "1",
    title: "修仙纪元",
    description: "一个关于修仙世界的史诗故事",
    genre: "玄幻",
    wordCount: 45000,
    targetWordCount: 100000,
    chapterCount: 15,
    updatedAt: new Date(),
  },
  {
    id: "2",
    title: "星际迷航",
    description: "探索未知宇宙的冒险之旅",
    genre: "科幻",
    wordCount: 28000,
    targetWordCount: 80000,
    chapterCount: 10,
    updatedAt: new Date(Date.now() - 86400000),
  },
]

export function ProjectList() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="literary-title text-3xl">我的项目</h1>
          <p className="text-muted-foreground mt-2">
            管理您的小说创作项目
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockProjects.map((project) => (
          <ProjectCard key={project.id} {...project} />
        ))}
      </div>
    </div>
  )
}
