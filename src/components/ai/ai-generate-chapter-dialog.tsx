'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Loader2, X } from 'lucide-react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAIStore } from '@/lib/store/ai-store'
import { type Chapter, useChapterStore } from '@/lib/store/chapter-store'
import type { Outline } from '@/lib/store/outline-store'
import { toast } from 'sonner'

const generateChapterSchema = z.object({
  chapterNumber: z.number().int().positive('章节号必须是正整数'),
  chapterTitle: z.string().max(200, '章节标题最多200个字符').optional(),
  chapterOutline: z.string().optional(),
  targetWords: z.number().int().positive('目标字数必须是正整数'),
  model: z.string().optional(),
})

type GenerateChapterFormValues = z.infer<typeof generateChapterSchema>

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
  const { generateChapter, isGeneratingChapter, chapterProgress, cancelGeneration } = useAIStore()
  const { fetchChapters, setCurrentChapter } = useChapterStore()
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const nextChapterNumber = React.useMemo(
    () => Math.max(0, ...chapters.map((chapter) => chapter.chapterNumber)) + 1,
    [chapters]
  )
  const latestProgress = React.useMemo(() => {
    const progressItems = chapterProgress.split('\n').filter(Boolean)
    return progressItems.at(-1) || '正在生成章节...'
  }, [chapterProgress])

  const form = useForm<GenerateChapterFormValues>({
    resolver: zodResolver(generateChapterSchema),
    defaultValues: {
      chapterNumber: nextChapterNumber,
      chapterTitle: '',
      chapterOutline: '',
      targetWords: 3000,
      model: '',
    },
  })

  // 根据大纲数据自动填充标题和大纲
  const getOutlineData = React.useCallback(
    (chapterNum: number) => {
      const matched = flatOutlines.find(
        (o) => o.type === 'chapter' && o.order === chapterNum
      )
      return {
        title: matched?.title || '',
        outline: matched?.description || '',
      }
    },
    [flatOutlines]
  )

  React.useEffect(() => {
    if (open) {
      setSubmitError(null)
      const { title, outline } = getOutlineData(nextChapterNumber)
      form.reset({
        chapterNumber: nextChapterNumber,
        chapterTitle: title,
        chapterOutline: outline,
        targetWords: 3000,
        model: '',
      })
    }
  }, [form, nextChapterNumber, open, getOutlineData])

  // 监听章节号变化，同步更新标题和大纲
  const watchedChapterNumber = form.watch('chapterNumber')
  React.useEffect(() => {
    const { title, outline } = getOutlineData(watchedChapterNumber)
    form.setValue('chapterTitle', title)
    form.setValue('chapterOutline', outline)
  }, [watchedChapterNumber, getOutlineData, form])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isGeneratingChapter) {
      cancelGeneration()
    }
    onOpenChange(nextOpen)
  }

  const onSubmit = async (values: GenerateChapterFormValues) => {
    if (!projectId) {
      toast.error('请先选择项目')
      return
    }

    setSubmitError(null)

    try {
      const result = await generateChapter(
        {
          projectId,
          chapterNumber: values.chapterNumber,
          chapterTitle: values.chapterTitle || undefined,
          chapterOutline: values.chapterOutline || undefined,
          targetWords: values.targetWords,
          model: values.model?.trim() || undefined,
        },
        () => {}
      )

      await fetchChapters(projectId)
      const createdChapter = useChapterStore
        .getState()
        .chapters.find((chapter) => chapter.id === result.chapterId)

      if (createdChapter) {
        setCurrentChapter(createdChapter)
      }

      toast.success('章节生成成功')
      onOpenChange(false)
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>AI 生成章节</DialogTitle>
          <DialogDescription>
            根据当前项目的角色、世界观和前文上下文生成一个新章节。
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="chapterNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>章节号</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        disabled={isGeneratingChapter}
                        value={field.value}
                        onChange={(event) => field.onChange(event.target.valueAsNumber)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetWords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>目标字数</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        disabled={isGeneratingChapter}
                        value={field.value}
                        onChange={(event) => field.onChange(event.target.valueAsNumber)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="chapterTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>章节标题</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：迷雾中的初遇" disabled={isGeneratingChapter} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="chapterOutline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>章节大纲</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="描述这一章的主要剧情、出场角色、冲突和结尾钩子..."
                      className="min-h-32 resize-none"
                      disabled={isGeneratingChapter}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>模型（可选）</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="留空使用默认模型，例如 gemini-2.5-flash"
                      disabled={isGeneratingChapter}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isGeneratingChapter && (
              <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{latestProgress}</span>
                </div>
              </div>
            )}

            {submitError && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              {isGeneratingChapter ? (
                <Button type="button" variant="outline" onClick={cancelGeneration}>
                  <X className="mr-2 h-4 w-4" />
                  取消生成
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
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
      </DialogContent>
    </Dialog>
  )
}
