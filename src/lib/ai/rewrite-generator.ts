import { getAIProvider } from './providers'
import { PromptTemplateManager } from './prompts/template-manager'
import { getContextManager } from './context-manager'
import { prisma } from '@/lib/db/prisma'
import type { GenerationParams } from '@/types'

export class RewriteGenerator {
  private ai = getAIProvider()
  private promptManager = new PromptTemplateManager()
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

    // 获取章节信息
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { project: true },
    })

    if (!chapter) {
      throw new Error('章节不存在')
    }

    // 获取项目完整数据用于构建上下文
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        chapters: { orderBy: { chapterNumber: 'asc' } },
        characters: true,
        worldElements: true,
      },
    })

    if (!project) {
      throw new Error('项目不存在')
    }

    // 构建上下文（角色、世界观、前文摘要等）
    const context = this.contextManager.buildContext({
      currentChapter: chapter.chapterNumber,
      allChapters: project.chapters.map(ch => ({
        ...ch,
        summary: ch.summary ?? undefined,
        notes: ch.notes ?? undefined,
      })) as any,
      characters: project.characters.map(ch => ({
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
      worldElements: project.worldElements.map(we => ({
        ...we,
        type: we.type as any,
        attributes: we.attributes ?? undefined,
        relatedTo: we.relatedTo ?? undefined,
        references: we.references ?? undefined,
      })) as any,
      genre: project.genre,
    })

    const prompt = this.promptManager.render('local-rewrite', {
      style,
      fullChapterContent: fullChapterContent.slice(-8000), // 截取最后 8000 字作为上下文
      selectedText,
    })

    const systemPrompt = `你是一位专业的小说编辑。你正在帮助作者改写一段小说文本。
改写风格是：${style}。

${this.contextManager.formatContextForPrompt(context)}`

    // 流式生成
    let fullOutput = ''
    const generator = this.ai.streamGenerate({
      type: 'chapter' as GenerationParams['type'],
      model,
      prompt,
      systemPrompt,
      temperature: 0.7,
      maxTokens: Math.max(2048, this.ai.estimateTokens(selectedText) * 3),
    })

    for await (const chunk of generator) {
      fullOutput += chunk
      onProgress?.(chunk)
    }

    if (!fullOutput.trim()) {
      throw new Error('AI 改写失败，返回了空内容')
    }

    // 记录生成历史
    await this.recordGeneration({
      projectId,
      type: 'rewrite',
      model,
      prompt,
      systemPrompt,
      output: fullOutput,
      duration: Date.now() - startTime,
      targetId: chapterId,
    })

    return fullOutput
  }

  private async recordGeneration(params: {
    projectId: string
    type: string
    model?: string
    prompt: string
    systemPrompt?: string
    output: string
    duration?: number
    targetId?: string
  }) {
    try {
      return await prisma.generation.create({
        data: {
          projectId: params.projectId,
          type: params.type,
          targetId: params.targetId,
          provider: this.ai.name,
          model: params.model || this.ai.model,
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

// 单例
let rewriteGenerator: RewriteGenerator | null = null

export function getRewriteGenerator(): RewriteGenerator {
  if (!rewriteGenerator) {
    rewriteGenerator = new RewriteGenerator()
  }
  return rewriteGenerator
}
