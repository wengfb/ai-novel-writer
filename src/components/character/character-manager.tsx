"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CharacterCard } from "@/components/character/character-card"

// 模拟数据
const mockCharacters = [
  {
    id: "1",
    name: "林轩",
    role: "主角",
    description: "天赋异禀的修仙者，性格坚毅",
    tags: ["主角", "修仙者", "正派"],
  },
  {
    id: "2",
    name: "苏婉儿",
    role: "女主角",
    description: "冰山美人，实则内心温柔",
    tags: ["女主", "剑修", "天才"],
  },
  {
    id: "3",
    name: "张三",
    role: "配角",
    description: "主角的好友，性格开朗",
    tags: ["配角", "好友"],
  },
]

export function CharacterManager() {
  const [selectedId, setSelectedId] = useState<string>()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="literary-title text-3xl">角色管理</h1>
          <p className="text-muted-foreground mt-2">
            管理您故事中的角色
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          添加角色
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockCharacters.map((character) => (
          <CharacterCard
            key={character.id}
            {...character}
            onClick={setSelectedId}
          />
        ))}
      </div>
    </div>
  )
}
