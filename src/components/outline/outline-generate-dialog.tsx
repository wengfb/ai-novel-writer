'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, BookOpen, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useCurrentProject } from '@/hooks/use-projects'

interface OutlineGenerateDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

const GENRES = ['玄幻', '科幻', '都市', '言情', '武侠', '历史', '其他'] as const
const GENRE_CHINESE: Record<string, string> = {
  xuan_huan: '玄幻', sci_fi: '科幻', urban: '都市',
  romance: '言情', wuxia: '武侠', historical: '历史', other: '其他',
}

export function OutlineGenerateDialog({
  projectId,
  open,
  onOpenChange,
  onComplete,
}: OutlineGenerateDialogProps) {
  const { currentProject } = useCurrentProject()

  const [genre, setGenre] = useState<string>('玄幻')
  const [coreIdea, setCoreIdea] = useState('')
  const [chapterCount, setChapterCount] = useState(30)
  const [targetWords, setTargetWords] = useState(2000)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedOutline, setGeneratedOutline] = useState<any>(null)
  const [step, setStep] = useState<'config' | 'preview'>('config')
  const [generationStats, setGenerationStats] = useState<{ cost: number; duration: number } | null>(null)

  // Pre-fill genre from project
  useEffect(() => {
    if (currentProject?.genre && open) {
      const mapped = GENRE_CHINESE[currentProject.genre] || currentProject.genre
      if (GENRES.includes(mapped as any)) {
        setGenre(mapped)
      }
    }
  }, [currentProject, open])

  // Reset state on open
  useEffect(() => {
    if (open) {
      setStep('config')
      setGeneratedOutline(null)
      setGenerationStats(null)
    }
  }, [open])

  const handleGenerate = async () => {
    if (!coreIdea.trim() || coreIdea.trim().length < 10) {
      toast.error('核心创意至少需要10个字符')
      return
    }

    setIsGenerating(true)
    try {
      const res = await fetch(`/api/ai/generate/outline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          genre,
          coreIdea: coreIdea.trim(),
          chapterCount,
          targetWords,
        }),
      })

      const result = await res.json()

      if (!result.success) {
        throw new Error(result.error?.message || '生成失败')
      }

      const outline = result.data.outline
      // 如果 AI 未返回 suggestedTotalWords，使用 API 计算的兜底值
      if (!outline.suggestedTotalWords && result.data.suggestedTotalWords) {
        outline.suggestedTotalWords = result.data.suggestedTotalWords
      }
      if (!outline.wordCountRationale && result.data.wordCountRationale) {
        outline.wordCountRationale = result.data.wordCountRationale
      }
      setGeneratedOutline(outline)
      setGenerationStats({
        cost: result.data.cost || 0,
        duration: result.data.duration || 0,
      })
      setStep('preview')
      toast.success('大纲生成完成！')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '大纲生成失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleConfirm = () => {
    onComplete()
  }

  const handleClose = () => {
    setStep('config')
    setGeneratedOutline(null)
    setGenerationStats(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI 生成大纲
          </DialogTitle>
          <DialogDescription>
            {step === 'config'
              ? '描述你的故事核心创意，AI 将自动生成结构化的章节大纲'
              : '生成完成，请查看预览。大纲已自动保存'}
          </DialogDescription>
        </DialogHeader>

        {step === 'config' ? (
          <div className="space-y-5 py-2">
            {/* Genre select */}
            <div className="space-y-2">
              <Label>故事类型</Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger>
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Core idea */}
            <div className="space-y-2">
              <Label>核心创意</Label>
              <Textarea
                placeholder="描述你的故事核心创意，例如：'一个被家族遗弃的少年，偶然得到神秘玉石，从此踏上修仙之路...'"
                value={coreIdea}
                onChange={(e) => setCoreIdea(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                至少10个字符，越详细生成效果越好
              </p>
            </div>

            {/* Chapter count */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>章节数量</Label>
                <span className="text-sm font-mono text-muted-foreground">{chapterCount} 章</span>
              </div>
              <Slider
                value={[chapterCount]}
                onValueChange={([v]) => setChapterCount(v)}
                min={5}
                max={100}
                step={1}
              />
            </div>

            {/* Target words per chapter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>每章目标字数</Label>
                <span className="text-sm font-mono text-muted-foreground">{targetWords.toLocaleString()} 字</span>
              </div>
              <Slider
                value={[targetWords]}
                onValueChange={([v]) => setTargetWords(v)}
                min={500}
                max={10000}
                step={500}
              />
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 max-h-[50vh]">
            <div className="space-y-4 py-2">
              {/* Stats */}
              {generationStats && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span>耗时：{(generationStats.duration / 1000).toFixed(1)}s</span>
                  <span>费用：${generationStats.cost.toFixed(4)}</span>
                </div>
              )}

              {/* 建议篇幅汇总 */}
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

              {/* Chapter list */}
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
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {chapter.summary}
                    </p>
                    {chapter.estimatedWords ? (
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1 inline-flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400" />
                        建议 {chapter.estimatedWords.toLocaleString()} 字
                      </span>
                    ) : (
                      <span className="text-xs text-orange-500 mt-1 block">
                        未生成建议篇幅
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Characters preview */}
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

              {/* World settings preview */}
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
        )}

        <DialogFooter className="mt-4">
          {step === 'config' ? (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || coreIdea.trim().length < 10}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  正在生成大纲...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  开始生成
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={() => setStep('config')}>
                重新生成
              </Button>
              <Button onClick={handleConfirm} className="flex-1">
                完成
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
