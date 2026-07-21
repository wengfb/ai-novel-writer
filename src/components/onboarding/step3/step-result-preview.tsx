'use client'

import { Badge } from '@/components/ui/badge'
import type { StoryIdeaCard } from '@/types'
import type { ChapterCalculation } from '@/lib/ai/onboarding/types'
import type { StepKey } from './types'
import { CollapsibleSection } from './collapsible-section'
import { DiffWarningBanner } from './diff-warning-banner'

/** 从 API 响应数据中提取数组——兼容 { items: [...] } 双层嵌套 */
export function extractArray(data: any): any[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  for (const key of Object.keys(data)) {
    if (Array.isArray(data[key])) return data[key]
  }
  return []
}

export function StepResultPreview({
  stepKey,
  data,
}: {
  stepKey: StepKey
  data: Record<string, unknown>
  idea: StoryIdeaCard
}) {
  switch (stepKey) {
    case 'architecture': {
      const arch = data.architecture as any || data
      return (
        <div className="space-y-3 text-sm">
          <CollapsibleSection title="故事梗概" defaultOpen>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{arch.storySummary}</p>
          </CollapsibleSection>
          {arch.mainConflict && (
            <CollapsibleSection title="核心冲突">
              <p className="text-muted-foreground">{arch.mainConflict}</p>
            </CollapsibleSection>
          )}
          {arch.volumePlan && (
            <CollapsibleSection title={`分卷方案（${arch.volumePlan.length}卷）`}>
              <div className="space-y-2">
                {(arch.volumePlan as any[]).map((v: any) => (
                  <div key={v.volumeNumber} className="p-2 bg-muted/40 rounded">
                    <span className="font-medium">第{v.volumeNumber}卷：{v.title}</span>
                    <span className="text-xs text-muted-foreground ml-2">第{v.chapterRange?.[0]}-{v.chapterRange?.[1]}章</span>
                    {v.description && <p className="text-xs text-muted-foreground mt-1">{v.description}</p>}
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}
          {data.chapterCalculation && (
            <DiffWarningBanner calc={data.chapterCalculation as ChapterCalculation} />
          )}
        </div>
      )
    }

    case 'characters': {
      const chars = extractArray((data.characters as any)?.characters || data.characters)
      return (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">共 {Array.isArray(chars) ? chars.length : 0} 个角色</p>
          {Array.isArray(chars) && chars.map((c: any) => (
            <CollapsibleSection key={c.name} title={`${c.name}（${c.role || '未知'}）`}>
              <div className="space-y-1 text-xs">
                {c.description && <p className="text-muted-foreground">{c.description}</p>}
                {c.personality && <p>性格：{Array.isArray(c.personality) ? c.personality.join('、') : c.personality}</p>}
                {c.goal && <p>目标：{c.goal}</p>}
                {c.characterArc && <p>弧光：{c.characterArc}</p>}
                {c.dialogueStyle && <p>对话：{c.dialogueStyle}</p>}
                {c.relationships?.length > 0 && (
                  <p>关系：{c.relationships.map((r: any) => `${r.targetName}(${r.relation})`).join('、')}</p>
                )}
              </div>
            </CollapsibleSection>
          ))}
        </div>
      )
    }

    case 'world': {
      const ws = extractArray((data.worldSettings as any)?.worldSettings || data.worldSettings)
      return (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">共 {Array.isArray(ws) ? ws.length : 0} 个世界元素</p>
          {Array.isArray(ws) && ws.map((w: any) => (
            <CollapsibleSection key={w.name} title={`${w.name}（${w.type || '其他'} · ${w.scope || 'global'} · 重要度${w.importance || 5}）`}>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{w.description}</p>
            </CollapsibleSection>
          ))}
        </div>
      )
    }

    case 'volume': {
      const chs = extractArray((data.chapters as any)?.chapters || data.chapters)
      const outline = data as any
      const planned = outline.plannedTotalChapters as number | undefined
      const overall = (outline.overallOutline as string | undefined) || ''
      return (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            开篇细纲 {Array.isArray(chs) ? chs.length : 0} 章
            {planned ? ` · 全书计划 ${planned} 章` : ''}
            {outline.tensionArcSummary && (
              <span className="block text-xs mt-1 italic">张力曲线：{outline.tensionArcSummary}</span>
            )}
          </p>
          {overall && (
            <CollapsibleSection title="全书总纲">
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{overall}</p>
            </CollapsibleSection>
          )}
          <div className="max-h-[400px] overflow-auto space-y-1">
            {Array.isArray(chs) &&
              chs.map((c: any) => (
                <div
                  key={c.chapterNumber}
                  className="flex items-start gap-2 py-1 border-b border-muted text-xs"
                >
                  <span className="shrink-0 text-muted-foreground w-8">第{c.chapterNumber}章</span>
                  <span className="font-medium shrink-0 w-24 truncate">{c.title}</span>
                  <span className="text-muted-foreground line-clamp-1 flex-1">{c.summary}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {c.plotFunction}·{c.tensionLevel}
                  </Badge>
                </div>
              ))}
          </div>
        </div>
      )
    }

    case 'foreshadowings': {
      const fs = extractArray((data.foreshadowings as any)?.foreshadowings || data.foreshadowings)
      return (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">共 {Array.isArray(fs) ? fs.length : 0} 个伏笔</p>
          {Array.isArray(fs) && fs.map((f: any) => (
            <div key={f.title} className="p-2 bg-muted/40 rounded text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{f.title}</span>
                <Badge variant="secondary" className="text-[10px]">{f.type}</Badge>
                <span className="text-muted-foreground">重要度{f.importance}</span>
                <span className="text-muted-foreground">→第{f.expectedChapterNumber}章</span>
              </div>
              <p className="text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      )
    }

    case 'styleAnchor': {
      const content = (data as any).content || ''
      return (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            风格锚点已生成（{(data as any).wordCount || content.length} 字）
          </p>
          <div className="p-4 bg-muted/40 rounded text-xs leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-auto">
            {String(content).slice(0, 500)}
            {String(content).length > 500 && <span className="text-muted-foreground">...</span>}
          </div>
        </div>
      )
    }

    default:
      return null
  }
}
