/**
 * POST /api/ai/chat
 * Studio 对话：复用 studio-chat Agent（可编辑提示词 + 同一工具集）
 *
 * 流式协议保持 AI SDK UIMessage，以便前端 useChat / 工具审批不改动。
 * 系统提示词与温度/步数来自 Agent 注册表，聊天与界面按钮共享定义。
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { streamText, convertToModelMessages, stepCountIs, type ToolSet } from 'ai'
import { z } from 'zod'
import { validateRequest, Validation_error } from '@/lib/api/validators'
import { ApiErrors } from '@/lib/api/response'
import { getContextManager } from '@/lib/ai/context-manager'
import { getStyleAnchorPrompt } from '@/lib/ai/style-anchor'
import { buildChatTools } from '@/lib/ai/chat-tools'
import { createIdeaDraftTools, createOnboardingDraftTools, createOutlineDraftTools } from '@/lib/ai/chat-tools/draft-tools'
import { getLanguageModelAsync } from '@/lib/ai/providers'
import { renderAgentSlot, requireAgentDefinition, resolveAgentId } from '@/lib/ai/agents'
import { getAgentRuntimeConfig } from '@/lib/ai/agents/runtime-config'
import { getAIDefaultGenerationConfig } from '@/lib/ai/config'
import type { Chapter, Character, WorldElement, Foreshadowing } from '@/types'
import type { UIMessage } from 'ai'
import type { AssistantScopeType } from '@/lib/ai/agent-workspace'

const STUDIO_CHAT_AGENT_ID = 'studio-chat'

/**
 * UIMessage 最小契约：AI SDK 流式对话需要 parts（或可转 parts 的 content）。
 * 裸 `{ role, content: string }` 会在 convertToModelMessages 阶段炸掉，这里提前 400。
 */
const ChatUIMessageSchema = z
  .object({
    id: z.string().optional(),
    role: z.enum(['user', 'assistant', 'system']),
    parts: z.array(z.unknown()).optional(),
    content: z.union([z.string(), z.array(z.unknown())]).optional(),
  })
  .refine(
    (message) =>
      (Array.isArray(message.parts) && message.parts.length > 0) ||
      (typeof message.content === 'string' && message.content.trim().length > 0) ||
      (Array.isArray(message.content) && message.content.length > 0),
    { message: '消息需要非空的 parts 或 content' }
  )

const ChatRequestSchema = z.object({
  projectId: z.string().optional(),
  chapterId: z.string().optional(),
  /** 可切换其它 chatCompatible agent，默认 studio-chat */
  agentId: z.string().optional(),
  /** 多 slot agent（如 onboarding）指定 system 槽位 */
  systemSlot: z.string().optional(),
  /**
   * 附加到 system 的动态上下文（Onboarding 创意卡/已确认步骤摘要）
   * 不用于 Studio 写库工具场景的主 context（有 projectId 时仍走项目上下文）
   */
  contextAppend: z.string().optional(),
  /** 右侧协作工作区的结构化参考对象，仅用于工具最小化和上下文标识。 */
  scopeType: z.enum(['project', 'chapter', 'character', 'outline', 'world']).optional(),
  scopeId: z.string().optional(),
  /** 前端草稿工具目标：仅回传结构化草稿，不会写数据库。 */
  draftTarget: z.enum(['idea', 'onboarding', 'outline']).optional(),
  draftStep: z.enum(['architecture', 'characters', 'world', 'volume', 'foreshadowings', 'styleAnchor']).optional(),
  messages: z.array(ChatUIMessageSchema).min(1, '消息不能为空'),
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
      systemSlot: systemSlotOverride,
      contextAppend,
      scopeType,
      scopeId: _scopeId,
      draftTarget,
      draftStep,
    } = data
    void _scopeId

    const agentId = agentIdOverride || STUDIO_CHAT_AGENT_ID
    const agentDef = requireAgentDefinition(agentId)
    const [agentRuntimeConfig, globalConfig] = await Promise.all([
      getAgentRuntimeConfig(agentDef.id),
      getAIDefaultGenerationConfig(),
    ])
    if (!agentDef.chatCompatible && agentId !== STUDIO_CHAT_AGENT_ID) {
      return ApiErrors.badRequest(`Agent ${agentId} 不支持对话模式`)
    }

    const legacy = resolveAgentId(agentId)
    const systemSlot =
      systemSlotOverride || legacy.systemSlot || 'system'

    const contextManager = getContextManager()
    let systemPrompt = await renderAgentSlot(agentId, systemSlot, {
      projectTitle: '未命名项目',
      genre: '通用',
      styleAnchor: '',
      contextPrompt: '',
    })
    let tools: ToolSet | undefined

    // Onboarding 等无项目场景：system + 动态上下文，不挂写库 tools
    if (!projectId && contextAppend?.trim()) {
      systemPrompt = `${systemPrompt}\n\n${contextAppend.trim()}`
    }

    if (draftTarget === 'idea') {
      tools = createIdeaDraftTools()
    } else if (draftTarget === 'onboarding' && draftStep) {
      tools = createOnboardingDraftTools()
    } else if (draftTarget === 'outline') {
      tools = createOutlineDraftTools()
    }

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

      tools = draftTarget === 'outline'
        ? createOutlineDraftTools()
        : buildChatTools({
          projectId,
          chapterId: currentChapter?.id ?? chapterId,
          agentId,
          scopeType: scopeType as AssistantScopeType | undefined,
        })

      // 提示词来自 Agent 可编辑槽位
      systemPrompt = await renderAgentSlot(agentId, systemSlot, {
        projectTitle: project.title,
        genre: project.genre,
        styleAnchor: chatStyleAnchor || '',
        contextPrompt,
      })
      if (contextAppend?.trim()) {
        systemPrompt = `${systemPrompt}\n\n${contextAppend.trim()}`
      }
    }

    // 统一为带 parts 的 UIMessage，兼容仅 content 的旧客户端
    const uiMessages = messages.map((message, index) => {
      const role = message.role
      const id = message.id || `msg-${index}`
      if (Array.isArray(message.parts) && message.parts.length > 0) {
        return { id, role, parts: message.parts } as UIMessage
      }
      if (typeof message.content === 'string') {
        return {
          id,
          role,
          parts: [{ type: 'text', text: message.content }],
        } as UIMessage
      }
      if (Array.isArray(message.content)) {
        return { id, role, parts: message.content } as UIMessage
      }
      return { id, role, parts: [] } as UIMessage
    })

    let modelMessages
    try {
      modelMessages = await convertToModelMessages(uiMessages, {
        tools,
        ignoreIncompleteToolCalls: true,
      })
    } catch (error) {
      console.error('convertToModelMessages failed:', error)
      return ApiErrors.badRequest(
        '消息格式无效，请使用 UIMessage（含 parts）或 content 文本',
        error instanceof Error ? error.message : undefined
      )
    }

    const { model } = await getLanguageModelAsync(modelOverride || agentRuntimeConfig.model)

    const result = streamText({
      model,
      system: systemPrompt,
      messages: modelMessages,
      tools,
      temperature: agentRuntimeConfig.temperature ?? globalConfig.temperature ?? agentDef.temperature ?? 0.8,
      maxOutputTokens: agentRuntimeConfig.maxTokens ?? globalConfig.maxTokens,
      stopWhen: stepCountIs(agentDef.maxSteps ?? 5),
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    if (error instanceof Validation_error) {
      return ApiErrors.badRequest('请求参数错误', error.errors)
    }
    if (error instanceof z.ZodError) {
      return ApiErrors.badRequest(
        '请求参数错误',
        error.issues.map((issue) => ({
          field: issue.path.join('.') || '(root)',
          message: issue.message,
        }))
      )
    }
    if (error instanceof Error && error.message.startsWith('未知 Agent')) {
      return ApiErrors.notFound('Agent')
    }
    return ApiErrors.serverError(error instanceof Error ? error.message : '服务器错误')
  }
}
