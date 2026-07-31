import { tool, zodSchema } from 'ai'
import { z } from 'zod'
import { StoryIdeaCardSchema } from '@/lib/api/schemas'
import {
  OnboardingArchitectureSchema,
  OnboardingCharactersSchema,
  OnboardingWorldSchema,
  OnboardingChaptersSchema,
  OnboardingForeshadowingsSchema,
} from '@/lib/ai/agents/schemas'

const OnboardingDraftSchema = z.union([
  OnboardingArchitectureSchema,
  OnboardingCharactersSchema,
  OnboardingWorldSchema,
  OnboardingChaptersSchema,
  OnboardingForeshadowingsSchema,
  z.object({ content: z.string().min(1), wordCount: z.number().int().nonnegative() }),
])

const OutlineDraftSchema = z.object({
  type: z.enum(['volume', 'chapter', 'scene']).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(10000).optional(),
  targetWords: z.number().int().positive().optional(),
  emotionalGoal: z.string().max(1000).optional(),
  plotFunction: z.enum(['推进', '转折', '铺垫', '高潮', '过渡']).optional(),
  tensionLevel: z.number().int().min(1).max(10).optional(),
})

/**
 * 只更新页面内存草稿；真正的持久化仍由用户点击保存或创建项目触发。
 */
export function createIdeaDraftTools() {
  return {
    updateIdeaDraft: tool({
      description: '当作者确认了创意卡字段，或当前信息已足够形成草稿时，更新右侧创意卡。只传递已确认内容；未确认字段保留为空字符串。',
      inputSchema: zodSchema(StoryIdeaCardSchema.omit({ id: true })),
      execute: async (draft) => ({ ok: true, draft }),
    }),
  }
}

export function createOnboardingDraftTools() {
  return {
    updateOnboardingDraft: tool({
      description: '当本步骤已有可用的结构化草稿，或作者确认修改时，更新右侧预览。只同步当前步骤数据，不要写数据库。',
      inputSchema: zodSchema(OnboardingDraftSchema),
      execute: async (data) => ({ ok: true, data }),
    }),
  }
}

/** 为新建大纲节点填写本地表单草稿，不会创建或更新数据库记录。 */
export function createOutlineDraftTools() {
  return {
    updateOutlineDraft: tool({
      description: '当信息足够填写当前大纲节点时，更新本地表单草稿。仅传递已确定字段；不要创建或更新数据库记录。',
      inputSchema: zodSchema(OutlineDraftSchema),
      execute: async (draft) => ({ ok: true, draft }),
    }),
  }
}
