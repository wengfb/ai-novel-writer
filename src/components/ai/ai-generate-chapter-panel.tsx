'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Loader2, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { useAIStore } from '@/lib/store/ai-store'
import { type Chapter, useChapterStore } from '@/lib/store/chapter-store'
import type { Outline } from '@/lib/store/outline-store'
import { toast } from 'sonner'
import {
  generateChapterSchema,
  type GenerateChapterFormValues,
} from './generate-chapter-dialog/schema'
import { GenerateChapterFormFields } from './generate-chapter-dialog/form-fields'

interface AIGenerateChapterPanelProps {
  projectId: string
  chapters: Chapter[]
  flatOutlines?: Outline[]
  onClose?: () => void
}

/** AI 生成章节 — 编辑器上方可折叠面板 */
export function AIGenerateChapterPanel({
  projectId,
  chapters,
  flatOutlines = [],
  onClose,
}: AIGenerateChapterPanelProps) {
  const { generateChapter, isGeneratingChapter } = useAIStore()
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const nextChapterNumber = React.useMemo(
    () => Math.max(0, ...chapters.map((chapter) => chapter.chapterNumber)) + 1,
    [chapters]
  )

  const form = useForm<GenerateChapterFormValues>({
    resolver: zodResolver(generateChapterSchema),
    defaultValues: {
      chapterNumber: nextChapterNumber,
      chapterTitle: '',
      chapterOutline: '',
      targetWords: 3000,
      model: '',
      emotionalGoal: '',
      plotFunction: undefined,
      tensionLevel: 5,
    },
  })

  const getOutlineData = React.useCallback(
    (chapterNum: number) => {
      const matched = flatOutlines.find((o) => o.type === 'chapter' && o.order === chapterNum)
      return {
        title: matched?.title || '',
        outline: matched?.description || '',
        targetWords: matched?.targetWords || 3000,
        emotionalGoal: matched?.emotionalGoal || '',
        plotFunction: matched?.plotFunction || undefined,
        tensionLevel: matched?.tensionLevel ?? 5,
      }
    },
    [flatOutlines]
  )

  React.useEffect(() => {
    setSubmitError(null)
    const { title, outline, targetWords, emotionalGoal, plotFunction, tensionLevel } =
      getOutlineData(nextChapterNumber)
    form.reset({
      chapterNumber: nextChapterNumber,
      chapterTitle: title,
      chapterOutline: outline,
      targetWords,
      model: '',
      emotionalGoal,
      plotFunction,
      tensionLevel,
    })
  }, [form, nextChapterNumber, getOutlineData])

  const watchedChapterNumber = form.watch('chapterNumber')
  React.useEffect(() => {
    const { title, outline, targetWords, emotionalGoal, plotFunction, tensionLevel } =
      getOutlineData(watchedChapterNumber)
    form.setValue('chapterTitle', title)
    form.setValue('chapterOutline', outline)
    form.setValue('targetWords', targetWords)
    form.setValue('emotionalGoal', emotionalGoal)
    form.setValue('plotFunction', plotFunction)
    form.setValue('tensionLevel', tensionLevel)
  }, [watchedChapterNumber, getOutlineData, form])

  const onSubmit = async (values: GenerateChapterFormValues) => {
    setSubmitError(null)
    onClose?.()

    try {
      await generateChapter({
        projectId,
        chapterNumber: values.chapterNumber,
        chapterTitle: values.chapterTitle || undefined,
        chapterOutline: values.chapterOutline || undefined,
        targetWords: values.targetWords,
        model: values.model?.trim() || undefined,
        emotionalGoal: values.emotionalGoal || undefined,
        plotFunction: values.plotFunction,
        tensionLevel: values.tensionLevel,
      })

      const chapterStore = useChapterStore.getState()
      await chapterStore.fetchChapters(projectId, true)
      toast.success('章节生成成功')
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.info('已取消章节生成')
        return
      }
      const message = error instanceof Error ? error.message : '章节生成失败，请重试'
      setSubmitError(message)
      toast.error(message)
    }
  }

  return (
    <div className="border-b bg-muted/20">
      <div className="mx-auto max-w-3xl px-6 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <div>
              <h2 className="text-sm font-semibold">AI 生成章节</h2>
              <p className="text-xs text-muted-foreground">
                根据角色、世界观和前文上下文生成新章节
              </p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <GenerateChapterFormFields form={form} disabled={isGeneratingChapter} />

            {submitError && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3">
              {onClose && (
                <Button type="button" variant="outline" onClick={onClose}>
                  取消
                </Button>
              )}
              <Button type="submit" disabled={isGeneratingChapter || !projectId}>
                {isGeneratingChapter && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isGeneratingChapter ? '生成中...' : '开始生成'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
