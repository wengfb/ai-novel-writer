import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getGeminiProvider } from '@/lib/ai/providers/gemini'
import { PromptTemplateManager } from '@/lib/ai/prompts/template-manager'
import { apiSuccess, withErrorHandler, ApiErrors } from '@/lib/api/response'
import { parseJsonBody, validateRequest } from '@/lib/api/validators'
import { GenerateOutlineSchema } from '@/lib/api/schemas'

/**
 * POST /api/ai/generate/outline
 * AI 生成大纲
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    // 解析并验证请求体
    const body = await parseJsonBody(request)
    const data = validateRequest(GenerateOutlineSchema, body)

    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    })

    if (!project) {
      return ApiErrors.projectNotFound()
    }

    const gemini = getGeminiProvider()
    const promptManager = new PromptTemplateManager()

    // 构建提示词
    const prompt = promptManager.render('outline-generation', {
      genre: data.genre,
      coreIdea: data.coreIdea,
      style: data.style || '标准叙事',
      targetWords: data.targetWords,
      chapterCount: data.chapterCount,
    })

    // 生成大纲
    const startTime = Date.now()
    const result = await gemini.generate({
      type: 'outline',
      model: data.model,
      prompt,
      temperature: 0.7,
      maxTokens: 8000,
    })

    const duration = Date.now() - startTime

    // 解析JSON结果
    let outlineData: any
    try {
      const jsonMatch = result.output.match(/```json\n([\s\S]*?)\n```/) ||
        result.output.match(/\{[\s\S]*\}/)

      if (jsonMatch) {
        outlineData = JSON.parse(jsonMatch[1] || jsonMatch[0])
      } else {
        throw new Error('无法解析AI返回的大纲JSON')
      }
    } catch (error) {
      console.error('Failed to parse outline JSON:', error)
      return ApiErrors.aiGenerationFailed('大纲生成失败，无法解析AI返回结果')
    }

    // 保存角色到数据库
    const characterPromises = (outlineData.characters || []).map((char: any) => {
      return prisma.character.create({
        data: {
          projectId: data.projectId,
          name: char.name,
          personality: char.personality,
          backstory: char.description,
          motivation: char.goal,
        },
      })
    })

    // 保存世界观元素到数据库
    const worldElementPromises = (outlineData.worldSettings || []).map((element: any) => {
      return prisma.worldElement.create({
        data: {
          projectId: data.projectId,
          type: element.type === '地理' ? 'location' : 'other',
          name: element.name,
          description: element.description,
        },
      })
    })

    await Promise.all([...characterPromises, ...worldElementPromises])

    // 保存大纲节点（简化处理，只保存章节级大纲）
    const outlinePromises = (outlineData.chapters || []).map((chapter: any) => {
      return prisma.outline.create({
        data: {
          projectId: data.projectId,
          type: 'chapter',
          order: chapter.chapterNumber,
          title: chapter.title,
          description: chapter.summary,
          targetWords: chapter.estimatedWords,
          status: 'planned',
        },
      })
    })

    await Promise.all(outlinePromises)

    // 记录生成历史
    await prisma.generation.create({
      data: {
        projectId: data.projectId,
        type: 'outline',
        provider: 'google',
        model: data.model,
        prompt,
        output: result.output,
        tokensUsed: JSON.stringify(result.tokensUsed),
        cost: result.cost,
        duration,
        status: result.status,
      },
    })

    return apiSuccess({
      outline: outlineData,
      generationId: result.tokensUsed ? 'generated' : undefined,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      duration,
    })
  })
}
