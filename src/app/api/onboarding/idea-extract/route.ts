import { NextRequest } from 'next/server'
import { z } from 'zod'
import { runAgentObject } from '@/lib/ai/agents/runner'
import { StoryIdeaCardSchema } from '@/lib/api/schemas'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { parseJsonBody } from '@/lib/api/validators'

const Schema = z.object({
  conversationText: z.string().trim().min(30, '请先和创意编辑讨论一些故事想法').max(30_000),
  initialPrompt: z.string().trim().max(2_000).optional(),
})

/** 将尚未确认的共创对话整理成单张严格的创意卡，不写入创意库。 */
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const input = Schema.parse(await parseJsonBody<unknown>(request))
    const result = await runAgentObject({
      agentId: 'story-idea',
      systemSlot: 'system.co-create',
      userSlot: 'user',
      userMessage: `请根据以下对话整理一张完整、明确、可进入项目初始化的创意卡。\n\n${input.conversationText}${input.initialPrompt ? `\n\n作者最初的想法：${input.initialPrompt}` : ''}`,
      variables: {},
      schema: StoryIdeaCardSchema.omit({ id: true }),
    })
    return apiSuccess({ idea: { id: `draft-${crypto.randomUUID()}`, ...result.object } })
  })
}
