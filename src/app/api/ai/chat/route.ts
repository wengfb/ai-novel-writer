/**
 * POST /api/ai/chat
 * Studio 对话：复用 studio-chat Agent（可编辑提示词 + 同一工具集）
 *
 * 流式协议保持 AI SDK UIMessage，以便前端 useChat / 工具审批不改动。
 * 系统提示词与温度/步数来自 Agent 注册表，聊天与界面按钮共享定义。
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { streamText, convertToModelMessages, stepCountIs } from 'ai'
import { z } from 'zod'
import { validateRequest, Validation_error } from '@/lib/api/validators'
import { ApiErrors } from '@/lib/api/response'
import { getContextManager } from '@/lib/ai/context-manager'
import { getStyleAnchorPrompt } from '@/lib/ai/style-anchor'
import { buildChatTools } from '@/lib/ai/chat-tools'
import { getLanguageModelAsync } from '@/lib/ai/providers'
import { renderAgentSlot, requireAgentDefinition } from '@/lib/ai/agents'
import type { Chapter, Character, WorldElement, Foreshadowing } from '@/types'
import type { UIMessage } from 'ai'

const STUDIO_CHAT_AGENT_ID = 'studio-chat'

const ChatRequestSchema = z.object({
  projectId: z.string().optional(),
  chapterId: z.string().optional(),
  /** 可切换其它 chatCompatible agent，默认 studio-chat */
  agentId: z.string().optional(),
  messages: z.array(z.custom<UIMessage>()),
  model: z.string().optional(),
})

const CharacterRoles = ['protagonist', 'antagonist', 'supporting', 'minor'] as const
const WorldElementTypes = ['location', 'history', 'magic', 'organization', 'item', 'other'] as const
const WorldElementScopes = ['global', 'regional', 'local'] as const
const WorldElementCategories = ['core_rule', 'detail', 'background'] as const
const PlotTypes = ['setup', 'conflict', 'climax', 'resolution'] as const

function oneOf<T extends readonly string[]>(value: string | null, values: T, fallback: T[number]): T[number] {
  return values.includes(value ?? '') ? (value as T[number]) : fallback
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = validateRequest(ChatRequestSchema, body)
    const {
      projectId,
      chapterId,
      messages,
      model: modelOverride,
      agentId: agentIdOverride,
    } = data

    if (messages.length === 0) {
      return ApiErrors.badRequest('消息不能为空')
    }

    const agentId = agentIdOverride || STUDIO_CHAT_AGENT_ID
    const agentDef = requireAgentDefinition(agentId)
    if (!agentDef.chatCompatible && agentId !== STUDIO_CHAT_AGENT_ID) {
      return ApiErrors.badRequest(`Agent ${agentId} 不支持对话模式`)
    }

    const contextManager = getContextManager()
    let systemPrompt = await renderAgentSlot(agentId, 'system', {
      projectTitle: '未命名项目',
      genre: '通用',
      styleAnchor: '',
      contextPrompt: '',
    })
    let tools: ReturnType<typeof buildChatTools> | undefined

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          chapters: { orderBy: { chapterNumber: 'asc' } },
          characters: true,
          worldElements: true,
          foreshadowings: true,
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
        foreshadowings: project.foreshadowings.map((f) => ({
          ...f,
          type: f.type as Foreshadowing['type'],
          plantedInChapterId: f.plantedInChapterId ?? undefined,
          plantedContent: f.plantedContent ?? undefined,
          plantedAt: f.plantedAt ?? undefined,
          expectedChapterNumber: f.expectedChapterNumber ?? undefined,
          resolvedInChapterId: f.resolvedInChapterId ?? undefined,
          resolvedContent: f.resolvedContent ?? undefined,
          resolvedAt: f.resolvedAt ?? undefined,
          relatedCharacters: f.relatedCharacters ?? undefined,
          relatedElements: f.relatedElements ?? undefined,
          tags: f.tags ?? undefined,
          reminderChapterNumber: f.reminderChapterNumber ?? undefined,
        })) as Foreshadowing[],
        genre: project.genre,
        projectId,
      })

      const contextPrompt = contextManager.formatContextForPrompt(context)
      const chatStyleAnchor = await getStyleAnchorPrompt(projectId)

      tools = buildChatTools({
        projectId,
        chapterId: currentChapter?.id ?? chapterId,
      })

      // 提示词来自 studio-chat（或指定 agent）可编辑槽位，与界面生成功能共用
      systemPrompt = await renderAgentSlot(agentId, 'system', {
        projectTitle: project.title,
        genre: project.genre,
        styleAnchor: chatStyleAnchor || '',
        contextPrompt,
      })
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

    const { model } = await getLanguageModelAsync(modelOverride)

    const result = streamText({
      model,
      system: systemPrompt,
      messages: modelMessages,
      tools,
      temperature: agentDef.temperature ?? 0.8,
      stopWhen: stepCountIs(agentDef.maxSteps ?? 5),
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    if (error instanceof Validation_error) {
      return ApiErrors.badRequest('请求参数错误', error.errors)
    }
    if (error instanceof Error && error.message.startsWith('未知 Agent')) {
      return ApiErrors.notFound('Agent')
    }
    return new Response(
      JSON.stringify({ error: '服务器错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
