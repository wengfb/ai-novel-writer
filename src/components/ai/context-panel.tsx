'use client'

import { useEffect, useState } from 'react'
import { useAIStore } from '@/lib/store/ai-store'
import { useChapterStore } from '@/lib/store/chapter-store'
import { aiApi } from '@/lib/api/endpoints/ai'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Users, Box, FileText, ShieldCheck, Loader2, Eye } from 'lucide-react'

const MAX_TOKENS = 100000 // 与 ContextManager 默认值一致

function getTokenBarColor(ratio: number): string {
  if (ratio < 0.5) return 'bg-green-500'
  if (ratio < 0.8) return 'bg-yellow-500'
  return 'bg-red-500'
}

export function ContextPanel() {
  const { currentChapter } = useChapterStore()
  const {
    context, isLoadingContext, fetchContext,
    contextCustomization, toggleCharacterInclusion, toggleElementInclusion,
  } = useAIStore()
  const [isChecking, setIsChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<{
    report: string
    summary: { high: number; medium: number; low: number }
  } | null>(null)
  const [showReport, setShowReport] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (currentChapter) {
      fetchContext(currentChapter.projectId, currentChapter.id)
    }
  }, [currentChapter?.id])

  const handleCheck = async () => {
    if (!currentChapter || isChecking) return
    setIsChecking(true)
    try {
      const result = await aiApi.checkConsistency({
        projectId: currentChapter.projectId,
        chapterId: currentChapter.id,
      })
      setCheckResult(result)
      setShowReport(true)
    } catch (err) {
      console.error('Consistency check failed:', err)
    } finally {
      setIsChecking(false)
    }
  }

  if (!currentChapter) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>请先选择章节</p>
      </div>
    )
  }

  if (isLoadingContext) {
    return <ContextPanelSkeleton />
  }

  if (!context) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>无法加载上下文信息</p>
      </div>
    )
  }

  const tokenRatio = context.totalTokens / MAX_TOKENS
  const barColor = getTokenBarColor(tokenRatio)

  const buildPreviewText = () => {
    const lines: string[] = []
    lines.push(`## 故事信息\n- 当前章节：第${currentChapter.chapterNumber}章 ${currentChapter.title}\n`)

    const activeChars = context.characters.filter(
      c => !contextCustomization.excludedCharacterIds.includes(c.id)
    )
    if (activeChars.length > 0) {
      lines.push('## 角色信息')
      activeChars.forEach(c => lines.push(`- ${c.name}（${c.role}）`))
      lines.push('')
    }

    const activeElements = context.worldElements.filter(
      e => !contextCustomization.excludedElementIds.includes(e.id)
    )
    if (activeElements.length > 0) {
      lines.push('## 世界观设定')
      activeElements.forEach(e => lines.push(`- ${e.name}（${e.type}）`))
      lines.push('')
    }

    lines.push('## 前文摘要')
    context.previousChapters.forEach(c => lines.push(`- 第${c.chapterNumber}章：${c.summary}`))
    lines.push('')

    return lines.join('\n')
  }

  return (
    <>
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          {/* Token 使用量 + 进度条 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold">当前上下文</h3>
              <Badge variant="outline">{context.totalTokens.toLocaleString()} / {MAX_TOKENS.toLocaleString()}</Badge>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${Math.min(tokenRatio * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* 当前章节 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">当前章节</h4>
            </div>
            <div className="text-sm text-muted-foreground">
              第 {currentChapter.chapterNumber} 章：{currentChapter.title}
            </div>
          </div>

          {/* 活跃角色（含排除开关） */}
          {context.characters.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">活跃角色</h4>
              </div>
              <div className="space-y-1.5">
                {context.characters.map((character) => {
                  const isExcluded = contextCustomization.excludedCharacterIds.includes(character.id)
                  return (
                    <div
                      key={character.id}
                      className={`flex items-center justify-between p-2 rounded-md ${isExcluded ? 'bg-muted/30 opacity-50' : 'bg-muted/50'}`}
                    >
                      <span className="text-sm">{character.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {character.role}
                        </Badge>
                        <Switch
                          checked={!isExcluded}
                          onCheckedChange={() => toggleCharacterInclusion(character.id)}
                          className="scale-75"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 世界观元素（含排除开关） */}
          {context.worldElements.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Box className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">相关世界观</h4>
              </div>
              <div className="space-y-1.5">
                {context.worldElements.map((element) => {
                  const isExcluded = contextCustomization.excludedElementIds.includes(element.id)
                  return (
                    <div
                      key={element.id}
                      className={`flex items-center justify-between p-2 rounded-md ${isExcluded ? 'bg-muted/30 opacity-50' : 'bg-muted/50'}`}
                    >
                      <span className="text-sm">{element.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {element.type}
                        </Badge>
                        <Switch
                          checked={!isExcluded}
                          onCheckedChange={() => toggleElementInclusion(element.id)}
                          className="scale-75"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 操作按钮组 */}
          <div className="pt-2 border-t space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              预览 AI 所见内容
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleCheck}
              disabled={isChecking}
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4 mr-2" />
              )}
              {isChecking ? '检查中...' : '检查一致性'}
            </Button>
          </div>
        </div>
      </ScrollArea>

      {/* 检查报告弹窗 */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              世界观一致性检查报告
            </DialogTitle>
          </DialogHeader>
          {checkResult && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <Badge variant="destructive">高 {checkResult.summary.high}</Badge>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">中 {checkResult.summary.medium}</Badge>
                <Badge variant="outline">低 {checkResult.summary.low}</Badge>
              </div>
              <ScrollArea className="max-h-[50vh]">
                <pre className="text-sm whitespace-pre-wrap font-sans">
                  {checkResult.report}
                </pre>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 预览 AI 所见内容弹窗 */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              AI 将看到以下上下文
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[55vh]">
            <pre className="text-sm whitespace-pre-wrap font-sans bg-muted/30 p-4 rounded-md">
              {buildPreviewText()}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ContextPanelSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  )
}
