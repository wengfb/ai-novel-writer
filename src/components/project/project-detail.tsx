"use client"

import { FileText, Users, Globe, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/project/stat-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ProjectDetail({ projectId }: { projectId: string }) {
  // TODO: 从 API 获取项目数据
  const project = {
    id: projectId,
    title: "修仙纪元",
    description: "一个关于修仙世界的史诗故事",
    wordCount: 45000,
    chapterCount: 15,
    characterCount: 8,
    worldElementCount: 12,
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="literary-title text-3xl">{project.title}</h1>
          <p className="text-muted-foreground mt-2">{project.description}</p>
        </div>
        <Button>开始创作</Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="总字数"
          value={project.wordCount.toLocaleString()}
          icon={BookOpen}
          description="已完成 45%"
        />
        <StatCard
          title="章节数"
          value={project.chapterCount}
          icon={FileText}
          description="15 个章节"
        />
        <StatCard
          title="角色数"
          value={project.characterCount}
          icon={Users}
          description="8 个角色"
        />
        <StatCard
          title="世界观元素"
          value={project.worldElementCount}
          icon={Globe}
          description="12 个元素"
        />
      </div>

      {/* 标签页 */}
      <Tabs defaultValue="chapters" className="w-full">
        <TabsList>
          <TabsTrigger value="chapters">章节</TabsTrigger>
          <TabsTrigger value="characters">角色</TabsTrigger>
          <TabsTrigger value="world">世界观</TabsTrigger>
        </TabsList>
        <TabsContent value="chapters" className="mt-4">
          <div className="literary-card p-6">
            <p className="text-muted-foreground">章节列表将在这里显示</p>
          </div>
        </TabsContent>
        <TabsContent value="characters" className="mt-4">
          <div className="literary-card p-6">
            <p className="text-muted-foreground">角色列表将在这里显示</p>
          </div>
        </TabsContent>
        <TabsContent value="world" className="mt-4">
          <div className="literary-card p-6">
            <p className="text-muted-foreground">世界观元素将在这里显示</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
