/**
 * Onboarding Bootstrap Workflow（Mastra）
 *
 * ## 步骤（生成）
 * 1. architecture   — 故事架构
 * 2. characters     — 角色群像
 * 3. world          — 世界观
 * 4. chapters       — **全书总纲 + 前 3 章细纲**（不全量逐章）
 * 5. foreshadowings — 伏笔（埋设优先开篇，长线可指向全书）
 * 6. styleAnchor    — 风格锚点样章
 * 7. validation     — 本地质量校验
 *
 * HTTP `/api/onboarding/bootstrap` 在 workflow 之后还有 writing / done（写库）。
 *
 * ## 入口
 * {@link runBootstrapWorkflow} ← {@link runBootstrapPipeline}
 */

import { createStep, createWorkflow } from '@mastra/core/workflows'
import { z } from 'zod'
import { calculateChapterCount, calculateVolumeSplit } from '@/lib/ai/onboarding/normalize'
import {
  buildArchitecturePrompt,
  buildCharactersPrompt,
  buildWorldPrompt,
  buildChaptersPrompt,
  buildForeshadowingsPrompt,
  buildStyleAnchorPrompt,
} from '@/lib/ai/onboarding/prompts'
import {
  generateArchitecture,
  generateCharacters,
  generateWorldElements,
  generateChapters,
  generateForeshadowings,
  generateStyleAnchorText,
} from '@/lib/ai/onboarding/generators'
import { validatePipelineResult } from '@/lib/ai/onboarding/validator'
import type {
  BootstrapParams,
  PipelineProgressEvent,
  PipelineResult,
  ChapterCalculation,
} from '@/lib/ai/onboarding/types'

/** 进度回调（与旧 pipeline SSE 事件兼容） */
type ProgressCallback = (event: PipelineProgressEvent) => void

/**
 * 透传 state：用 loose object 承载中间结果
 * WHY：各步结构复杂且随版本演进，过深 zod 会拖垮编排迭代速度
 */
const BootstrapStateSchema = z.object({
  // —— 输入 ——
  projectTitle: z.string(),
  targetWords: z.number(),
  pace: z.enum(['fast', 'medium', 'slow']),
  audience: z.string().optional(),
  tone: z.string().optional(),
  pov: z.string().optional(),
  model: z.string().optional(),
  idea: z.any(),
  // —— 中间产物 ——
  architecture: z.any().optional(),
  characters: z.any().optional(),
  worldSettings: z.any().optional(),
  chapters: z.any().optional(),
  foreshadowings: z.any().optional(),
  styleAnchor: z.any().optional(),
  chapterCount: z.number().optional(),
  calc: z.any().optional(),
  volumeSplit: z.any().optional(),
  validation: z.any().optional(),
})

const BootstrapOutputSchema = z.object({
  architecture: z.any(),
  characters: z.any(),
  worldSettings: z.any(),
  chapters: z.any(),
  foreshadowings: z.any(),
  styleAnchor: z.any(),
  validation: z.any().optional(),
})

/** state → 各 build*Prompt / generators 需要的 BootstrapParams */
function asParams(state: z.infer<typeof BootstrapStateSchema>): BootstrapParams {
  return {
    projectTitle: state.projectTitle,
    idea: state.idea,
    targetWords: state.targetWords,
    pace: state.pace,
    audience: state.audience,
    tone: state.tone,
    pov: state.pov as BootstrapParams['pov'],
    model: state.model,
  }
}

/** 构建七步定义（含校验）；onProgress 闭包注入 */
function createBootstrapSteps(onProgress?: ProgressCallback) {
  const stepArchitecture = createStep({
    id: 'onboarding-architecture',
    description: '生成故事架构',
    inputSchema: BootstrapStateSchema,
    outputSchema: BootstrapStateSchema,
    execute: async ({ inputData }) => {
      onProgress?.({
        type: 'start',
        step: 'architecture',
        progress: 5,
        message: '正在构建故事架构...',
      })

      const params = asParams(inputData)
      const calc = calculateChapterCount(params.targetWords, params.pace)
      const volumeSplit = calculateVolumeSplit(calc.chapterCount, calc.volumeCount)
      const archPrompt = buildArchitecturePrompt(params.idea, params, calc)
      const archResult = await generateArchitecture(archPrompt, params.model)

      const chapterCount = archResult.architecture.suggestedTotalWords
        ? calculateChapterCount(archResult.architecture.suggestedTotalWords, params.pace)
            .chapterCount
        : calc.chapterCount

      onProgress?.({
        type: 'step_complete',
        step: 'architecture',
        progress: 20,
        message: '故事架构完成',
        summary: {
          storySummary: archResult.architecture.storySummary.slice(0, 200) + '...',
          chapterCount,
          volumeCount: archResult.architecture.volumePlan.length,
          mainConflict: archResult.architecture.mainConflict,
        },
      })

      return {
        ...inputData,
        architecture: archResult.architecture,
        chapterCount,
        calc,
        volumeSplit,
      }
    },
  })

  const stepCharacters = createStep({
    id: 'onboarding-characters',
    description: '生成角色群像',
    inputSchema: BootstrapStateSchema,
    outputSchema: BootstrapStateSchema,
    execute: async ({ inputData }) => {
      onProgress?.({
        type: 'start',
        step: 'characters',
        progress: 25,
        message: '正在生成角色群像...',
      })

      const params = asParams(inputData)
      const charPrompt = buildCharactersPrompt(
        params.idea,
        inputData.architecture,
        params
      )
      const charResult = await generateCharacters(charPrompt, params.model)

      onProgress?.({
        type: 'step_complete',
        step: 'characters',
        progress: 40,
        message: `已生成 ${charResult.characters.characters.length} 个角色`,
        summary: {
          count: charResult.characters.characters.length,
          names: charResult.characters.characters.map((c: { name: string }) => c.name),
        },
      })

      return {
        ...inputData,
        characters: charResult.characters,
      }
    },
  })

  const stepWorld = createStep({
    id: 'onboarding-world',
    description: '生成世界观',
    inputSchema: BootstrapStateSchema,
    outputSchema: BootstrapStateSchema,
    execute: async ({ inputData }) => {
      onProgress?.({
        type: 'start',
        step: 'world',
        progress: 45,
        message: '正在构建世界观体系...',
      })

      const params = asParams(inputData)
      const worldPrompt = buildWorldPrompt(
        params.idea,
        inputData.architecture,
        inputData.characters.characters.map((c: { name: string; description: string }) => ({
          name: c.name,
          description: c.description,
        })),
        params
      )
      const worldResult = await generateWorldElements(worldPrompt, params.model)

      onProgress?.({
        type: 'step_complete',
        step: 'world',
        progress: 55,
        message: `已生成 ${worldResult.worldSettings.worldSettings.length} 个世界元素`,
        summary: {
          count: worldResult.worldSettings.worldSettings.length,
          names: worldResult.worldSettings.worldSettings.map((w: { name: string }) => w.name),
        },
      })

      return {
        ...inputData,
        worldSettings: worldResult.worldSettings,
      }
    },
  })

  const stepChapters = createStep({
    id: 'onboarding-chapters',
    description: '生成全书总纲 + 前三章细纲',
    inputSchema: BootstrapStateSchema,
    outputSchema: BootstrapStateSchema,
    execute: async ({ inputData }) => {
      const chapterCount = inputData.chapterCount as number
      const calc = inputData.calc as ChapterCalculation
      const volumeSplit = inputData.volumeSplit as {
        volumeNumber: number
        chapterStart: number
        chapterEnd: number
      }[]
      const detailedCount = Math.min(3, chapterCount)

      onProgress?.({
        type: 'start',
        step: 'chapters',
        progress: 60,
        message: `正在生成全书总纲与前 ${detailedCount} 章细纲（全书计划 ${chapterCount} 章）...`,
      })

      const params = asParams(inputData)
      const architectureWithVolumes = {
        ...inputData.architecture,
        volumePlan:
          inputData.architecture.volumePlan?.length > 0
            ? inputData.architecture.volumePlan
            : volumeSplit.map((v) => ({
                volumeNumber: v.volumeNumber,
                title: `第${v.volumeNumber}卷`,
                description: '',
                chapterRange: [v.chapterStart, v.chapterEnd] as [number, number],
              })),
      }

      const chaptersCalc: ChapterCalculation = {
        ...calc,
        chapterCount,
      }

      const chaptersPrompt = buildChaptersPrompt(
        params.idea,
        architectureWithVolumes,
        inputData.characters.characters.map((c: { name: string; role: string }) => ({
          name: c.name,
          role: c.role,
        })),
        inputData.worldSettings.worldSettings.map((w: { name: string; type: string }) => ({
          name: w.name,
          type: w.type,
        })),
        params,
        chaptersCalc
      )
      const chaptersResult = await generateChapters(chaptersPrompt, params.model)

      // 规范化：保证 plannedTotalChapters，chapters 仅保留开篇细纲
      const outline = chaptersResult.chapters
      const normalizedChapters = {
        ...outline,
        plannedTotalChapters: outline.plannedTotalChapters || chapterCount,
        overallOutline: outline.overallOutline || outline.tensionArcSummary || '',
        chapters: (outline.chapters || [])
          .filter((c: { chapterNumber?: number }) => (c.chapterNumber || 0) <= detailedCount)
          .slice(0, detailedCount),
      }

      onProgress?.({
        type: 'step_complete',
        step: 'chapters',
        progress: 75,
        message: `已生成全书总纲 + 前 ${normalizedChapters.chapters.length} 章细纲（全书计划 ${normalizedChapters.plannedTotalChapters} 章）`,
        summary: {
          detailedChapters: normalizedChapters.chapters.length,
          plannedTotalChapters: normalizedChapters.plannedTotalChapters,
          hasOverallOutline: Boolean(normalizedChapters.overallOutline),
          tensionArc: normalizedChapters.tensionArcSummary || '',
        },
      })

      return {
        ...inputData,
        chapters: normalizedChapters,
      }
    },
  })

  const stepForeshadowings = createStep({
    id: 'onboarding-foreshadowings',
    description: '生成伏笔网络',
    inputSchema: BootstrapStateSchema,
    outputSchema: BootstrapStateSchema,
    execute: async ({ inputData }) => {
      onProgress?.({
        type: 'start',
        step: 'foreshadowings',
        progress: 80,
        message: '正在设计伏笔网络...',
      })

      const params = asParams(inputData)
      const foreshadowingPrompt = buildForeshadowingsPrompt(
        inputData.chapters.chapters,
        inputData.characters.characters.map((c: { name: string }) => ({ name: c.name })),
        inputData.worldSettings.worldSettings.map((w: { name: string }) => ({ name: w.name })),
        params,
        {
          plannedTotalChapters: inputData.chapters.plannedTotalChapters,
          overallOutline: inputData.chapters.overallOutline,
        }
      )
      const foreshadowingResult = await generateForeshadowings(
        foreshadowingPrompt,
        params.model
      )

      onProgress?.({
        type: 'step_complete',
        step: 'foreshadowings',
        progress: 85,
        message: `已设计 ${foreshadowingResult.foreshadowings.foreshadowings.length} 个伏笔`,
        summary: {
          count: foreshadowingResult.foreshadowings.foreshadowings.length,
        },
      })

      return {
        ...inputData,
        foreshadowings: foreshadowingResult.foreshadowings,
      }
    },
  })

  const stepStyleAnchor = createStep({
    id: 'onboarding-style-anchor',
    description: '生成风格锚点样章',
    inputSchema: BootstrapStateSchema,
    outputSchema: BootstrapStateSchema,
    execute: async ({ inputData }) => {
      onProgress?.({
        type: 'start',
        step: 'styleAnchor',
        progress: 90,
        message: '正在生成写作风格锚点...',
      })

      const params = asParams(inputData)
      const styleAnchorPrompt = buildStyleAnchorPrompt(
        params.idea,
        inputData.architecture.storySummary,
        params
      )
      const styleAnchorResult = await generateStyleAnchorText(styleAnchorPrompt, params.model)

      onProgress?.({
        type: 'step_complete',
        step: 'styleAnchor',
        progress: 95,
        message: `风格锚点已生成（${styleAnchorResult.styleAnchor.wordCount} 字）`,
      })

      return {
        ...inputData,
        styleAnchor: styleAnchorResult.styleAnchor,
      }
    },
  })

  const stepValidate = createStep({
    id: 'onboarding-validate',
    description: '校验管线结果',
    inputSchema: BootstrapStateSchema,
    outputSchema: BootstrapOutputSchema,
    execute: async ({ inputData }) => {
      onProgress?.({
        type: 'validation',
        step: 'validation',
        progress: 96,
        message: '正在验证生成结果...',
      })

      const pipelineResult: PipelineResult = {
        architecture: inputData.architecture,
        characters: inputData.characters,
        worldSettings: inputData.worldSettings,
        chapters: inputData.chapters,
        foreshadowings: inputData.foreshadowings,
        styleAnchor: inputData.styleAnchor,
      }

      const validation = validatePipelineResult(pipelineResult)

      onProgress?.({
        type: 'step_complete',
        step: 'validation',
        progress: 98,
        message: validation.passed
          ? '校验通过'
          : `校验完成：${validation.errors.length} 个错误，${validation.warnings.length} 个警告`,
        data: {
          errors: validation.errors,
          warnings: validation.warnings,
          passed: validation.passed,
        },
      })

      return {
        architecture: inputData.architecture,
        characters: inputData.characters,
        worldSettings: inputData.worldSettings,
        chapters: inputData.chapters,
        foreshadowings: inputData.foreshadowings,
        styleAnchor: inputData.styleAnchor,
        validation,
      }
    },
  })

  return {
    stepArchitecture,
    stepCharacters,
    stepWorld,
    stepChapters,
    stepForeshadowings,
    stepStyleAnchor,
    stepValidate,
  }
}

/**
 * 创建 Bootstrap workflow 实例
 * 每次运行应新建，以便注入当次 onProgress
 */
export function createBootstrapWorkflow(onProgress?: ProgressCallback) {
  const steps = createBootstrapSteps(onProgress)

  return createWorkflow({
    id: 'onboarding-bootstrap',
    description:
      '项目引导 Bootstrap：架构→角色→世界→(总纲+前三章)→伏笔→风格锚点→校验',
    inputSchema: BootstrapStateSchema,
    outputSchema: BootstrapOutputSchema,
  })
    .then(steps.stepArchitecture)
    .then(steps.stepCharacters)
    .then(steps.stepWorld)
    .then(steps.stepChapters)
    .then(steps.stepForeshadowings)
    .then(steps.stepStyleAnchor)
    .then(steps.stepValidate)
    .commit()
}

/**
 * 运行 Bootstrap workflow（推荐业务入口）
 * @returns 未落库的 PipelineResult；写库由 API route 负责
 * @throws status 非 success
 */
export async function runBootstrapWorkflow(
  params: BootstrapParams,
  onProgress: ProgressCallback
): Promise<PipelineResult> {
  const workflow = createBootstrapWorkflow(onProgress)
  const run = await workflow.createRun()

  const result = await run.start({
    inputData: {
      projectTitle: params.projectTitle,
      targetWords: params.targetWords,
      pace: params.pace,
      audience: params.audience,
      tone: params.tone,
      pov: params.pov,
      model: params.model,
      idea: params.idea,
    },
  })

  if (result.status !== 'success') {
    const errMsg =
      result.status === 'failed'
        ? result.error?.message || 'Bootstrap workflow 失败'
        : `Bootstrap workflow 异常状态: ${result.status}`
    throw new Error(errMsg)
  }

  const output = result.result as z.infer<typeof BootstrapOutputSchema>
  return {
    architecture: output.architecture,
    characters: output.characters,
    worldSettings: output.worldSettings,
    chapters: output.chapters,
    foreshadowings: output.foreshadowings,
    styleAnchor: output.styleAnchor,
  }
}
