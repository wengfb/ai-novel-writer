'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useProjectStore, type Project } from '@/lib/store/project-store'
import { toast } from 'sonner'

const editProjectSchema = z.object({
  title: z.string().min(1, '请输入项目名称').max(200, '标题最多200个字符'),
  description: z.string().optional(),
  genre: z.string().min(1, '请选择类型'),
  status: z.enum(['draft', 'writing', 'completed']),
})

type EditProjectFormValues = z.infer<typeof editProjectSchema>

interface ProjectEditDialogProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectEditDialog({ project, open, onOpenChange }: ProjectEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { updateProject } = useProjectStore()

  const form = useForm<EditProjectFormValues>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      title: '',
      description: '',
      genre: '玄幻',
      status: 'draft',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        title: project.title,
        description: project.description || '',
        genre: project.genre,
        status: project.status === 'archived' ? 'draft' : project.status,
      })
    }
  }, [open, project, form])

  const onSubmit = async (data: EditProjectFormValues) => {
    setIsSubmitting(true)
    try {
      await updateProject(project.id, data)
      toast.success('项目信息已更新')
      onOpenChange(false)
    } catch {
      toast.error('更新失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>编辑项目信息</DialogTitle>
          <DialogDescription>修改项目的基本信息和创意方向</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>项目名称</FormLabel>
                  <FormControl>
                    <Input placeholder="输入项目名称" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>创意方向 / 故事简介</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="描述你的故事创意、核心冲突、主角设定等..."
                      className="resize-none"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="genre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>类型</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="玄幻">玄幻</SelectItem>
                      <SelectItem value="都市">都市</SelectItem>
                      <SelectItem value="仙侠">仙侠</SelectItem>
                      <SelectItem value="科幻">科幻</SelectItem>
                      <SelectItem value="历史">历史</SelectItem>
                      <SelectItem value="武侠">武侠</SelectItem>
                      <SelectItem value="言情">言情</SelectItem>
                      <SelectItem value="其他">其他</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>状态</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择状态" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">草稿</SelectItem>
                      <SelectItem value="writing">写作中</SelectItem>
                      <SelectItem value="completed">已完成</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '保存中...' : '保存修改'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
