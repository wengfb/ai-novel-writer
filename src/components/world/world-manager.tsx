"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorldElementCard } from "@/components/world/world-element-card"

// 模拟数据
const mockElements = [
  {
    id: "1",
    name: "青云宗",
    type: "location" as const,
    description: "修仙界第一大宗门，坐落于青云山",
    tags: ["宗门", "正派"],
  },
  {
    id: "2",
    name: "玄天剑",
    type: "item" as const,
    description: "上古神器，威力无穷",
    tags: ["神器", "剑"],
  },
  {
    id: "3",
    name: "魔教",
    type: "faction" as const,
    description: "修仙界最大的邪恶势力",
    tags: ["邪派", "势力"],
  },
]

export function WorldManager() {
  const [selectedId, setSelectedId] = useState<string>()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="literary-title text-3xl">世界观管理</h1>
          <p className="text-muted-foreground mt-2">构建您的故事世界</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          添加元素
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="location">地点</TabsTrigger>
          <TabsTrigger value="item">物品</TabsTrigger>
          <TabsTrigger value="faction">势力</TabsTrigger>
          <TabsTrigger value="setting">设定</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockElements.map((element) => (
              <WorldElementCard
                key={element.id}
                {...element}
                onClick={setSelectedId}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="location" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockElements
              .filter((e) => e.type === "location")
              .map((element) => (
                <WorldElementCard
                  key={element.id}
                  {...element}
                  onClick={setSelectedId}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="item" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockElements
              .filter((e) => e.type === "item")
              .map((element) => (
                <WorldElementCard
                  key={element.id}
                  {...element}
                  onClick={setSelectedId}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="faction" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockElements
              .filter((e) => e.type === "faction")
              .map((element) => (
                <WorldElementCard
                  key={element.id}
                  {...element}
                  onClick={setSelectedId}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="setting" className="mt-6">
          <div className="text-muted-foreground">暂无设定类元素</div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
