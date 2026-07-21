/**
 * 场景规划 + 分场景写作
 *
 * - analyzeScenes → scene-planner Agent
 * - generateScene → scene-writer Agent
 * - generateChapterWithScenes：循环写作（Workflow 的 write 步也复用 generateScene）
 *
 * 提示词可在设置页编辑，勿在此硬编码长模板。
 */

import type { ContextManager } from '@/lib/ai/context-manager'
import { getStyleAnchorPrompt } from '@/lib/ai/style-anchor'
import { runAgent } from '@/lib/ai/agents/runner'
import type { GenerationParams } from '@/types'
import { formatIntentConstraints, PLOT_FUNCTION_LABELS, type OutlineIntent } from './plot-labels'

export type ScenePlan = {
  title: string
  goal: string
  location?: string
  characters: string[]
  estimatedWords: number
}

function parseScenesJson(output: string, chapterOutline: string): ScenePlan[] {
  try {
    const jsonMatch =
      output.match(/```json\n([\s\S]*?)\n```/) ||
      output.match(/```\n([\s\S]*?)\n```/) ||
      output.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])
      if (Array.isArray(parsed.scenes) && parsed.scenes.length > 0) {
        return parsed.scenes
      }
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

/** 分析大纲，划分 3-5 个场景（scene-planner Agent） */
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

  const result = await runAgent({
    agentId: 'scene-planner',
    model,
    temperature: 0.7,
    variables: {
      chapterOutline,
      plotFunction: PLOT_FUNCTION_LABELS[outlineIntent.plotFunction] || outlineIntent.plotFunction,
      tensionLevel: outlineIntent.tensionLevel,
      emotionalGoalLine,
      briefContext,
    },
  })

  if (!result.text.trim()) {
    throw new Error('AI 场景分析失败：返回为空')
  }

  return parseScenesJson(result.text, chapterOutline)
}

/** 生成单个场景正文（scene-writer Agent） */
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
    agentId: 'scene-writer',
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
