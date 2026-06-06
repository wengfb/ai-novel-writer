import { NextRequest } from 'next/server'
import { z } from 'zod'
import { apiSuccess, withErrorHandler, ApiErrors } from '@/lib/api/response'
import { parseJsonBody } from '@/lib/api/validators'
import { StoryIdeaCardSchema } from '@/lib/api/schemas'
import { calculateChapterCount } from '@/lib/ai/onboarding-bootstrap'
import { buildArchitecturePrompt } from '@/lib/ai/onboarding/prompts'
import { generateArchitecture } from '@/lib/ai/onboarding/generators'
import { appendFeedbackInstruction } from '@/lib/ai/onboarding/feedback'

const RequestSchema = z.object({
  idea: StoryIdeaCardSchema,
  targetWords: z.number().int().min(200000).default(1000000),
  pace: z.enum(['fast', 'medium', 'slow']).default('medium'),
  audience: z.string().optional(),
  tone: z.string().optional(),
  pov: z.string().optional(),
  model: z.string().optional(),
  previousOutput: z.any().optional(),
  feedback: z.string().optional(),
})

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const body = await parseJsonBody<unknown>(request)
    const data = RequestSchema.parse(body)

    const calc = calculateChapterCount(data.targetWords, data.pace)

    let prompt = buildArchitecturePrompt(data.idea, {
      projectTitle: 'temp',
      idea: data.idea,
      targetWords: data.targetWords,
      pace: data.pace,
      audience: data.audience,
      tone: data.tone,
      pov: data.pov as any,
      model: data.model,
    }, calc)

    // 反馈迭代模式
    if (data.previousOutput && data.feedback) {
      prompt = appendFeedbackInstruction(prompt, data.previousOutput, data.feedback)
    }

    const result = await generateArchitecture(prompt, data.model)

    return apiSuccess({
      architecture: result.architecture,
      chapterCalculation: calc,
      provider: result.provider,
      model: result.modelUsed,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      duration: result.duration,
    })
  })
}
