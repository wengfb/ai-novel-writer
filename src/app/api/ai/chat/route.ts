import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { streamText, convertToModelMessages, stepCountIs } from 'ai'
import { z } from 'zod'
import { validateRequest, Validation_error } from '@/lib/api/validators'
import { ApiErrors } from '@/lib/api/response'
import { getContextManager } from '@/lib/ai/context-manager'
import { buildChatTools } from '@/lib/ai/chat-tools'
import { getLanguageModel } from '@/lib/ai/providers'
import type { Chapter, Character, WorldElement } from '@/types'
import type { UIMessage } from 'ai'

const ChatRequestSchema = z.object({
  projectId: z.string().optional(),
  chapterId: z.string().optional(),
  messages: z.array(z.custom<UIMessage>()),
  model: z.string().optional(),
})

const CharacterRoles = ['protagonist', 'antagonist', 'supporting', 'minor'] as const
const WorldElementTypes = ['location', 'history', 'magic', 'organization', 'item', 'other'] as const
const WorldElementScopes = ['global', 'regional', 'local'] as const
const WorldElementCategories = ['core_rule', 'detail', 'background'] as const
const PlotTypes = ['setup', 'conflict', 'climax', 'resolution'] as const

function oneOf<T extends readonly string[]>(value: string | null, values: T, fallback: T[number]): T[number] {
  return values.includes(value ?? '') ? value as T[number] : fallback
}


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
          id: chapter.id,
          projectId: chapter.projectId,
          chapterNumber: chapter.chapterNumber,
          title: chapter.title,
          content: chapter.content,
          wordCount: chapter.wordCount,
          summary: chapter.summary ?? undefined,
          notes: chapter.notes ?? undefined,
          isKeyChapter: chapter.isKeyChapter,
          plotType: chapter.plotType ? oneOf(chapter.plotType, PlotTypes, 'setup') : undefined,
          createdAt: chapter.createdAt,
          updatedAt: chapter.updatedAt,
        })) satisfies Chapter[],
        characters: project.characters.map((character) => ({
          id: character.id,
          projectId: character.projectId,
          name: character.name,
          nickname: character.nickname ?? undefined,
          age: character.age ?? undefined,
          gender: character.gender ?? undefined,
          importance: character.importance,
          role: oneOf(character.role, CharacterRoles, 'supporting'),
          appearance: character.appearance ?? undefined,
          personality: character.personality ?? undefined,
          backstory: character.backstory ?? undefined,
          motivation: character.motivation ?? undefined,
          dialogueStyle: character.dialogueStyle ?? undefined,
          relationships: character.relationships ?? undefined,
          characterArc: character.characterArc ?? undefined,
          avatar: character.avatar ?? undefined,
          createdAt: character.createdAt,
          updatedAt: character.updatedAt,
        })) satisfies Character[],
        worldElements: project.worldElements.map((element) => ({
          id: element.id,
          projectId: element.projectId,
          type: oneOf(element.type, WorldElementTypes, 'other'),
          name: element.name,
          description: element.description,
          attributes: element.attributes ?? undefined,
          importance: element.importance,
          scope: oneOf(element.scope, WorldElementScopes, 'local'),
          category: oneOf(element.category, WorldElementCategories, 'detail'),
          isEvolvable: element.isEvolvable,
          parentId: element.parentId ?? undefined,
          constraints: element.constraints ?? undefined,
          exceptions: element.exceptions ?? undefined,
          evolutionSpace: element.evolutionSpace ?? undefined,
          relatedTo: element.relatedTo ?? undefined,
          references: element.references ?? undefined,
          usageCount: element.usageCount,
          lastUsedAt: element.lastUsedAt ?? undefined,
          createdAt: element.createdAt,
          updatedAt: element.updatedAt,
        })) satisfies WorldElement[],
        genre: project.genre,
      })

      const contextPrompt = contextManager.formatContextForPrompt(context)

      tools = buildChatTools({
        projectId,
        chapterId: currentChapter?.id ?? chapterId,
      })

      systemPrompt = `你是一个专业的小说创作助手，正在帮助作者创作《${project.title}》这部${project.genre}小说。

${contextPrompt}

当用户需要创建/新增/保存/修改/更新角色、世界观、章节内容，或查询项目信息时，请优先考虑调用工具完成操作；如果用户意图明确且信息足够，直接使用对应工具比只给文字建议更合适。用户说“创建角色/新增设定/追加章节/查询项目”等操作类请求时，通常是在要求你操作当前项目数据，而不是只生成一段可复制的文本。写操作会先交由用户确认，不要因为需要确认而回避工具调用。工具完成后，用简洁的中文说明你做了什么，并给出下一步建议。若缺少必要信息，请先向用户提问再行动。`
    }

    const uiMessages = messages.map((message) => {
      const { id: _messageId, ...rest } = message
      void _messageId
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
      stopWhen: stepCountIs(5),
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
