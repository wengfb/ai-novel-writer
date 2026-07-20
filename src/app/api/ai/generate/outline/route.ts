import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { PromptTemplateManager } from '@/lib/ai/prompts/template-manager'
import { getContextManager } from '@/lib/ai/context-manager'
import { apiSuccess, withErrorHandler, ApiErrors } from '@/lib/api/response'
import { parseJsonBody, validateRequest } from '@/lib/api/validators'
import { GenerateOutlineSchema } from '@/lib/api/schemas'
import type { Chapter, Character, Foreshadowing, WorldElement } from '@/types'
import { generateOutlineFromPrompt } from '@/lib/ai/shared/outline-generator'
import { normalizePlotFunction, normalizeTensionLevel } from '@/lib/ai/onboarding/normalize'

/**
 * POST /api/ai/generate/outline
 * AI 生成大纲
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const body = await parseJsonBody<unknown>(request)
    const data = validateRequest(GenerateOutlineSchema, body)

    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      include: {
        characters: true,
        worldElements: true,
        foreshadowings: true,
        chapters: { orderBy: { chapterNumber: 'asc' } },
      },
    })

    if (!project) {
      return ApiErrors.projectNotFound()
    }

    const promptManager = new PromptTemplateManager()
    const totalWords = data.targetWords * data.chapterCount
    const prompt = promptManager.render('outline-generation', {
      genre: data.genre,
      coreIdea: data.coreIdea,
      style: data.style || '标准叙事',
      pov: project.pov === 'first_person' ? '第一人称' : project.pov === 'third_person' ? '第三人称' : '多视角切换',
      targetWords: data.targetWords,
      chapterCount: data.chapterCount,
      totalWords,
    })

    const contextManager = getContextManager()
    const chapterCount = project.chapters.length
    const contextPackage = contextManager.buildContext({
      currentChapter: chapterCount || 1,
      allChapters: project.chapters as unknown as Chapter[],
      characters: project.characters as unknown as Character[],
      worldElements: project.worldElements as unknown as WorldElement[],
      foreshadowings: project.foreshadowings as unknown as Foreshadowing[],
      genre: project.genre,
      projectId: data.projectId,
    })
    const systemPrompt = contextManager.formatContextForPrompt(contextPackage)

    let generated
    try {
      generated = await generateOutlineFromPrompt({
        prompt,
        model: data.model,
        systemPrompt,
      })
    } catch (error) {
      console.error('Failed to generate outline:', error)
      return ApiErrors.aiGenerationFailed('大纲生成失败，无法解析AI返回结果')
    }

    const outlineData = generated.outline

    const characterPromises = outlineData.characters.map((char) => {
      return prisma.character.create({
        data: {
          projectId: data.projectId,
          name: char.name,
          personality: Array.isArray(char.personality) ? char.personality.join('、') : char.personality,
          backstory: char.description,
          motivation: char.goal,
        },
      })
    })

    const worldElementPromises = outlineData.worldSettings.map((element) => {
      return prisma.worldElement.create({
        data: {
          projectId: data.projectId,
          type: element.type === '地理' ? 'location' : 'other',
          name: element.name,
          description: element.description || '待补充设定描述',
        },
      })
    })

    await Promise.all([...characterPromises, ...worldElementPromises])

    const outlinePromises = outlineData.chapters.map((chapter, index) => {
      return prisma.outline.create({
        data: {
          projectId: data.projectId,
          type: 'chapter',
          order: chapter.chapterNumber || index + 1,
          title: chapter.title || `第${chapter.chapterNumber || index + 1}章`,
          description: chapter.summary,
          targetWords: chapter.estimatedWords,
          status: 'planned',
          emotionalGoal: chapter.emotionalGoal || null,
          plotFunction: normalizePlotFunction(chapter.plotFunction),
          tensionLevel: normalizeTensionLevel(chapter.tensionLevel),
        },
      })
    })

    await Promise.all(outlinePromises)

    await prisma.generation.create({
      data: {
        projectId: data.projectId,
        type: 'outline',
        provider: generated.provider,
        model: generated.model,
        prompt,
        output: generated.rawOutput,
        tokensUsed: generated.tokensUsed ? JSON.stringify(generated.tokensUsed) : null,
        cost: generated.cost,
        duration: generated.duration,
        status: 'success',
      },
    })

    return apiSuccess({
      outline: outlineData,
      suggestedTotalWords: outlineData.suggestedTotalWords || totalWords || undefined,
      wordCountRationale: outlineData.wordCountRationale || '',
      generationId: generated.tokensUsed ? 'generated' : undefined,
      tokensUsed: generated.tokensUsed,
      cost: generated.cost,
      duration: generated.duration,
    })
  })
}
