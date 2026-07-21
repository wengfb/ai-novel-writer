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
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useCurrentProject } from '@/hooks/use-projects'
import { GENRES, GENRE_CHINESE } from './generate-dialog/constants'
import { OutlineGenerateConfigForm } from './generate-dialog/config-form'
import { OutlineGeneratePreview } from './generate-dialog/preview'

interface OutlineGenerateDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
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
  const [generationStats, setGenerationStats] = useState<{
    cost: number
    duration: number
  } | null>(null)

  useEffect(() => {
    if (currentProject?.genre && open) {
      const mapped = GENRE_CHINESE[currentProject.genre] || currentProject.genre
      if (GENRES.includes(mapped as any)) {
        setGenre(mapped)
      }
    }
  }, [currentProject, open])

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
          <OutlineGenerateConfigForm
            genre={genre}
            setGenre={setGenre}
            coreIdea={coreIdea}
            setCoreIdea={setCoreIdea}
            chapterCount={chapterCount}
            setChapterCount={setChapterCount}
            targetWords={targetWords}
            setTargetWords={setTargetWords}
          />
        ) : (
          <OutlineGeneratePreview
            generatedOutline={generatedOutline}
            generationStats={generationStats}
          />
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
