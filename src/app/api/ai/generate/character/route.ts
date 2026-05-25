import { NextRequest } from 'next/server'
import { getAIProviderAsync } from '@/lib/ai/providers'
import { PromptTemplateManager } from '@/lib/ai/prompts/template-manager'
import { getContextManager } from '@/lib/ai/context-manager'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, ApiErrors, withErrorHandler } from '@/lib/api/response'
import { validateRequest } from '@/lib/api/validators'
import { z } from 'zod'

/**
 * AI 生成角色 API
 * POST /api/ai/generate/character
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
    // 1. 验证请求数据
    const data = validateRequest(GenerateCharacterSchema, await request.json())

    const { projectId, role, storyContext, requirements, model } = data

    // 2. 检查项目是否存在并加载完整上下文数据
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

    // 4. 生成角色
    const prompt = promptManager.render('character-generation', {
      role,
      storyContext: storyContextStr,
      requirements: requirements || '无特殊要求',
    })

    const startTime = Date.now()
    const result = await ai.generate({
      type: 'character',
      model,
      prompt,
      temperature: 0.8,
    })
    const duration = Date.now() - startTime

    if (result.status === 'error' || !result.output) {
      return ApiErrors.aiGenerationFailed('角色生成失败')
    }

    // 5. 解析 AI 输出（提取 JSON）
    let characterData: any
    try {
      const jsonMatch = result.output.match(/```json\n([\s\S]*?)\n```/) ||
        result.output.match(/\{[\s\S]*\}/)

      if (jsonMatch) {
        characterData = JSON.parse(jsonMatch[1] || jsonMatch[0])
      } else {
        // 如果没有找到 JSON，尝试解析整个输出
        characterData = JSON.parse(result.output)
      }
    } catch (error) {
      console.error('Failed to parse character JSON:', error)
      return ApiErrors.aiGenerationFailed('AI 返回格式错误，请重试')
    }

    // 6. 保存角色到数据库
    // 提取 age 字段的数字（如果 AI 返回的是字符串）
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

    // 7. 记录生成历史
    try {
      await prisma.generation.create({
        data: {
          projectId,
          type: 'character',
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
      generationId: result.output,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      duration,
    }, 201)
  })
}
