'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { BookOpen, FileText } from 'lucide-react'

interface OutlineGeneratePreviewProps {
  generatedOutline: any
  generationStats: { cost: number; duration: number } | null
}

/** 大纲生成结果预览 */
export function OutlineGeneratePreview({
  generatedOutline,
  generationStats,
}: OutlineGeneratePreviewProps) {
  return (
    <ScrollArea className="flex-1 max-h-[50vh]">
      <div className="space-y-4 py-2">
        {generationStats && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <span>耗时：{(generationStats.duration / 1000).toFixed(1)}s</span>
            <span>费用：${generationStats.cost.toFixed(4)}</span>
          </div>
        )}

        {generatedOutline?.suggestedTotalWords && (
          <div className="p-4 rounded-lg border-2 border-purple-200 bg-purple-50 dark:bg-purple-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                建议总篇幅
              </span>
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {generatedOutline.suggestedTotalWords.toLocaleString()} 字
              </span>
            </div>
            {generatedOutline.wordCountRationale && (
              <p className="text-xs text-purple-600/80 dark:text-purple-400/80 leading-relaxed">
                {generatedOutline.wordCountRationale}
              </p>
            )}
          </div>
        )}

        {generatedOutline?.chapters?.map((chapter: any, i: number) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <Badge variant="outline" className="mt-0.5 shrink-0 font-mono text-xs">
              第{chapter.chapterNumber || i + 1}章
            </Badge>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm">{chapter.title}</h4>
                {chapter.plotFunction && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {chapter.plotFunction}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{chapter.summary}</p>
              {chapter.estimatedWords ? (
                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1 inline-flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400" />
                  建议 {chapter.estimatedWords.toLocaleString()} 字
                </span>
              ) : (
                <span className="text-xs text-orange-500 mt-1 block">未生成建议篇幅</span>
              )}
            </div>
          </div>
        ))}

        {generatedOutline?.characters && generatedOutline.characters.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              已创建角色 ({generatedOutline.characters.length})
            </h4>
            <div className="space-y-2">
              {generatedOutline.characters.map((char: any, i: number) => (
                <div key={i} className="p-2 rounded border text-sm">
                  <span className="font-medium">{char.name}</span>
                  {char.personality && (
                    <span className="text-muted-foreground"> — {char.personality}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {generatedOutline?.worldSettings && generatedOutline.worldSettings.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-green-500" />
              已创建世界观元素 ({generatedOutline.worldSettings.length})
            </h4>
            <div className="space-y-2">
              {generatedOutline.worldSettings.map((el: any, i: number) => (
                <div key={i} className="p-2 rounded border text-sm">
                  <span className="font-medium">{el.name}</span>
                  {el.description && (
                    <span className="text-muted-foreground"> — {el.description}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
