'use client'

import { useState } from 'react'
import { useAIStore } from '@/lib/store/ai-store'
import { useChapterStore } from '@/lib/store/chapter-store'
import { Button } from '@/components/ui/button'
import { Wand2, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

interface AIContinueButtonProps {
  onContentGenerated?: (content: string) => void
}

export function AIContinueButton({ onContentGenerated }: AIContinueButtonProps) {
  const { currentChapter } = useChapterStore()
  const { isContinuing, continueWriting, cancelGeneration } = useAIStore()
  const [progress, setProgress] = useState('')

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
          targetWords: 1000,
        },
        (chunk) => {
          setProgress((prev) => prev + chunk)
          onContentGenerated?.(chunk)
        }
      )

      toast.success('AI 续写完成')
      setProgress('')
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

  return (
    <div className="flex items-center gap-2">
      {!isContinuing ? (
        <Button
          onClick={handleContinue}
          size="sm"
          variant="outline"
          disabled={!currentChapter}
        >
          <Wand2 className="h-4 w-4 mr-2" />
          AI 续写
        </Button>
      ) : (
        <>
          <Button size="sm" variant="outline" disabled>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            生成中...
          </Button>
          <Button
            onClick={handleCancel}
            size="sm"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  )
}
