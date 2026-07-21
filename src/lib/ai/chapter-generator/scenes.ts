import type { AIProvider } from '@/lib/ai/providers/types'
import type { PromptTemplateManager } from '@/lib/ai/prompts/template-manager'
import type { ContextManager } from '@/lib/ai/context-manager'
import { getStyleAnchorPrompt } from '@/lib/ai/style-anchor'
import type { GenerationParams } from '@/types'
import { formatIntentConstraints, PLOT_FUNCTION_LABELS, type OutlineIntent } from './plot-labels'

export type ScenePlan = {
  title: string
  goal: string
  location?: string
  characters: string[]
  estimatedWords: number
}

/** 分析大纲，划分 3-5 个场景 */
export async function analyzeScenes(
  ai: AIProvider,
  params: {
    chapterOutline: string
    context: any
    model: GenerationParams['model']
    outlineIntent: OutlineIntent
  }
): Promise<ScenePlan[]> {
  const { chapterOutline, context, model, outlineIntent } = params

  const briefContext = [
    `类型：${context.metadata.genre}`,
    context.chapterSummaries.length > 0
      ? `前情摘要：${context.chapterSummaries.map((s: any) => `第${s.chapterNumber}章 ${s.summary}`).join('；')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n')

  const prompt = `请根据以下章节大纲，将其划分为3-5个场景：

**章节大纲**：
${chapterOutline}

**创作意图约束**：
- 情节功能：${PLOT_FUNCTION_LABELS[outlineIntent.plotFunction] || outlineIntent.plotFunction}
- 张力等级：${outlineIntent.tensionLevel}/10${outlineIntent.emotionalGoal ? `\n- 情感目标：${outlineIntent.emotionalGoal}` : ''}

**故事背景**：
${briefContext}

请分析并返回场景划分，以JSON格式：
\`\`\`json
{
  "scenes": [
    {
      "title": "场景标题",
      "goal": "场景目标",
      "location": "地点",
      "characters": ["角色名"],
      "estimatedWords": 预估字数
    }
  ]
}
\`\`\``

  const result = await ai.generate({
    type: 'chapter',
    model,
    prompt,
    temperature: 0.7,
    maxTokens: 2000,
  })

  if (result.status !== 'success' || !result.output.trim()) {
    const detail = result.error ? `: ${result.error}` : ''
    throw new Error(`AI 场景分析失败${detail}`)
  }

  try {
    const jsonMatch =
      result.output.match(/```json\n([\s\S]*?)\n```/) || result.output.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])
      return parsed.scenes || []
    }
  } catch (error) {
    console.error('Failed to parse scenes:', error)
  }

  return [
    {
      title: '完整章节',
      goal: chapterOutline,
      characters: [],
      estimatedWords: 3000,
    },
  ]
}

/** 生成单个场景正文 */
export async function generateScene(
  ai: AIProvider,
  promptManager: PromptTemplateManager,
  contextManager: ContextManager,
  params: {
    scene: ScenePlan
    sceneIndex: number
    totalScenes: number
    chapterNumber: number
    chapterTitle: string
    previousContent: string
    context: any
    targetWords: number
    model: GenerationParams['model']
    outlineIntent: OutlineIntent
  }
): Promise<string> {
  const {
    scene,
    sceneIndex,
    totalScenes,
    chapterNumber,
    chapterTitle,
    previousContent,
    context,
    targetWords,
    model,
    outlineIntent,
  } = params

  const prompt = promptManager.render('scene-generation', {
    sceneGoal: scene.goal,
    characters: scene.characters?.join(', ') || '主要角色',
    location: scene.location || '待定',
    previousText: previousContent.slice(-1000),
    targetWords,
    pov: context.metadata?.pov || '第三人称',
  })

  const intentConstraints = formatIntentConstraints(outlineIntent)
  const sceneProjectId = context.metadata?.projectId
  const styleAnchor = sceneProjectId ? await getStyleAnchorPrompt(sceneProjectId) : ''

  const result = await ai.generate({
    type: 'chapter',
    model,
    prompt,
    systemPrompt: `你是一位专业小说作家。正在撰写第${chapterNumber}章《${chapterTitle}》的第${sceneIndex + 1}个场景（共${totalScenes}个场景）。

${styleAnchor ? styleAnchor + '\n\n' : ''}## 创作约束
${intentConstraints}

${contextManager.formatContextForPrompt(context)}`,
    temperature: 0.8,
    maxTokens: targetWords * 2,
  })

  if (result.status !== 'success' || !result.output.trim()) {
    const detail = result.error ? `: ${result.error}` : ''
    throw new Error(`AI 场景生成失败${detail}`)
  }

  return result.output
}

/** 按场景划分策略生成整章 */
export async function generateChapterWithScenes(
  ai: AIProvider,
  promptManager: PromptTemplateManager,
  contextManager: ContextManager,
  params: {
    chapterNumber: number
    chapterTitle: string
    chapterOutline: string
    context: any
    targetWords: number
    model: GenerationParams['model']
    outlineIntent: OutlineIntent
    onProgress?: (progress: { content: string; sceneIndex: number; totalScenes: number }) => void
  }
): Promise<{ content: string; totalScenes: number }> {
  const {
    chapterNumber,
    chapterTitle,
    chapterOutline,
    context,
    targetWords,
    model,
    outlineIntent,
    onProgress,
  } = params

  const scenes = await analyzeScenes(ai, {
    chapterOutline,
    context,
    model,
    outlineIntent,
  })

  const generatedScenes: string[] = []
  const targetWordsPerScene = Math.floor(targetWords / scenes.length)

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]
    const previousContent = generatedScenes.join('\n\n')

    const sceneContent = await generateScene(ai, promptManager, contextManager, {
      scene,
      sceneIndex: i,
      totalScenes: scenes.length,
      chapterNumber,
      chapterTitle,
      previousContent,
      context,
      targetWords: targetWordsPerScene,
      model,
      outlineIntent,
    })

    generatedScenes.push(sceneContent)

    if (onProgress) {
      onProgress({ content: sceneContent, sceneIndex: i, totalScenes: scenes.length })
    }
  }

  return { content: generatedScenes.join('\n\n'), totalScenes: scenes.length }
}
