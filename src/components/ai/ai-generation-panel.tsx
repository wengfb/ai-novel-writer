"use client"

import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GenerationTaskCard } from "@/components/ai/generation-task-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// 模拟数据
const mockTasks = [
  {
    id: "1",
    type: "章节生成",
    status: "running" as const,
    progress: 65,
    createdAt: new Date(),
  },
  {
    id: "2",
    type: "大纲生成",
    status: "completed" as const,
    createdAt: new Date(Date.now() - 3600000),
    completedAt: new Date(Date.now() - 1800000),
  },
]

export function AIGenerationPanel() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="literary-title text-3xl">AI 生成</h1>
          <p className="text-muted-foreground mt-2">管理 AI 生成任务</p>
        </div>
        <Button>
          <Sparkles className="h-4 w-4 mr-2" />
          新建任务
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">总任务数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">进行中</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">已完成</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">任务列表</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockTasks.map((task) => (
            <GenerationTaskCard key={task.id} {...task} />
          ))}
        </div>
      </div>
    </div>
  )
}
