'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

interface AIGenerateChapterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string | null
  chapters: Chapter[]
  flatOutlines?: Outline[]
}

export function AIGenerateChapterDialog({
  open,
  onOpenChange,
  projectId,
  chapters,
  flatOutlines = [],
}: AIGenerateChapterDialogProps) {
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
    if (open) {
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
    }
  }, [form, nextChapterNumber, open, getOutlineData])

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
    if (!projectId) {
      toast.error('请先选择项目')
      return
    }

    setSubmitError(null)
    onOpenChange(false)

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>AI 生成章节</DialogTitle>
          <DialogDescription>
            根据当前项目的角色、世界观和前文上下文生成一个新章节。
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <GenerateChapterFormFields form={form} disabled={isGeneratingChapter} />

            {submitError && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={isGeneratingChapter || !projectId}>
                {isGeneratingChapter && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isGeneratingChapter ? '生成中...' : '开始生成'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
