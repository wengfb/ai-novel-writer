'use client'

import { useMemo, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { BookOpen, FileText, Clapperboard, ChevronRight, ChevronDown, GitBranch, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Outline } from '@/lib/store/outline-store'
import type { StatusFilter } from './outline-toolbar'
import { cn } from '@/lib/utils'

interface OutlineTreeViewProps {
  outlines: Outline[]
  statusFilter: StatusFilter
  onSelectOutline: (outline: Outline) => void
  onCreateOutline: () => void
}

const typeConfig = {
  volume: { icon: BookOpen, textColor: 'text-blue-600', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500' },
  chapter: { icon: FileText, textColor: 'text-green-600', bgColor: 'bg-green-500/10', borderColor: 'border-green-500' },
  scene: { icon: Clapperboard, textColor: 'text-orange-600', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500' },
}

export function OutlineTreeView({
  outlines,
  statusFilter,
  onSelectOutline,
  onCreateOutline,
}: OutlineTreeViewProps) {
  const [collapsedVolumes, setCollapsedVolumes] = useState<Set<string>>(new Set())

  const filterNode = (node: Outline): boolean => {
    if (statusFilter === 'all') return true
    if (node.status === statusFilter) return true
    return node.children?.some(filterNode) ?? false
  }

  const filteredOutlines = useMemo(
    () => outlines.filter(filterNode),
    [outlines, statusFilter]
  )

  if (outlines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground gap-4">
        <GitBranch className="h-12 w-12 opacity-20" />
        <div className="text-center">
          <p className="text-sm font-medium">还没有大纲</p>
          <p className="text-xs mt-1">使用工具栏的「新建大纲」或「AI 生成」来创建第一个大纲节点</p>
        </div>
        <Button variant="outline" size="sm" onClick={onCreateOutline}>
          <Plus className="mr-1.5 h-4 w-4" />
          新建大纲
        </Button>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-6 flex gap-0 min-w-max">
        {filteredOutlines.map((volume, vi) => {
          const filteredChapters = (volume.children || []).filter(filterNode)
          const isCollapsed = collapsedVolumes.has(volume.id)

          return (
            <TreeVolumeColumn
              key={volume.id}
              volume={volume}
              index={vi}
              isFirst={vi === 0}
              chapters={filteredChapters}
              isCollapsed={isCollapsed}
              onToggleCollapse={() => {
                setCollapsedVolumes((prev) => {
                  const next = new Set(prev)
                  if (next.has(volume.id)) next.delete(volume.id)
                  else next.add(volume.id)
                  return next
                })
              }}
              onSelectOutline={onSelectOutline}
              statusFilter={statusFilter}
            />
          )
        })}
      </div>
    </ScrollArea>
  )
}

function TreeVolumeColumn({
  volume,
  index,
  isFirst,
  chapters,
  isCollapsed,
  onToggleCollapse,
  onSelectOutline,
  statusFilter,
}: {
  volume: Outline
  index: number
  isFirst: boolean
  chapters: Outline[]
  isCollapsed: boolean
  onToggleCollapse: () => void
  onSelectOutline: (outline: Outline) => void
  statusFilter: StatusFilter
}) {
  const config = typeConfig.volume
  const Icon = config.icon

  return (
    <div className={cn('flex items-start', !isFirst && 'ml-8')}>
      {/* Volume column */}
      <div className="flex flex-col items-center">
        {/* Connector from volume to chapters will go from right side */}
        <TreeVolumeNode
          volume={volume}
          config={config}
          Icon={Icon}
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
          onSelect={onSelectOutline}
        />
      </div>

      {/* Chapters column */}
      {!isCollapsed && chapters.length > 0 && (
        <>
          {/* Horizontal connector */}
          <div className="flex items-center mx-4">
            <div className="h-px w-8 bg-border" />
          </div>

          <div className="flex flex-col gap-4">
            {chapters.map((chapter, ci) => {
              const filteredScenes = (chapter.children || []).filter(
                (s) => statusFilter === 'all' || s.status === statusFilter
              )
              return (
                <TreeChapterRow
                  key={chapter.id}
                  chapter={chapter}
                  index={ci}
                  total={chapters.length}
                  scenes={filteredScenes}
                  isFirst={ci === 0}
                  onSelectOutline={onSelectOutline}
                  statusFilter={statusFilter}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function TreeVolumeNode({
  volume,
  config,
  Icon,
  isCollapsed,
  onToggleCollapse,
  onSelect,
}: {
  volume: Outline
  config: typeof typeConfig.volume
  Icon: typeof BookOpen
  isCollapsed: boolean
  onToggleCollapse: () => void
  onSelect: (outline: Outline) => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer',
            'hover:shadow-md transition-all min-w-[120px]',
            config.borderColor,
            config.bgColor
          )}
          onClick={() => onSelect(volume)}
        >
          <div className="flex items-center gap-2">
            <Icon className={cn('h-5 w-5', config.textColor)} />
            <button
              onClick={(e) => { e.stopPropagation(); onToggleCollapse() }}
              className="p-0.5 hover:bg-muted rounded"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
          <span className="font-semibold text-sm text-center">{volume.title}</span>
          <Badge variant="outline" className="text-xs">卷</Badge>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right">
        <div className="space-y-1 text-sm">
          <p className="font-medium">{volume.title}</p>
          {volume.description && <p className="text-muted-foreground">{volume.description}</p>}
          {volume.chapter && <p>字数：{volume.chapter.wordCount.toLocaleString()}</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

function TreeChapterRow({
  chapter,
  index,
  total,
  scenes,
  isFirst,
  onSelectOutline,
  statusFilter,
}: {
  chapter: Outline
  index: number
  total: number
  scenes: Outline[]
  isFirst: boolean
  onSelectOutline: (outline: Outline) => void
  statusFilter: StatusFilter
}) {
  const config = typeConfig.chapter
  const Icon = config.icon
  const [expanded, setExpanded] = useState(false)
  const hasScenes = scenes.length > 0

  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg border cursor-pointer',
                'hover:shadow-md transition-all min-w-[130px]',
                config.borderColor,
                config.bgColor
              )}
              onClick={() => onSelectOutline(chapter)}
            >
              <Icon className={cn('h-4 w-4', config.textColor)} />
              <span className="font-medium text-sm truncate max-w-[100px]">{chapter.title}</span>
              {hasScenes && (
                <button
                  onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
                  className="p-0.5 hover:bg-muted rounded shrink-0"
                >
                  {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <div className="space-y-1 text-sm">
              <p className="font-medium">{chapter.title}</p>
              {chapter.description && <p className="text-muted-foreground">{chapter.description}</p>}
              {chapter.chapter && <p>字数：{chapter.chapter.wordCount.toLocaleString()}</p>}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Scenes */}
        {expanded && hasScenes && (
          <div className="ml-0 mt-3 space-y-2 relative">
            {scenes.map((scene, si) => (<div key={scene.id}/> /* placeholder for now */))}
          </div>
        )}
      </div>

      {/* Connector to next chapter in row */}
      {hasScenes && (
        <>
          <div className="w-6 h-px bg-border mx-2" />
          <div className="flex flex-col gap-2">
            {scenes.filter((s) => statusFilter === 'all' || s.status === statusFilter).map((scene) => (
              <TreeSceneNode
                key={scene.id}
                scene={scene}
                onSelect={() => onSelectOutline(scene)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function TreeSceneNode({
  scene,
  onSelect,
}: {
  scene: Outline
  onSelect: () => void
}) {
  const config = typeConfig.scene
  const Icon = config.icon

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'flex items-center gap-1.5 px-2 py-2 rounded-md border cursor-pointer',
            'hover:shadow-sm transition-all',
            config.borderColor,
            config.bgColor
          )}
          onClick={onSelect}
        >
          <Icon className={cn('h-3.5 w-3.5', config.textColor)} />
          <span className="text-xs font-medium truncate max-w-[80px]">{scene.title}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right">
        <div className="space-y-1 text-sm">
          <p className="font-medium">{scene.title}</p>
          {scene.description && <p className="text-muted-foreground">{scene.description}</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
