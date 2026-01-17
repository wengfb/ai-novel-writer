"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"

const genres = [
  "玄幻",
  "武侠",
  "仙侠",
  "科幻",
  "都市",
  "历史",
  "军事",
  "悬疑",
  "言情",
  "其他",
]

const aiModels = [
  { value: "gemini-3-flash", label: "Gemini 3 Flash (快速)" },
  { value: "gemini-3-pro", label: "Gemini 3 Pro (高质量)" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
]

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    genre: "",
    targetWordCount: "",
    aiModel: "gemini-3-flash",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: 调用 API 创建项目
    console.log("创建项目:", formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <Plus className="h-4 w-4 mr-2" />
          新建项目
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="literary-title">创建新项目</DialogTitle>
            <DialogDescription>
              开始您的创作之旅，AI 将协助您完成整个创作过程
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">项目名称 *</Label>
              <Input
                id="title"
                placeholder="例如：修仙纪元"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">简介</Label>
              <Textarea
                id="description"
                placeholder="简要描述您的故事..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="genre">类型</Label>
                <Select
                  value={formData.genre}
                  onValueChange={(value) =>
                    setFormData({ ...formData, genre: value })
                  }
                >
                  <SelectTrigger id="genre">
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="targetWordCount">目标字数</Label>
                <Input
                  id="targetWordCount"
                  type="number"
                  placeholder="100000"
                  value={formData.targetWordCount}
                  onChange={(e) =>
                    setFormData({ ...formData, targetWordCount: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="aiModel">AI 模型</Label>
              <Select
                value={formData.aiModel}
                onValueChange={(value) =>
                  setFormData({ ...formData, aiModel: value })
                }
              >
                <SelectTrigger id="aiModel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aiModels.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit">创建项目</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
