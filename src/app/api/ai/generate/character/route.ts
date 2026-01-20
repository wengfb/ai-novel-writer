import { NextRequest } from 'next/server'
import { getGeminiProvider } from '@/lib/ai/providers/gemini'
import { PromptTemplateManager } from '@/lib/ai/prompts/template-manager'
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
  model: z.enum(['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3-flash', 'gemini-3-pro']).default('gemini-3-flash'),
})

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    // 1. 验证请求数据
    const data = validateRequest(GenerateCharacterSchema, await request.json())

    const { projectId, role, storyContext, requirements, model } = data

    // 2. 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { characters: true },
    })

    if (!project) {
      return ApiErrors.projectNotFound()
    }

    // 3. 构建上下文
    const promptManager = new PromptTemplateManager()
    const gemini = getGeminiProvider()

    // 构建故事上下文
    const context = storyContext || `小说类型：${project.genre}\n简介：${project.description || '暂无'}`

    // 4. 生成角色
    const prompt = promptManager.render('character-generation', {
      role,
      storyContext: context,
      requirements: requirements || '无特殊要求',
    })

    const startTime = Date.now()
    const result = await gemini.generate({
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
          provider: 'google',
          model,
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
