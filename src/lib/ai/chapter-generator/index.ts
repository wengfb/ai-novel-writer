/**
 * 章节生成器
 * 实现递归规划 + 场景生成 + 反思优化
 */
import { getAIProviderAsync } from '@/lib/ai/providers'
import { PromptTemplateManager } from '@/lib/ai/prompts/template-manager'
import { getStyleAnchorPrompt } from '@/lib/ai/style-anchor'
import { prisma } from '@/lib/db/prisma'
import type { GenerationParams } from '@/types'
import { loadProjectContext } from './project-context'
import { generateChapterWithScenes } from './scenes'
import { reflectAndRefine } from './refine'
import { recordGeneration } from './record'
import { formatIntentConstraints, type OutlineIntent } from './plot-labels'

export class ChapterGenerator {
  private promptManager = new PromptTemplateManager()

  /** 生成章节（完整流程） */
  async generateChapter(params: {
    projectId: string
    chapterNumber: number
    chapterTitle: string
    chapterOutline: string
    targetWords: number
    model: GenerationParams['model']
    emotionalGoal?: string
    plotFunction?: string
    tensionLevel?: number
    onProgress?: (progress: { content: string; sceneIndex: number; totalScenes: number }) => void
  }): Promise<{ content: string; totalScenes: number; generationId?: string }> {
    const startTime = Date.now()
    const {
      projectId,
      chapterNumber,
      chapterTitle,
      chapterOutline,
      targetWords,
      model,
      onProgress,
    } = params

    const ai = await getAIProviderAsync(model)
    const { project, context, contextManager } = await loadProjectContext(projectId, chapterNumber)

    const matchedOutline = project.outlines.find(
      (o) => o.type === 'chapter' && o.order === chapterNumber
    )
    const outlineIntent: OutlineIntent = {
      emotionalGoal: params.emotionalGoal ?? (matchedOutline?.emotionalGoal || undefined),
      plotFunction: (params.plotFunction || matchedOutline?.plotFunction || '推进') as string,
      tensionLevel: params.tensionLevel ?? matchedOutline?.tensionLevel ?? 5,
    }

    const { content: generatedContent, totalScenes } = await generateChapterWithScenes(
      ai,
      this.promptManager,
      contextManager,
      {
        chapterNumber,
        chapterTitle,
        chapterOutline,
        context,
        targetWords,
        model,
        outlineIntent,
        onProgress,
      }
    )

    const refinedContent = await reflectAndRefine(ai, contextManager, {
      content: generatedContent,
      chapterOutline,
      context,
      model,
      outlineIntent,
    })

    const prompt = this.buildPrompt({
      chapterNumber,
      chapterTitle,
      chapterOutline,
      context,
      targetWords,
    })
    const generation = await recordGeneration(ai, {
      projectId,
      type: 'chapter',
      model,
      prompt,
      systemPrompt: contextManager.formatContextForPrompt(context),
      output: refinedContent,
      duration: Date.now() - startTime,
    })

    return {
      content: refinedContent,
      totalScenes,
      generationId: generation?.id,
    }
  }

  /** 续写章节 */
  async continueChapter(params: {
    projectId: string
    chapterId: string
    currentContent: string
    targetWords: number
    model: GenerationParams['model']
    onProgress?: (text: string) => void
  }): Promise<string> {
    const { projectId, chapterId, currentContent, targetWords, model, onProgress } = params
    const ai = await getAIProviderAsync(model)

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { project: true },
    })

    if (!chapter) {
      throw new Error('Chapter not found')
    }

    const { project, context, contextManager } = await loadProjectContext(
      projectId,
      chapter.chapterNumber
    )

    const matchedOutline = project.outlines.find(
      (o) => o.type === 'chapter' && o.order === chapter.chapterNumber
    )
    const chapterOutline = matchedOutline?.description || chapter.summary || chapter.title

    const outlineIntent: OutlineIntent = {
      emotionalGoal: matchedOutline?.emotionalGoal || undefined,
      plotFunction: (matchedOutline?.plotFunction || '推进') as string,
      tensionLevel: matchedOutline?.tensionLevel || 5,
    }

    const intentConstraints = formatIntentConstraints(outlineIntent)
      .replace('（请根据此调整描写的紧张程度和节奏）', '')
      .replace('（请通过细节描写传达此情感）', '')

    const recentContent = currentContent.slice(-8000)
    const contentSnippet = chapter.summary
      ? `[前文摘要：${chapter.summary}]\n\n${recentContent}`
      : recentContent

    const prompt = this.promptManager.render('chapter-continuation', {
      chapterNumber: chapter.chapterNumber,
      currentContent: contentSnippet,
      targetWords,
      chapterOutline,
      pov: context.metadata?.pov || '第三人称',
    })

    let fullOutput = ''
    const continueStyleAnchor = await getStyleAnchorPrompt(projectId)
    const generator = ai.streamGenerate({
      type: 'chapter',
      model,
      prompt,
      systemPrompt: `你是一位专业小说作家。正在续写第${chapter.chapterNumber}章《${chapter.title}》。

${continueStyleAnchor ? continueStyleAnchor + '\n\n' : ''}## 创作约束
${intentConstraints}

${contextManager.formatContextForPrompt(context)}`,
      temperature: 0.8,
      maxTokens: targetWords * 2,
    })

    for await (const chunk of generator) {
      fullOutput += chunk
      onProgress?.(chunk)
    }

    await recordGeneration(ai, {
      projectId,
      type: 'chapter',
      model,
      prompt,
      output: fullOutput,
    })

    return fullOutput
  }

  private buildPrompt(params: {
    chapterNumber: number
    chapterTitle: string
    chapterOutline: string
    context: any
    targetWords: number
  }): string {
    const { chapterNumber, chapterTitle, chapterOutline, context, targetWords } = params

    return this.promptManager.render('chapter-generation', {
      chapterNumber,
      chapterTitle,
      chapterOutline,
      characters: JSON.stringify(context.characters),
      worldSettings: JSON.stringify(context.worldElements),
      previousSummary: context.chapterSummaries.map((s: any) => s.summary).join('\n'),
      targetWords,
      pov: context.metadata?.pov || '第三人称',
    })
  }
}

let chapterGenerator: ChapterGenerator | null = null

export function getChapterGenerator(): ChapterGenerator {
  if (!chapterGenerator) {
    chapterGenerator = new ChapterGenerator()
  }
  return chapterGenerator
}
