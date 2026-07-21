/**
 * 章节生成 Workflow（Mastra）
 *
 * ## 步骤
 * 1. plan-scenes    — scene-planner：大纲 → 3–5 场景
 * 2. write-scenes   — scene-writer：逐场景写作
 * 3. refine-chapter — chapter-editor：反思润色 + 写 generation 记录
 *
 * ## 进度
 * 通过闭包 onProgress 上报，兼容旧版
 * `{ content, sceneIndex, totalScenes }`（见 ChapterGenerator）
 *
 * ## 入口
 * {@link runChapterGenerationWorkflow} ← ChapterGenerator.generateChapter
 */

import { createStep, createWorkflow } from '@mastra/core/workflows'
import { z } from 'zod'
import { getAIProviderAsync } from '@/lib/ai/providers'
import { loadProjectContext } from '@/lib/ai/chapter-generator/project-context'
import { analyzeScenes, generateScene, type ScenePlan } from '@/lib/ai/chapter-generator/scenes'
import { reflectAndRefine } from '@/lib/ai/chapter-generator/refine'
import { recordGeneration } from '@/lib/ai/chapter-generator/record'
// 从 runner 直引，避免 agents/index ↔ workflows 循环依赖
import { renderAgentSlot } from '@/lib/ai/agents/runner'
import type { OutlineIntent } from '@/lib/ai/chapter-generator/plot-labels'

// ============ Schemas ============

const OutlineIntentSchema = z.object({
  emotionalGoal: z.string().optional(),
  plotFunction: z.string(),
  tensionLevel: z.number(),
})

const ChapterWorkflowInputSchema = z.object({
  projectId: z.string(),
  chapterNumber: z.number(),
  chapterTitle: z.string(),
  chapterOutline: z.string(),
  targetWords: z.number(),
  model: z.string().optional(),
  outlineIntent: OutlineIntentSchema,
})

const ScenePlanSchema = z.object({
  title: z.string(),
  goal: z.string(),
  location: z.string().optional(),
  characters: z.array(z.string()),
  estimatedWords: z.number(),
})

const PlanOutputSchema = ChapterWorkflowInputSchema.extend({
  scenes: z.array(ScenePlanSchema),
})

const WriteOutputSchema = PlanOutputSchema.extend({
  draftContent: z.string(),
  totalScenes: z.number(),
})

const ChapterWorkflowOutputSchema = z.object({
  content: z.string(),
  totalScenes: z.number(),
  generationId: z.string().optional(),
})

export type ChapterWorkflowInput = z.infer<typeof ChapterWorkflowInputSchema>
export type ChapterWorkflowOutput = z.infer<typeof ChapterWorkflowOutputSchema>

/** 章节 Workflow 进度事件（闭包回调，不进 state） */
export type ChapterProgressEvent = {
  stage: 'plan' | 'write' | 'refine' | 'done'
  /** write 阶段：当前场景正文 */
  content?: string
  /** write 阶段：0-based 场景序号 */
  sceneIndex?: number
  totalScenes?: number
  message?: string
}

/** 进度回调；勿写入 workflow state，以免序列化大段正文 */
type ProgressSink = (event: ChapterProgressEvent) => void

// ============ Steps ============

function createPlanScenesStep(onProgress?: ProgressSink) {
  return createStep({
    id: 'plan-scenes',
    description: 'scene-planner：将章节大纲拆成 3-5 个场景',
    inputSchema: ChapterWorkflowInputSchema,
    outputSchema: PlanOutputSchema,
    execute: async ({ inputData }) => {
      onProgress?.({ stage: 'plan', message: '正在规划场景…' })

      const { context } = await loadProjectContext(
        inputData.projectId,
        inputData.chapterNumber
      )

      const scenes = await analyzeScenes({
        chapterOutline: inputData.chapterOutline,
        context,
        model: inputData.model,
        outlineIntent: inputData.outlineIntent as OutlineIntent,
      })

      onProgress?.({
        stage: 'plan',
        totalScenes: scenes.length,
        message: `已规划 ${scenes.length} 个场景`,
      })

      return {
        ...inputData,
        scenes: scenes as z.infer<typeof ScenePlanSchema>[],
      }
    },
  })
}

function createWriteScenesStep(onProgress?: ProgressSink) {
  return createStep({
    id: 'write-scenes',
    description: 'scene-writer：逐场景撰写正文',
    inputSchema: PlanOutputSchema,
    outputSchema: WriteOutputSchema,
    execute: async ({ inputData }) => {
      const { context, contextManager } = await loadProjectContext(
        inputData.projectId,
        inputData.chapterNumber
      )

      const scenes = inputData.scenes as ScenePlan[]
      const generatedScenes: string[] = []
      const targetWordsPerScene = Math.floor(
        inputData.targetWords / Math.max(scenes.length, 1)
      )

      for (let i = 0; i < scenes.length; i++) {
        const sceneContent = await generateScene(contextManager, {
          scene: scenes[i],
          sceneIndex: i,
          totalScenes: scenes.length,
          chapterNumber: inputData.chapterNumber,
          chapterTitle: inputData.chapterTitle,
          previousContent: generatedScenes.join('\n\n'),
          context,
          targetWords: targetWordsPerScene,
          model: inputData.model,
          outlineIntent: inputData.outlineIntent as OutlineIntent,
        })

        generatedScenes.push(sceneContent)
        onProgress?.({
          stage: 'write',
          content: sceneContent,
          sceneIndex: i,
          totalScenes: scenes.length,
          message: `场景 ${i + 1}/${scenes.length} 完成`,
        })
      }

      return {
        ...inputData,
        draftContent: generatedScenes.join('\n\n'),
        totalScenes: scenes.length,
      }
    },
  })
}

function createRefineChapterStep(onProgress?: ProgressSink) {
  return createStep({
    id: 'refine-chapter',
    description: 'chapter-editor：反思润色并记录生成历史',
    inputSchema: WriteOutputSchema,
    outputSchema: ChapterWorkflowOutputSchema,
    execute: async ({ inputData }) => {
      onProgress?.({ stage: 'refine', message: '正在润色章节…' })

      const startTime = Date.now()
      const ai = await getAIProviderAsync(inputData.model)
      const { context, contextManager } = await loadProjectContext(
        inputData.projectId,
        inputData.chapterNumber
      )

      const refinedContent = await reflectAndRefine(contextManager, {
        content: inputData.draftContent,
        chapterOutline: inputData.chapterOutline,
        context,
        model: inputData.model,
        outlineIntent: inputData.outlineIntent as OutlineIntent,
      })

      const prompt = await renderAgentSlot('chapter-writer', 'user', {
        chapterNumber: inputData.chapterNumber,
        chapterTitle: inputData.chapterTitle,
        chapterOutline: inputData.chapterOutline,
        characters: JSON.stringify(context.characters),
        worldSettings: JSON.stringify(context.worldElements),
        previousSummary: context.chapterSummaries.map((s) => s.summary).join('\n'),
        targetWords: inputData.targetWords,
        pov: context.metadata?.pov || '第三人称',
      })

      const generation = await recordGeneration(ai, {
        projectId: inputData.projectId,
        type: 'chapter',
        model: inputData.model,
        prompt,
        systemPrompt: contextManager.formatContextForPrompt(context),
        output: refinedContent,
        duration: Date.now() - startTime,
      })

      onProgress?.({ stage: 'done', message: '章节生成完成' })

      return {
        content: refinedContent,
        totalScenes: inputData.totalScenes,
        generationId: generation?.id,
      }
    },
  })
}

// ============ Workflow factory ============

/**
 * 创建章节生成 workflow
 * 每次运行应新建实例，以便注入当次 onProgress
 */
export function createChapterGenerationWorkflow(onProgress?: ProgressSink) {
  const planScenes = createPlanScenesStep(onProgress)
  const writeScenes = createWriteScenesStep(onProgress)
  const refineChapter = createRefineChapterStep(onProgress)

  return createWorkflow({
    id: 'chapter-generation',
    description: '规划场景 → 分场景写作 → 反思润色',
    inputSchema: ChapterWorkflowInputSchema,
    outputSchema: ChapterWorkflowOutputSchema,
  })
    .then(planScenes)
    .then(writeScenes)
    .then(refineChapter)
    .commit()
}

/**
 * 运行章节生成 workflow（推荐业务入口）
 * @throws status 非 success
 */
export async function runChapterGenerationWorkflow(
  input: ChapterWorkflowInput,
  onProgress?: ProgressSink
): Promise<ChapterWorkflowOutput> {
  const workflow = createChapterGenerationWorkflow(onProgress)
  const run = await workflow.createRun()
  const result = await run.start({ inputData: input })

  if (result.status !== 'success') {
    const errMsg =
      result.status === 'failed'
        ? result.error?.message || '章节生成 workflow 失败'
        : `章节生成 workflow 异常状态: ${result.status}`
    throw new Error(errMsg)
  }

  return result.result as ChapterWorkflowOutput
}

/** 预构建图（无进度回调），仅用于调试 serializedStepGraph 等 */
export const chapterGenerationWorkflow = createChapterGenerationWorkflow()
