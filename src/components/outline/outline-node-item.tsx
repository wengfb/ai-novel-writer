"use client"

import { ChevronRight, ChevronDown, FileText, Folder } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface OutlineNode {
  id: string
  title: string
  type: "chapter" | "scene"
  children?: OutlineNode[]
  description?: string
}

interface OutlineNodeItemProps {
  node: OutlineNode
  level: number
  onSelect: (nodeId: string) => void
  selectedId?: string
}

export function OutlineNodeItem({
  node,
  level,
  onSelect,
  selectedId,
}: OutlineNodeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start text-left h-auto py-2",
          selectedId === node.id && "bg-accent"
        )}
        style={{ paddingLeft: `${level * 1.5}rem` }}
        onClick={() => onSelect(node.id)}
      >
        <div className="flex items-center gap-2 w-full">
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
              className="hover:bg-accent rounded p-0.5"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}
          {node.type === "chapter" ? (
            <Folder className="h-4 w-4 text-primary" />
          ) : (
            <FileText className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="flex-1 truncate">{node.title}</span>
        </div>
      </Button>

      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <OutlineNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
