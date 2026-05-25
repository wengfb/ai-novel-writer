'use client'

import { useState } from 'react'
import { useAIStore } from '@/lib/store/ai-store'
import { useChapterStore } from '@/lib/store/chapter-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Wand2, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

interface AIContinueButtonProps {
  onContentGenerated?: (content: string) => void
  defaultTargetWords?: number
}

export function AIContinueButton({ onContentGenerated, defaultTargetWords }: AIContinueButtonProps) {
  const { currentChapter } = useChapterStore()
  const { isContinuing, continueWriting, cancelGeneration } = useAIStore()
  const [progress, setProgress] = useState('')
  const [targetWords, setTargetWords] = useState(defaultTargetWords || 1000)
  const [open, setOpen] = useState(false)

  const handleContinue = async () => {
    if (!currentChapter) {
      toast.error('请先选择章节')
      return
    }

    if (!currentChapter.content || currentChapter.content.trim().length < 100) {
      toast.error('章节内容太少，无法续写')
      return
    }

    setProgress('')

    try {
      await continueWriting(
        {
          projectId: currentChapter.projectId,
          chapterId: currentChapter.id,
          currentContent: currentChapter.content,
          targetWords,
        },
        (chunk) => {
          setProgress((prev) => prev + chunk)
          onContentGenerated?.(chunk)
        }
      )

      toast.success(`AI 续写完成（${targetWords} 字）`)
      setProgress('')
      setOpen(false)
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error('AI 续写失败')
      }
      setProgress('')
    }
  }

  const handleCancel = () => {
    cancelGeneration()
    setProgress('')
    toast.info('已取消 AI 续写')
  }

  const preview = progress.slice(-30)

  return (
    <Popover open={open} onOpenChange={(v) => { if (!isContinuing) setOpen(v) }}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          disabled={!currentChapter || isContinuing}
        >
          {isContinuing ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              {preview || '生成中...'}
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-3.5 w-3.5" />
              AI 续写
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">续写字数</label>
            <Input
              type="number"
              min={200}
              max={10000}
              step={100}
              value={targetWords}
              onChange={(e) => setTargetWords(Number(e.target.value) || 1000)}
              disabled={isContinuing}
            />
          </div>
          {isContinuing ? (
            <Button size="sm" variant="outline" className="w-full" onClick={handleCancel}>
              <X className="mr-2 h-3.5 w-3.5" />
              取消续写
            </Button>
          ) : (
            <Button size="sm" className="w-full" onClick={handleContinue}>
              <Wand2 className="mr-2 h-3.5 w-3.5" />
              开始续写
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
