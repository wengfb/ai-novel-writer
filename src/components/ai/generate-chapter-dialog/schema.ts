import { z } from 'zod'

export const generateChapterSchema = z.object({
  chapterNumber: z.number().int().positive('章节号必须是正整数'),
  chapterTitle: z.string().max(200, '章节标题最多200个字符').optional(),
  chapterOutline: z.string().optional(),
  targetWords: z.number().int().positive('目标字数必须是正整数'),
  model: z.string().optional(),
  emotionalGoal: z.string().optional(),
  plotFunction: z.enum(['推进', '转折', '铺垫', '高潮', '过渡']).optional(),
  tensionLevel: z.number().int().min(1).max(10).optional(),
})

export type GenerateChapterFormValues = z.infer<typeof generateChapterSchema>
