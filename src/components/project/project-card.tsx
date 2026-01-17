"use client"

import Link from "next/link"
import { BookOpen, Calendar, FileText } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface ProjectCardProps {
  id: string
  title: string
  description?: string
  genre?: string
  wordCount: number
  targetWordCount?: number
  chapterCount: number
  updatedAt: Date
}

export function ProjectCard({
  id,
  title,
  description,
  genre,
  wordCount,
  targetWordCount,
  chapterCount,
  updatedAt,
}: ProjectCardProps) {
  const progress = targetWordCount
    ? Math.min((wordCount / targetWordCount) * 100, 100)
    : 0

  return (
    <Link href={`/projects/${id}`}>
      <Card className="literary-card h-full hover:border-primary/30 cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="literary-title text-xl mb-2">{title}</h3>
              {genre && (
                <Badge variant="secondary" className="mb-2">
                  {genre}
                </Badge>
              )}
            </div>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </div>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{chapterCount} 章节</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(updatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {targetWordCount && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">进度</span>
                <span className="font-medium">
                  {wordCount.toLocaleString()} / {targetWordCount.toLocaleString()} 字
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>

        <CardFooter className="text-xs text-muted-foreground">
          最后更新：{new Date(updatedAt).toLocaleString()}
        </CardFooter>
      </Card>
    </Link>
  )
}
