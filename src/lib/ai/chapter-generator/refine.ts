import type { AIProvider } from '@/lib/ai/providers/types'
import type { ContextManager } from '@/lib/ai/context-manager'
import { getStyleAnchorPrompt } from '@/lib/ai/style-anchor'
import type { GenerationParams } from '@/types'
import { PLOT_FUNCTION_LABELS, type OutlineIntent } from './plot-labels'

/** 反思并优化已生成章节 */
export async function reflectAndRefine(
  ai: AIProvider,
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
    .map((item, i) => `8${i ? '' : ''}. ${item}`)
    .join('\n')

  const prompt = `作为一位专业编辑，请审核并优化以下章节内容。

请严格对照上下文中的角色设定和世界观规则进行审核，确保角色行为不偏离设定、世界观描写无矛盾。同时请确保章节内容达到结构化创作意图的目标。

**章节大纲**：
${chapterOutline}

**待优化内容**：
${content}

**审核要点**：
1. 是否符合剧情发展逻辑？
2. 角色行为是否符合设定？（对照上下文中的角色信息检查）
3. 世界观描写是否有矛盾？（对照上下文中的世界观规则检查）
4. 是否遗漏了重要的伏笔回收机会？
5. 描写是否生动？是否有冗余？
6. 对话是否自然？
7. 是否需要补充细节？
${intentCheckItems}

请直接输出优化后的完整章节，不要包含点评和说明。`

  const systemPrompt = `你是一位资深小说编辑，擅长发现剧情漏洞和角色行为不一致的问题。

${contextManager.formatContextForPrompt(context)}`

  const refineProjectId = context.metadata?.projectId
  const refineStyleAnchor = refineProjectId ? await getStyleAnchorPrompt(refineProjectId) : ''

  const result = await ai.generate({
    type: 'chapter',
    model,
    prompt,
    systemPrompt: refineStyleAnchor
      ? `${refineStyleAnchor}\n\n${systemPrompt}`
      : systemPrompt,
    temperature: 0.6,
    maxTokens: ai.estimateTokens(content) * 2,
  })

  if (result.status !== 'success' || !result.output.trim()) {
    const detail = result.error ? `: ${result.error}` : ''
    throw new Error(`AI 章节优化失败${detail}`)
  }

  return result.output
}
