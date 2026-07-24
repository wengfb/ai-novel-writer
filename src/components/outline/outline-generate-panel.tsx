'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useCurrentProject } from '@/hooks/use-projects'
import { GENRES, GENRE_CHINESE } from './generate-dialog/constants'
import { OutlineGenerateConfigForm } from './generate-dialog/config-form'
import { OutlineGeneratePreview } from './generate-dialog/preview'
import { DetailWorkspace } from '@/components/studio/detail-workspace'

interface OutlineGeneratePanelProps {
  projectId: string
  onComplete: () => void
  onClose?: () => void
}

/** AI 生成大纲 — 中间区工作页 */
export function OutlineGeneratePanel({
  projectId,
  onComplete,
  onClose,
}: OutlineGeneratePanelProps) {
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
    if (currentProject?.genre) {
      const mapped = GENRE_CHINESE[currentProject.genre] || currentProject.genre
      if (GENRES.includes(mapped as any)) {
        setGenre(mapped)
      }
    }
  }, [currentProject])

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

  return (
    <DetailWorkspace
      title="AI 生成大纲"
      description={
        step === 'config'
          ? '描述故事核心创意，生成结构化章节大纲'
          : '预览已保存的大纲结构，确认后可继续编辑节点'
      }
      icon={Sparkles}
      badges={[step === 'config' ? '配置' : '预览']}
      onBack={onClose}
      actions={
        onClose ? (
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
        ) : null
      }
    >
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

      <div className="mt-6 border-t pt-5">
        {step === 'config' ? (
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || coreIdea.trim().length < 10}
            className="w-full sm:w-auto sm:min-w-[160px]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                正在生成...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                开始生成
              </>
            )}
          </Button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setStep('config')}>
              重新生成
            </Button>
            <Button onClick={onComplete}>完成</Button>
          </div>
        )}
      </div>
    </DetailWorkspace>
  )
}
