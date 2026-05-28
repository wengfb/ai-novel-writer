'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Loader2 } from 'lucide-react'
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
  emotionalGoal: z.string().optional(),
  plotFunction: z.enum(['推进', '转折', '铺垫', '高潮', '过渡']).optional(),
  tensionLevel: z.number().int().min(1).max(10).optional(),
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

  // 根据大纲数据自动填充标题、大纲和建议字数
  const getOutlineData = React.useCallback(
    (chapterNum: number) => {
      const matched = flatOutlines.find(
        (o) => o.type === 'chapter' && o.order === chapterNum
      )
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
      const { title, outline, targetWords, emotionalGoal, plotFunction, tensionLevel } = getOutlineData(nextChapterNumber)
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

  // 监听章节号变化，同步更新标题、大纲和建议字数
  const watchedChapterNumber = form.watch('chapterNumber')
  React.useEffect(() => {
    const { title, outline, targetWords, emotionalGoal, plotFunction, tensionLevel } = getOutlineData(watchedChapterNumber)
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

    // 立即关闭对话框
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

      // 生成完成后强制刷新章节列表以获取服务端最终数据
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

            {/* 创作意图（从大纲自动填充） */}
            <div className="rounded-md border bg-muted/30 p-3 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">创作意图（从大纲自动填充，可手动修改）</p>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="plotFunction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">情节功能</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isGeneratingChapter}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value || undefined)}
                        >
                          <option value="">不限</option>
                          <option value="推进">推进 — 推动主线剧情发展</option>
                          <option value="转折">转折 — 改变故事发展方向</option>
                          <option value="铺垫">铺垫 — 为后续情节埋下伏笔</option>
                          <option value="高潮">高潮 — 矛盾冲突的爆发点</option>
                          <option value="过渡">过渡 — 连接不同剧情段落</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tensionLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">张力等级 (1-10)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          disabled={isGeneratingChapter}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const v = e.target.valueAsNumber
                            field.onChange(isNaN(v) ? undefined : Math.min(10, Math.max(1, v)))
                          }}
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
                name="emotionalGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">情感目标</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="如：让读者感到紧张、温暖、悲伤..."
                        disabled={isGeneratingChapter}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
