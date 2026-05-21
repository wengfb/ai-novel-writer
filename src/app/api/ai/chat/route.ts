import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { streamText, convertToModelMessages } from 'ai'
import { z } from 'zod'
import { validateRequest, Validation_error } from '@/lib/api/validators'
import { ApiErrors } from '@/lib/api/response'
import { getContextManager } from '@/lib/ai/context-manager'
import { buildChatTools } from '@/lib/ai/chat-tools'
import { getLanguageModel } from '@/lib/ai/providers'

const ChatRequestSchema = z.object({
  projectId: z.string().optional(),
  chapterId: z.string().optional(),
  messages: z.array(z.any()),
  model: z.string().optional(),
})

/**
 * POST /api/ai/chat
 * AI 对话接口（使用 Vercel AI SDK 标准格式）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = validateRequest(ChatRequestSchema, body)
    const { projectId, chapterId, messages, model: modelOverride } = data

    if (messages.length === 0) {
      return ApiErrors.badRequest('消息不能为空')
    }

    const contextManager = getContextManager()
    let systemPrompt = '你是一个专业的小说创作助手。'
    let tools: ReturnType<typeof buildChatTools> | undefined

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          chapters: { orderBy: { chapterNumber: 'asc' } },
          characters: true,
          worldElements: true,
        },
      })

      if (!project) {
        return ApiErrors.projectNotFound()
      }

      const currentChapter = chapterId
        ? project.chapters.find((chapter) => chapter.id === chapterId)
        : project.chapters[project.chapters.length - 1]

      if (chapterId && !currentChapter) {
        return ApiErrors.chapterNotFound()
      }

      const currentChapterNumber = currentChapter?.chapterNumber || 1

      const context = contextManager.buildContext({
        currentChapter: currentChapterNumber,
        allChapters: project.chapters.map((chapter) => ({
          ...chapter,
          summary: chapter.summary ?? undefined,
          notes: chapter.notes ?? undefined,
        })) as any,
        characters: project.characters.map((character) => ({
          ...character,
          nickname: character.nickname ?? undefined,
          age: character.age ?? undefined,
          gender: character.gender ?? undefined,
          appearance: character.appearance ?? undefined,
          personality: character.personality ?? undefined,
          backstory: character.backstory ?? undefined,
          motivation: character.motivation ?? undefined,
          dialogueStyle: character.dialogueStyle ?? undefined,
          relationships: character.relationships ?? undefined,
          characterArc: character.characterArc ?? undefined,
          avatar: character.avatar ?? undefined,
        })) as any,
        worldElements: project.worldElements.map((element) => ({
          ...element,
          type: element.type as any,
          attributes: element.attributes ?? undefined,
          relatedTo: element.relatedTo ?? undefined,
          references: element.references ?? undefined,
        })) as any,
        genre: project.genre,
      })

      const contextPrompt = contextManager.formatContextForPrompt(context)

      tools = buildChatTools({
        projectId,
        chapterId: currentChapter?.id ?? chapterId,
      })

      systemPrompt = `你是一个专业的小说创作助手，正在帮助作者创作《${project.title}》这部${project.genre}小说。

${contextPrompt}

当用户需要创建/修改角色、世界观、章节内容或查询项目信息时，请优先调用工具完成操作。工具完成后，用简洁的中文说明你做了什么，并给出下一步建议。若缺少必要信息，请先向用户提问再行动。`
    }

    const uiMessages = messages.map((message: any) => {
      if (!message || typeof message !== 'object') return message
      const { id: _id, ...rest } = message
      return rest
    })

    const modelMessages = await convertToModelMessages(uiMessages, {
      tools,
      ignoreIncompleteToolCalls: true,
    })

    const { model } = getLanguageModel(modelOverride)

    const result = streamText({
      model,
      system: systemPrompt,
      messages: modelMessages,
      tools,
      temperature: 0.8,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    if (error instanceof Validation_error) {
      return ApiErrors.badRequest('请求参数错误', error.errors)
    }
    return new Response(
      JSON.stringify({ error: '服务器错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
