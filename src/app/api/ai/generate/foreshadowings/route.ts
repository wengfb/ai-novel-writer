import { NextRequest } from 'next/server'
import { z } from 'zod'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { parseJsonBody } from '@/lib/api/validators'
import { buildForeshadowingsPrompt } from '@/lib/ai/onboarding/prompts'
import { generateForeshadowings } from '@/lib/ai/onboarding/generators'
import { appendFeedbackInstruction } from '@/lib/ai/onboarding/feedback'

const RequestSchema = z.object({
  chapters: z.array(z.object({
    chapterNumber: z.number(), title: z.string(), summary: z.string(),
  })),
  characters: z.array(z.object({ name: z.string() })),
  worldSettings: z.array(z.object({ name: z.string() })),
  audience: z.string().optional(),
  pov: z.string().optional(),
  model: z.string().optional(),
  previousOutput: z.any().optional(),
  feedback: z.string().optional(),
})

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const body = await parseJsonBody<unknown>(request)
    const data = RequestSchema.parse(body)

    let prompt = buildForeshadowingsPrompt(
      data.chapters,
      data.characters,
      data.worldSettings,
      { projectTitle: '', idea: {} as any, targetWords: 0, pace: 'medium' as const, audience: data.audience, pov: data.pov as any }
    )

    if (data.previousOutput && data.feedback) {
      prompt = appendFeedbackInstruction(prompt, data.previousOutput, data.feedback)
    }

    const result = await generateForeshadowings(prompt, data.model)

    return apiSuccess({
      foreshadowings: result.foreshadowings,
      provider: result.provider,
      model: result.modelUsed,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      duration: result.duration,
    })
  })
}
