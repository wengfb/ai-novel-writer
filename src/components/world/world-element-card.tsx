"use client"

import { MapPin, Package, Shield, Scroll } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const iconMap = {
  location: MapPin,
  item: Package,
  faction: Shield,
  setting: Scroll,
}

interface WorldElementCardProps {
  id: string
  name: string
  type: "location" | "item" | "faction" | "setting"
  description?: string
  tags?: string[]
  onClick: (id: string) => void
}

export function WorldElementCard({
  id,
  name,
  type,
  description,
  tags = [],
  onClick,
}: WorldElementCardProps) {
  const Icon = iconMap[type]

  return (
    <Card
      className="literary-card cursor-pointer hover:border-primary/30"
      onClick={() => onClick(id)}
    >
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{name}</h3>
            <Badge variant="outline" className="mt-1">
              {type === "location" && "地点"}
              {type === "item" && "物品"}
              {type === "faction" && "势力"}
              {type === "setting" && "设定"}
            </Badge>
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
