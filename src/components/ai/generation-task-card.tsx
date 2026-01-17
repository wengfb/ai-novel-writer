"use client"

import { Clock, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface GenerationTaskCardProps {
  id: string
  type: string
  status: "pending" | "running" | "completed" | "failed"
  progress?: number
  createdAt: Date
  completedAt?: Date
}

const statusConfig = {
  pending: { label: "等待中", icon: Clock, color: "text-yellow-600" },
  running: { label: "生成中", icon: Loader2, color: "text-blue-600" },
  completed: { label: "已完成", icon: CheckCircle, color: "text-green-600" },
  failed: { label: "失败", icon: XCircle, color: "text-red-600" },
}

export function GenerationTaskCard({
  id,
  type,
  status,
  progress = 0,
  createdAt,
  completedAt,
}: GenerationTaskCardProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Card className="literary-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold">{type}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              创建于 {createdAt.toLocaleString()}
            </p>
          </div>
          <Badge variant="outline" className={config.color}>
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {status === "running" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">进度</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        {completedAt && (
          <p className="text-xs text-muted-foreground">
            完成于 {completedAt.toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
