"use client"

import { useState } from "react"
import { Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { OutlineNodeItem } from "@/components/outline/outline-node-item"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// 模拟数据
const mockOutline = [
  {
    id: "1",
    title: "第一卷：初入仙门",
    type: "chapter" as const,
    children: [
      { id: "1-1", title: "场景1：山门前", type: "scene" as const },
      { id: "1-2", title: "场景2：入门测试", type: "scene" as const },
    ],
  },
  {
    id: "2",
    title: "第二卷：修炼之路",
    type: "chapter" as const,
    children: [
      { id: "2-1", title: "场景1：功法选择", type: "scene" as const },
    ],
  },
]

export function OutlineManager() {
  const [selectedId, setSelectedId] = useState<string>()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="literary-title text-3xl">大纲管理</h1>
          <p className="text-muted-foreground mt-2">规划您的故事结构</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            添加章节
          </Button>
          <Button>
            <Sparkles className="h-4 w-4 mr-2" />
            AI 生成大纲
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[400px_1fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle>大纲结构</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="p-2">
                {mockOutline.map((node) => (
                  <OutlineNodeItem
                    key={node.id}
                    node={node}
                    level={0}
                    onSelect={setSelectedId}
                    selectedId={selectedId}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>详情</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedId ? (
              <p className="text-muted-foreground">
                选中节点 ID: {selectedId}
              </p>
            ) : (
              <p className="text-muted-foreground">请选择一个节点查看详情</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
