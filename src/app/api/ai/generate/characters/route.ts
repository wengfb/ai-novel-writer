import { NextRequest } from 'next/server'
import { z } from 'zod'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { parseJsonBody } from '@/lib/api/validators'
import { StoryIdeaCardSchema } from '@/lib/api/schemas'
import { buildCharactersPrompt } from '@/lib/ai/onboarding/prompts'
import { generateCharacters } from '@/lib/ai/onboarding/generators'
import { appendFeedbackInstruction } from '@/lib/ai/onboarding/feedback'

const RequestSchema = z.object({
  idea: StoryIdeaCardSchema,
  architecture: z.object({
    storySummary: z.string(),
    mainConflict: z.string(),
    thematicThread: z.string(),
  }),
  audience: z.string().optional(),
  tone: z.string().optional(),
  model: z.string().optional(),
  previousOutput: z.any().optional(),
  feedback: z.string().optional(),
})

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const body = await parseJsonBody<unknown>(request)
    const data = RequestSchema.parse(body)

    let prompt = buildCharactersPrompt(
      data.idea,
      data.architecture,
      { projectTitle: '', idea: data.idea, targetWords: 0, pace: 'medium' as const, audience: data.audience, tone: data.tone }
    )

    if (data.previousOutput && data.feedback) {
      prompt = appendFeedbackInstruction(prompt, data.previousOutput, data.feedback)
    }

    const result = await generateCharacters(prompt, data.model)

    return apiSuccess({
      characters: result.characters,
      provider: result.provider,
      model: result.modelUsed,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      duration: result.duration,
    })
  })
}
