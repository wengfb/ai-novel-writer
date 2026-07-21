import { NextRequest } from 'next/server'
import { getAIProviderAsync } from '@/lib/ai/providers'
import { getContextManager } from '@/lib/ai/context-manager'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, ApiErrors, withErrorHandler } from '@/lib/api/response'
import { validateRequest } from '@/lib/api/validators'
import { z } from 'zod'
import { runAgent } from '@/lib/ai/agents'

/**
 * AI 生成世界观元素 API
 * POST /api/ai/generate/world-element
 * 使用 world-builder Agent
 */

const GenerateWorldElementSchema = z.object({
  projectId: z.string().min(1, '项目ID不能为空'),
  elementType: z.string().min(1, '设定类型不能为空'),
  storyContext: z.string().optional(),
  requirements: z.string().optional(),
  model: z.string().optional(),
})

function extractJsonObject(output: string): any {
  const jsonMatch =
    output.match(/```json\n([\s\S]*?)\n```/) || output.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1] || jsonMatch[0])
  }
  return JSON.parse(output)
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const data = validateRequest(GenerateWorldElementSchema, await request.json())
    const { projectId, elementType, storyContext, requirements, model } = data

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        worldElements: true,
        characters: true,
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

    const startTime = Date.now()
    let agentResult
    try {
      agentResult = await runAgent({
        agentId: 'world-builder',
        model,
        temperature: 0.75,
        contextAppend: systemContext,
        variables: {
          elementType,
          storyContext: storyContextStr,
          genre: project.genre,
          requirements: requirements || '无特殊要求',
        },
      })
    } catch (error) {
      console.error('world-builder failed:', error)
      return ApiErrors.aiGenerationFailed('世界观元素生成失败')
    }
    const duration = Date.now() - startTime

    if (!agentResult.text?.trim()) {
      return ApiErrors.aiGenerationFailed('世界观元素生成失败')
    }

    let elementData: any
    try {
      elementData = extractJsonObject(agentResult.text)
    } catch (error) {
      console.error('Failed to parse world element JSON:', error)
      return ApiErrors.aiGenerationFailed('AI 返回格式错误，请重试')
    }

    const worldElement = await prisma.worldElement.create({
      data: {
        projectId,
        type: elementType as any,
        name: elementData.name || '未命名',
        description: elementData.description || null,
        attributes: elementData.attributes
          ? JSON.stringify(
              elementData.rules
                ? { ...elementData.attributes, rules: elementData.rules }
                : elementData.attributes
            )
          : elementData.rules
            ? JSON.stringify({ rules: elementData.rules })
            : null,
      },
    })

    try {
      await prisma.generation.create({
        data: {
          projectId,
          type: 'world',
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
        element: {
          id: worldElement.id,
          projectId: worldElement.projectId,
          type: worldElement.type,
          name: worldElement.name,
          description: worldElement.description,
          attributes: worldElement.attributes,
          relatedTo: worldElement.relatedTo,
          references: worldElement.references,
          createdAt: worldElement.createdAt,
          updatedAt: worldElement.updatedAt,
        },
        generationId: agentResult.text,
        duration,
      },
      201
    )
  })
}
