import { NextRequest } from 'next/server'
import { getAIProviderAsync } from '@/lib/ai/providers'
import { PromptTemplateManager } from '@/lib/ai/prompts/template-manager'
import { getContextManager } from '@/lib/ai/context-manager'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, ApiErrors, withErrorHandler } from '@/lib/api/response'
import { validateRequest } from '@/lib/api/validators'
import { z } from 'zod'

/**
 * AI 生成世界观元素 API
 * POST /api/ai/generate/world-element
 */

const GenerateWorldElementSchema = z.object({
  projectId: z.string().min(1, '项目ID不能为空'),
  elementType: z.string().min(1, '设定类型不能为空'),
  storyContext: z.string().optional(),
  requirements: z.string().optional(),
  model: z.string().optional(),
})

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    // 1. 验证请求数据
    const data = validateRequest(GenerateWorldElementSchema, await request.json())

    const { projectId, elementType, storyContext, requirements, model } = data

    // 2. 检查项目是否存在并加载完整上下文数据
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

    // 3. 构建上下文
    const promptManager = new PromptTemplateManager()
    const ai = await getAIProviderAsync(data.model)
    const contextManager = getContextManager()

    // 使用 ContextManager 构建完整的项目上下文
    const chapterCount = project.chapters.length
    const contextPackage = contextManager.buildContext({
      currentChapter: chapterCount || 1,
      allChapters: project.chapters as any,
      characters: project.characters as any,
      worldElements: project.worldElements as any,
      foreshadowings: project.foreshadowings as any,
      genre: project.genre,
    })

    const systemPrompt = contextManager.formatContextForPrompt(contextPackage)

    // 用户自定义上下文作为补充
    const storyContextStr = storyContext
      ? `${systemPrompt}\n\n## 用户额外要求\n${storyContext}`
      : systemPrompt

    // 4. 生成世界观元素
    const prompt = promptManager.render('world-element', {
      elementType,
      storyContext: storyContextStr,
      genre: project.genre,
      requirements: requirements || '无特殊要求',
    })

    const startTime = Date.now()
    const result = await ai.generate({
      type: 'world',
      model,
      prompt,
      temperature: 0.8,
    })
    const duration = Date.now() - startTime

    if (result.status === 'error' || !result.output) {
      return ApiErrors.aiGenerationFailed('世界观元素生成失败')
    }

    // 5. 解析 AI 输出（提取 JSON）
    let elementData: any
    try {
      const jsonMatch = result.output.match(/```json\n([\s\S]*?)\n```/) ||
        result.output.match(/\{[\s\S]*\}/)

      if (jsonMatch) {
        elementData = JSON.parse(jsonMatch[1] || jsonMatch[0])
      } else {
        // 如果没有找到 JSON，尝试解析整个输出
        elementData = JSON.parse(result.output)
      }
    } catch (error) {
      console.error('Failed to parse world element JSON:', error)
      return ApiErrors.aiGenerationFailed('AI 返回格式错误，请重试')
    }

    // 6. 保存世界观元素到数据库
    const worldElement = await prisma.worldElement.create({
      data: {
        projectId,
        type: elementType as any,
        name: elementData.name || '未命名',
        description: elementData.description || null,
        attributes: elementData.attributes ? JSON.stringify(elementData.attributes) : null,
        // 将 rules 合并到 attributes 中
        ...(elementData.rules && {
          attributes: JSON.stringify({
            ...(elementData.attributes || {}),
            rules: elementData.rules,
          }),
        }),
      },
    })

    // 7. 记录生成历史
    try {
      await prisma.generation.create({
        data: {
          projectId,
          type: 'world',
          provider: ai.name,
          model: model || ai.model,
          prompt,
          output: result.output,
          status: 'success',
          tokensUsed: result.tokensUsed ? JSON.stringify(result.tokensUsed) : null,
          cost: result.cost,
          duration,
        },
      })
    } catch (error) {
      console.error('Failed to record generation:', error)
    }

    // 8. 返回结果
    return apiSuccess({
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
      generationId: result.output,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      duration,
    }, 201)
  })
}
