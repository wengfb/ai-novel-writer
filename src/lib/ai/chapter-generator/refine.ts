/**
 * 章节反思润色 — chapter / refine
 */

import type { ContextManager } from '@/lib/ai/context-manager'
import { getStyleAnchorPrompt } from '@/lib/ai/style-anchor'
import { runAgent } from '@/lib/ai/agents/runner'
import type { GenerationParams } from '@/types'
import { PLOT_FUNCTION_LABELS, type OutlineIntent } from './plot-labels'

/** 反思并优化已生成章节 */
export async function reflectAndRefine(
  contextManager: ContextManager,
  params: {
    content: string
    chapterOutline: string
    context: any
    model: GenerationParams['model']
    outlineIntent: OutlineIntent
  }
): Promise<string> {
  const { content, chapterOutline, context, model, outlineIntent } = params

  const intentCheckItems = [
    `是否达成了情节功能目标「${PLOT_FUNCTION_LABELS[outlineIntent.plotFunction] || outlineIntent.plotFunction}」？`,
    outlineIntent.emotionalGoal
      ? `是否通过描写传达了情感目标「${outlineIntent.emotionalGoal}」？`
      : '',
    `整体张力是否接近 ${outlineIntent.tensionLevel}/10？节奏和紧张程度是否匹配？`,
  ]
    .filter(Boolean)
    .map((item, i) => `${8 + i}. ${item}`)
    .join('\n')

  const refineProjectId = context.metadata?.projectId
  const refineStyleAnchor = refineProjectId ? await getStyleAnchorPrompt(refineProjectId) : ''
  const contextPrompt = [
    refineStyleAnchor,
    contextManager.formatContextForPrompt(context),
  ]
    .filter(Boolean)
    .join('\n\n')

  const result = await runAgent({
    agentId: 'chapter',
    systemSlot: 'system.refine',
    userSlot: 'user.refine',
    model,
    temperature: 0.6,
    variables: {
      contextPrompt,
      chapterOutline,
      content,
      intentCheckItems,
    },
  })

  if (!result.text.trim()) {
    throw new Error('AI 章节优化失败：返回为空')
  }

  return result.text
}
