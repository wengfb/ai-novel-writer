/**
 * 章节生成器（Studio「生成章节 / 续写」业务门面）
 *
 * - generateChapter：Mastra Workflow（plan → write → refine）
 * - continueChapter：chapter-continue Agent 流式输出
 *
 * 提示词均来自 Agent 注册表，禁止在此硬编码长模板。
 */

import { getAIProviderAsync } from '@/lib/ai/providers'
import { getStyleAnchorPrompt } from '@/lib/ai/style-anchor'
import { prisma } from '@/lib/db/prisma'
import { streamAgent } from '@/lib/ai/agents/runner'
import { runChapterGenerationWorkflow } from '@/lib/ai/workflows'
import type { GenerationParams } from '@/types'
import { loadProjectContext } from './project-context'
import { recordGeneration } from './record'
import { formatIntentConstraints, type OutlineIntent } from './plot-labels'

export class ChapterGenerator {
  /**
   * 生成完整章节
   * 委托 {@link runChapterGenerationWorkflow}：场景规划 → 分场景写作 → 润色
   */
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
    const {
      projectId,
      chapterNumber,
      chapterTitle,
      chapterOutline,
      targetWords,
      model,
      onProgress,
    } = params

    const { project } = await loadProjectContext(projectId, chapterNumber)

    const matchedOutline = project.outlines.find(
      (o) => o.type === 'chapter' && o.order === chapterNumber
    )
    const outlineIntent: OutlineIntent = {
      emotionalGoal: params.emotionalGoal ?? (matchedOutline?.emotionalGoal || undefined),
      plotFunction: (params.plotFunction || matchedOutline?.plotFunction || '推进') as string,
      tensionLevel: params.tensionLevel ?? matchedOutline?.tensionLevel ?? 5,
    }

    const result = await runChapterGenerationWorkflow(
      {
        projectId,
        chapterNumber,
        chapterTitle,
        chapterOutline,
        targetWords,
        model,
        outlineIntent,
      },
      (event) => {
        if (event.stage === 'write' && event.content != null && event.sceneIndex != null) {
          onProgress?.({
            content: event.content,
            sceneIndex: event.sceneIndex,
            totalScenes: event.totalScenes ?? 0,
          })
        }
      }
    )

    return {
      content: result.content,
      totalScenes: result.totalScenes,
      generationId: result.generationId,
    }
  }

  /**
   * 在已有正文后续写
   * 使用 chapter-continue Agent + streamAgent，经 onProgress 推送增量
   */
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

    const continueStyleAnchor = await getStyleAnchorPrompt(projectId)
    const contextAppend = [
      `正在续写第${chapter.chapterNumber}章《${chapter.title}》。`,
      continueStyleAnchor,
      `## 创作约束\n${intentConstraints}`,
      contextManager.formatContextForPrompt(context),
    ]
      .filter(Boolean)
      .join('\n\n')

    let fullOutput = ''
    const stream = streamAgent({
      agentId: 'chapter-continue',
      model,
      temperature: 0.8,
      contextAppend,
      variables: {
        chapterNumber: chapter.chapterNumber,
        currentContent: contentSnippet,
        targetWords,
        chapterOutline,
        pov: context.metadata?.pov || '第三人称',
      },
    })

    for await (const chunk of stream) {
      fullOutput += chunk
      onProgress?.(chunk)
    }

    await recordGeneration(ai, {
      projectId,
      type: 'chapter',
      model,
      prompt: contentSnippet,
      output: fullOutput,
    })

    return fullOutput
  }
}

let chapterGenerator: ChapterGenerator | null = null

export function getChapterGenerator(): ChapterGenerator {
  if (!chapterGenerator) {
    chapterGenerator = new ChapterGenerator()
  }
  return chapterGenerator
}
