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
    // 解析请求体
    const body = await parseJsonBody(request) as any

    // 支持两种调用方式：
    // 1. Onboarding 方式：{ projectId: "temp", prompt: "..." }
    // 2. 标准方式：{ projectId, genre, coreIdea, ... }
    const isOnboarding = body.projectId === 'temp' && body.prompt

    let data: any
    let prompt: string

    if (isOnboarding) {
      // Onboarding 模式：直接使用提供的 prompt
      data = {
        projectId: 'temp',
        model: body.model || 'gemini-3-flash',
      }
      prompt = body.prompt
    } else {
      // 标准模式：验证参数并构建 prompt
      data = validateRequest(GenerateOutlineSchema, body)

      // 检查项目是否存在
      const project = await prisma.project.findUnique({
        where: { id: data.projectId },
      })

      if (!project) {
        return ApiErrors.projectNotFound()
      }

      const promptManager = new PromptTemplateManager()
      prompt = promptManager.render('outline-generation', {
        genre: data.genre,
        coreIdea: data.coreIdea,
        style: data.style || '标准叙事',
        targetWords: data.targetWords,
        chapterCount: data.chapterCount,
      })
    }

    const gemini = getGeminiProvider()

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
      console.log('AI 返回的原始内容（前 500 字符）:', result.output.slice(0, 500))

      const jsonMatch = result.output.match(/```json\n([\s\S]*?)\n```/) ||
        result.output.match(/\{[\s\S]*\}/)

      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0]
        console.log('提取的 JSON 字符串（前 500 字符）:', jsonStr.slice(0, 500))
        outlineData = JSON.parse(jsonStr)
      } else {
        console.error('未找到 JSON 匹配')
        throw new Error('无法解析AI返回的大纲JSON')
      }
    } catch (error) {
      console.error('Failed to parse outline JSON:', error)
      console.error('完整的 AI 输出:', result.output)
      return ApiErrors.aiGenerationFailed('大纲生成失败，无法解析AI返回结果')
    }

    // 只在非 Onboarding 模式下保存到数据库
    if (!isOnboarding) {
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
    }

    return apiSuccess({
      outline: outlineData,
      generationId: result.tokensUsed ? 'generated' : undefined,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      duration,
    })
  })
}
