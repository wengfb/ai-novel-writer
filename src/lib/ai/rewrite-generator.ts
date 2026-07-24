/**
 * 局部改写 — local-rewriter Agent
 * 编辑器气泡菜单与统一 Agent 提示词共用
 */

import { getAIProviderAsync } from './providers'
import { getContextManager } from './context-manager'
import { getStyleAnchorPrompt } from './style-anchor'
import { streamAgent } from './agents'
import { prisma } from '@/lib/db/prisma'

export class RewriteGenerator {
  private contextManager = getContextManager()

  async rewrite(params: {
    projectId: string
    chapterId: string
    selectedText: string
    style: string
    fullChapterContent: string
    model?: string
    onProgress?: (text: string) => void
  }): Promise<string> {
    const startTime = Date.now()
    const { projectId, chapterId, selectedText, style, fullChapterContent, model, onProgress } =
      params
    const ai = await getAIProviderAsync(model)

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { project: true },
    })

    if (!chapter) {
      throw new Error('章节不存在')
    }

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
      throw new Error('项目不存在')
    }

    const context = this.contextManager.buildContext({
      currentChapter: chapter.chapterNumber,
      allChapters: project.chapters.map((ch) => ({
        ...ch,
        summary: ch.summary ?? undefined,
        notes: ch.notes ?? undefined,
      })) as any,
      characters: project.characters.map((ch) => ({
        ...ch,
        nickname: ch.nickname ?? undefined,
        age: ch.age ?? undefined,
        gender: ch.gender ?? undefined,
        appearance: ch.appearance ?? undefined,
        personality: ch.personality ?? undefined,
        backstory: ch.backstory ?? undefined,
        motivation: ch.motivation ?? undefined,
        dialogueStyle: ch.dialogueStyle ?? undefined,
        relationships: ch.relationships ?? undefined,
        characterArc: ch.characterArc ?? undefined,
        avatar: ch.avatar ?? undefined,
      })) as any,
      worldElements: project.worldElements.map((we) => ({
        ...we,
        type: we.type as any,
        attributes: we.attributes ?? undefined,
        relatedTo: we.relatedTo ?? undefined,
        references: we.references ?? undefined,
      })) as any,
      foreshadowings: project.foreshadowings as any,
      genre: project.genre,
      style: await getStyleAnchorPrompt(projectId),
      pov: project.pov,
      projectId,
    })

    const rewriteStyleAnchor = await getStyleAnchorPrompt(projectId)
    const contextAppend = [
      `改写风格是：${style}。`,
      rewriteStyleAnchor,
      this.contextManager.formatContextForPrompt(context),
    ]
      .filter(Boolean)
      .join('\n\n')

    let fullOutput = ''
    let systemPrompt = ''
    let userPrompt = ''

    const stream = streamAgent({
      agentId: 'rewrite',
      model,
      temperature: 0.7,
      contextAppend,
      variables: {
        style,
        fullChapterContent: fullChapterContent.slice(-8000),
        selectedText,
      },
    })

    // streamAgent 为 AsyncGenerator：yield chunk，return 最终结果
    let next = await stream.next()
    while (!next.done) {
      fullOutput += next.value
      onProgress?.(next.value)
      next = await stream.next()
    }
    if (next.value) {
      systemPrompt = next.value.systemPrompt
      userPrompt = next.value.userPrompt
      if (!fullOutput && next.value.text) {
        fullOutput = next.value.text
      }
    }

    if (!fullOutput.trim()) {
      throw new Error('AI 改写失败，返回了空内容')
    }

    await this.recordGeneration(ai, {
      projectId,
      type: 'rewrite',
      model,
      prompt: userPrompt || selectedText,
      systemPrompt,
      output: fullOutput,
      duration: Date.now() - startTime,
      targetId: chapterId,
    })

    return fullOutput
  }

  private async recordGeneration(
    ai: { name: string; model: string },
    params: {
      projectId: string
      type: string
      model?: string
      prompt: string
      systemPrompt?: string
      output: string
      duration?: number
      targetId?: string
    }
  ) {
    try {
      return await prisma.generation.create({
        data: {
          projectId: params.projectId,
          type: params.type,
          targetId: params.targetId,
          provider: ai.name,
          model: params.model || ai.model,
          prompt: params.prompt,
          systemPrompt: params.systemPrompt,
          output: params.output,
          duration: params.duration,
          status: 'success',
        },
      })
    } catch (error) {
      console.error('记录改写生成失败:', error)
      return null
    }
  }
}

let rewriteGenerator: RewriteGenerator | null = null

export function getRewriteGenerator(): RewriteGenerator {
  if (!rewriteGenerator) {
    rewriteGenerator = new RewriteGenerator()
  }
  return rewriteGenerator
}
