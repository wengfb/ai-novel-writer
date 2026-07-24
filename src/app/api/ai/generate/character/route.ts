import { NextRequest } from 'next/server'
import { getAIProviderAsync } from '@/lib/ai/providers'
import { getContextManager } from '@/lib/ai/context-manager'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, ApiErrors, withErrorHandler } from '@/lib/api/response'
import { validateRequest } from '@/lib/api/validators'
import { z } from 'zod'
import { runAgentObject } from '@/lib/ai/agents'
import { GeneratedCharacterCardSchema } from '@/lib/ai/agents/schemas'

/**
 * AI 生成角色 API
 * POST /api/ai/generate/character
 * 使用 character agent + 结构化输出
 */

const GenerateCharacterSchema = z.object({
  projectId: z.string().min(1, '项目ID不能为空'),
  role: z.string().min(1, '角色定位不能为空'),
  storyContext: z.string().optional(),
  requirements: z.string().optional(),
  model: z.string().optional(),
})

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const data = validateRequest(GenerateCharacterSchema, await request.json())
    const { projectId, role, storyContext, requirements, model } = data

    const project = await prisma.project.findUnique({
      where: { id: projectId },
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

    const ai = await getAIProviderAsync(data.model)
    const contextManager = getContextManager()
    const chapterCount = project.chapters.length
    const contextPackage = contextManager.buildContext({
      currentChapter: chapterCount || 1,
      allChapters: project.chapters as any,
      characters: project.characters as any,
      worldElements: project.worldElements as any,
      foreshadowings: project.foreshadowings as any,
      genre: project.genre,
      projectId,
    })

    const systemContext = contextManager.formatContextForPrompt(contextPackage)
    const storyContextStr = storyContext
      ? `${systemContext}\n\n## 用户额外要求\n${storyContext}`
      : systemContext

    const povLabel =
      project.pov === 'first_person'
        ? '第一人称'
        : project.pov === 'third_person'
          ? '第三人称'
          : '多视角切换'

    const startTime = Date.now()
    let agentResult
    try {
      agentResult = await runAgentObject({
        agentId: 'character',
        userSlot: 'user.create',
        model,
        temperature: 0.8,
        contextAppend: systemContext,
        schema: GeneratedCharacterCardSchema,
        schemaName: 'CharacterCard',
        variables: {
          role,
          storyContext: storyContextStr,
          pov: povLabel,
          requirements: requirements || '无特殊要求',
        },
      })
    } catch (error) {
      console.error('character agent failed:', error)
      return ApiErrors.aiGenerationFailed('角色生成失败')
    }
    const duration = Date.now() - startTime
    const characterData = agentResult.object

    const extractAge = (age: any): number | null => {
      if (typeof age === 'number') return age
      if (typeof age === 'string') {
        const match = age.match(/\d+/)
        return match ? parseInt(match[0], 10) : null
      }
      return null
    }

    const character = await prisma.character.create({
      data: {
        projectId,
        name: characterData.name || '未命名',
        nickname: characterData.nickname || null,
        age: extractAge(characterData.age),
        gender: characterData.gender || null,
        appearance: characterData.appearance || null,
        personality: characterData.personality
          ? Array.isArray(characterData.personality)
            ? characterData.personality.join('、')
            : characterData.personality
          : null,
        backstory: characterData.backstory || null,
        motivation: characterData.motivation || null,
        dialogueStyle: characterData.dialogueStyle || null,
        characterArc: characterData.characterArc || null,
      },
    })

    try {
      await prisma.generation.create({
        data: {
          projectId,
          type: 'character',
          provider: ai.name,
          model: model || ai.model,
          prompt: agentResult.userPrompt,
          systemPrompt: agentResult.systemPrompt,
          output: agentResult.text,
          status: 'success',
          duration,
        },
      })
    } catch (error) {
      console.error('Failed to record generation:', error)
    }

    return apiSuccess(
      {
        character: {
          id: character.id,
          projectId: character.projectId,
          name: character.name,
          nickname: character.nickname,
          age: character.age,
          gender: character.gender,
          appearance: character.appearance,
          personality: character.personality,
          backstory: character.backstory,
          motivation: character.motivation,
          dialogueStyle: character.dialogueStyle,
          characterArc: character.characterArc,
          avatar: character.avatar,
          createdAt: character.createdAt,
          updatedAt: character.updatedAt,
        },
        generationId: agentResult.text,
        duration,
      },
      201
    )
  })
}
