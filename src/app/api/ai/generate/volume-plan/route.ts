import { NextRequest } from 'next/server'
import { z } from 'zod'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { parseJsonBody } from '@/lib/api/validators'
import { StoryIdeaCardSchema } from '@/lib/api/schemas'
import { calculateChapterCount } from '@/lib/ai/onboarding/normalize'
import { buildChaptersPrompt } from '@/lib/ai/onboarding/prompts'
import { generateChapters } from '@/lib/ai/onboarding/generators'
import { appendFeedbackInstruction } from '@/lib/ai/onboarding/feedback'

const RequestSchema = z.object({
  idea: StoryIdeaCardSchema,
  architecture: z.object({
    storySummary: z.string(),
    actStructure: z.array(z.object({
      act: z.number(), chapterRange: z.tuple([z.number(), z.number()]),
      description: z.string(), emotionalArc: z.string(),
    })),
    volumePlan: z.array(z.object({
      volumeNumber: z.number(), title: z.string(),
      description: z.string(), chapterRange: z.tuple([z.number(), z.number()]),
    })),
    thematicThread: z.string(),
  }),
  characters: z.array(z.object({ name: z.string(), role: z.string() })),
  worldSettings: z.array(z.object({ name: z.string(), type: z.string() })),
  targetWords: z.number().int().default(1000000),
  pace: z.enum(['fast', 'medium', 'slow']).default('medium'),
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

    const calc = calculateChapterCount(data.targetWords, data.pace)

    let prompt = buildChaptersPrompt(
      data.idea,
      data.architecture as any,
      data.characters,
      data.worldSettings,
      { projectTitle: '', idea: data.idea, targetWords: data.targetWords, pace: data.pace, audience: data.audience, pov: data.pov as any },
      calc
    )

    if (data.previousOutput && data.feedback) {
      prompt = appendFeedbackInstruction(prompt, data.previousOutput, data.feedback)
    }

    const result = await generateChapters(prompt, data.model)

    return apiSuccess({
      chapters: result.chapters,
      provider: result.provider,
      model: result.modelUsed,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      duration: result.duration,
    })
  })
}
