"use client"

import { User } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface CharacterCardProps {
  id: string
  name: string
  role: string
  description?: string
  tags?: string[]
  onClick: (id: string) => void
}

export function CharacterCard({
  id,
  name,
  role,
  description,
  tags = [],
  onClick,
}: CharacterCardProps) {
  return (
    <Card
      className="literary-card cursor-pointer hover:border-primary/30"
      onClick={() => onClick(id)}
    >
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{name}</h3>
            <p className="text-sm text-muted-foreground">{role}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {description}
          </p>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
