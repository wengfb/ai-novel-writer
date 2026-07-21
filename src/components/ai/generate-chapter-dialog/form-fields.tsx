'use client'

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { UseFormReturn } from 'react-hook-form'
import type { GenerateChapterFormValues } from './schema'

interface GenerateChapterFormFieldsProps {
  form: UseFormReturn<GenerateChapterFormValues>
  disabled: boolean
}

/** 章节生成表单字段 */
export function GenerateChapterFormFields({ form, disabled }: GenerateChapterFormFieldsProps) {
  return (
    <>
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
                  disabled={disabled}
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
                  disabled={disabled}
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
              <Input placeholder="例如：迷雾中的初遇" disabled={disabled} {...field} />
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
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="rounded-md border bg-muted/30 p-3 space-y-3">
        <p className="text-xs font-medium text-muted-foreground">
          创作意图（从大纲自动填充，可手动修改）
        </p>

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
                    disabled={disabled}
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
                    disabled={disabled}
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
                  disabled={disabled}
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
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
