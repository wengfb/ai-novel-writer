/**
 * 场景规划 + 分场景写作
 *
 * - analyzeScenes → chapter / plan（结构化）
 * - generateScene → chapter / write（散文）
 */

import type { ContextManager } from '@/lib/ai/context-manager'
import { getStyleAnchorPrompt } from '@/lib/ai/style-anchor'
import { runAgent, runAgentObject } from '@/lib/ai/agents/runner'
import { ScenePlanSchema } from '@/lib/ai/agents/schemas'
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
export async function analyzeScenes(params: {
  chapterOutline: string
  context: any
  model: GenerationParams['model']
  outlineIntent: OutlineIntent
}): Promise<ScenePlan[]> {
  const { chapterOutline, context, model, outlineIntent } = params

  const briefContext = [
    `类型：${context.metadata.genre}`,
    context.chapterSummaries?.length > 0
      ? `前情摘要：${context.chapterSummaries.map((s: any) => `第${s.chapterNumber}章 ${s.summary}`).join('；')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n')

  const emotionalGoalLine = outlineIntent.emotionalGoal
    ? `- 情感目标：${outlineIntent.emotionalGoal}`
    : ''

  try {
    const result = await runAgentObject({
      agentId: 'chapter',
      systemSlot: 'system.plan',
      userSlot: 'user.plan',
      model,
      temperature: 0.7,
      schema: ScenePlanSchema,
      schemaName: 'ScenePlan',
      variables: {
        chapterOutline,
        plotFunction: PLOT_FUNCTION_LABELS[outlineIntent.plotFunction] || outlineIntent.plotFunction,
        tensionLevel: outlineIntent.tensionLevel,
        emotionalGoalLine,
        briefContext,
      },
    })

    return result.object.scenes.map((s) => ({
      title: s.title,
      goal: s.goal,
      location: s.location,
      characters: s.characters ?? [],
      estimatedWords: s.estimatedWords ?? 1000,
    }))
  } catch (error) {
    console.error('scene plan structured failed, fallback single scene:', error)
    return [
      {
        title: '完整章节',
        goal: chapterOutline,
        characters: [],
        estimatedWords: 3000,
      },
    ]
  }
}

/** 生成单个场景正文 */
export async function generateScene(
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

  const intentConstraints = formatIntentConstraints(outlineIntent)
  const sceneProjectId = context.metadata?.projectId
  const styleAnchor = sceneProjectId ? await getStyleAnchorPrompt(sceneProjectId) : ''
  const contextPrompt = [
    styleAnchor,
    `## 创作约束\n${intentConstraints}`,
    contextManager.formatContextForPrompt(context),
  ]
    .filter(Boolean)
    .join('\n\n')

  const result = await runAgent({
    agentId: 'chapter',
    systemSlot: 'system.write',
    userSlot: 'user.write',
    model,
    temperature: 0.8,
    variables: {
      chapterNumber,
      chapterTitle,
      sceneIndex: sceneIndex + 1,
      totalScenes,
      styleAnchor: styleAnchor || '',
      contextPrompt,
      sceneGoal: scene.goal,
      characters: scene.characters?.join(', ') || '主要角色',
      location: scene.location || '待定',
      time: '与剧情相符',
      previousText: previousContent.slice(-1000),
      targetWords,
      pov: context.metadata?.pov || '第三人称',
    },
  })

  if (!result.text.trim()) {
    throw new Error('AI 场景生成失败：返回为空')
  }

  return result.text
}

/** 按场景划分策略生成整章 */
export async function generateChapterWithScenes(
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

  const scenes = await analyzeScenes({
    chapterOutline,
    context,
    model,
    outlineIntent,
  })

  const generatedScenes: string[] = []
  const targetWordsPerScene = Math.floor(targetWords / Math.max(scenes.length, 1))

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]
    const previousContent = generatedScenes.join('\n\n')

    const sceneContent = await generateScene(contextManager, {
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
