import { calculateChapterCount, calculateVolumeSplit } from '@/lib/ai/onboarding-bootstrap'
import {
  buildArchitecturePrompt,
  buildCharactersPrompt,
  buildWorldPrompt,
  buildChaptersPrompt,
  buildForeshadowingsPrompt,
  buildStyleAnchorPrompt,
} from './prompts'
import {
  generateArchitecture,
  generateCharacters,
  generateWorldElements,
  generateChapters,
  generateForeshadowings,
  generateStyleAnchorText,
} from './generators'
import { validatePipelineResult } from './validator'
import type {
  BootstrapParams,
  PipelineResult,
  PipelineProgressEvent,
  ChapterCalculation,
} from './types'

// ============ 进度事件发送 ============

type ProgressCallback = (event: PipelineProgressEvent) => void

// ============ 管线编排 ============

/**
 * 运行 6 步 Bootstrap 管线
 * 按顺序执行：架构 → 角色 → 世界 → 章节 → 伏笔 → 风格锚点
 * 每步完成后通过回调发送进度事件
 */
export async function runBootstrapPipeline(
  params: BootstrapParams,
  onProgress: ProgressCallback
): Promise<PipelineResult> {
  const model = params.model
  const calc = calculateChapterCount(params.targetWords, params.pace)
  const volumeSplit = calculateVolumeSplit(calc.chapterCount, calc.volumeCount)

  // ======== Step 1: 故事架构 ========
  onProgress({
    type: 'start',
    step: 'architecture',
    progress: 5,
    message: '正在构建故事架构...',
  })

  const archPrompt = buildArchitecturePrompt(params.idea, params, calc)
  const archResult = await generateArchitecture(archPrompt, model)

  // 用 AI 返回的实际字数覆盖计算值
  const chapterCount = archResult.architecture.suggestedTotalWords
    ? calculateChapterCount(archResult.architecture.suggestedTotalWords, params.pace).chapterCount
    : calc.chapterCount

  onProgress({
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

  // ======== Step 2: 角色群像 ========
  onProgress({
    type: 'start',
    step: 'characters',
    progress: 25,
    message: '正在生成角色群像...',
  })

  const charPrompt = buildCharactersPrompt(params.idea, archResult.architecture, params)
  const charResult = await generateCharacters(charPrompt, model)

  onProgress({
    type: 'step_complete',
    step: 'characters',
    progress: 40,
    message: `已生成 ${charResult.characters.characters.length} 个角色`,
    summary: {
      count: charResult.characters.characters.length,
      names: charResult.characters.characters.map(c => c.name),
      roles: countRoles(charResult.characters.characters),
    },
  })

  // ======== Step 3: 世界观 ========
  onProgress({
    type: 'start',
    step: 'world',
    progress: 45,
    message: '正在构建世界观体系...',
  })

  const worldPrompt = buildWorldPrompt(
    params.idea,
    archResult.architecture,
    charResult.characters.characters.map(c => ({ name: c.name, description: c.description })),
    params
  )
  const worldResult = await generateWorldElements(worldPrompt, model)

  onProgress({
    type: 'step_complete',
    step: 'world',
    progress: 55,
    message: `已生成 ${worldResult.worldSettings.worldSettings.length} 个世界元素`,
    summary: {
      count: worldResult.worldSettings.worldSettings.length,
      names: worldResult.worldSettings.worldSettings.map(w => w.name),
      types: countWorldTypes(worldResult.worldSettings.worldSettings),
    },
  })

  // ======== Step 4: 分章大纲 ========
  onProgress({
    type: 'start',
    step: 'chapters',
    progress: 60,
    message: `正在规划 ${chapterCount} 章大纲...`,
  })

  // 用 AI 架构中的分卷方案，或回退到计算结果
  const architectureWithVolumes = {
    ...archResult.architecture,
    volumePlan: archResult.architecture.volumePlan.length > 0
      ? archResult.architecture.volumePlan
      : volumeSplit.map(v => ({
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
    charResult.characters.characters.map(c => ({ name: c.name, role: c.role })),
    worldResult.worldSettings.worldSettings.map(w => ({ name: w.name, type: w.type })),
    params,
    chaptersCalc
  )
  const chaptersResult = await generateChapters(chaptersPrompt, model)

  onProgress({
    type: 'step_complete',
    step: 'chapters',
    progress: 75,
    message: `已规划 ${chaptersResult.chapters.chapters.length} 章大纲`,
    summary: {
      chapters: chaptersResult.chapters.chapters.length,
      tensionArc: chaptersResult.chapters.tensionArcSummary || '',
      totalEstimatedWords: chaptersResult.chapters.chapters.reduce((s, c) => s + (c.estimatedWords || 0), 0),
    },
  })

  // ======== Step 5: 伏笔系统 ========
  onProgress({
    type: 'start',
    step: 'foreshadowings',
    progress: 80,
    message: '正在设计伏笔网络...',
  })

  const foreshadowingPrompt = buildForeshadowingsPrompt(
    chaptersResult.chapters.chapters,
    charResult.characters.characters.map(c => ({ name: c.name })),
    worldResult.worldSettings.worldSettings.map(w => ({ name: w.name })),
    params
  )
  const foreshadowingResult = await generateForeshadowings(foreshadowingPrompt, model)

  onProgress({
    type: 'step_complete',
    step: 'foreshadowings',
    progress: 85,
    message: `已设计 ${foreshadowingResult.foreshadowings.foreshadowings.length} 个伏笔`,
    summary: {
      count: foreshadowingResult.foreshadowings.foreshadowings.length,
      types: countForeshadowingTypes(foreshadowingResult.foreshadowings.foreshadowings),
    },
  })

  // ======== Step 6: 风格锚点 ========
  onProgress({
    type: 'start',
    step: 'styleAnchor',
    progress: 90,
    message: '正在生成写作风格锚点...',
  })

  const styleAnchorPrompt = buildStyleAnchorPrompt(
    params.idea,
    archResult.architecture.storySummary,
    params
  )
  const styleAnchorResult = await generateStyleAnchorText(styleAnchorPrompt, model)

  onProgress({
    type: 'step_complete',
    step: 'styleAnchor',
    progress: 95,
    message: `风格锚点已生成（${styleAnchorResult.styleAnchor.wordCount} 字）`,
  })

  // ======== 聚合结果 ========
  const pipelineResult: PipelineResult = {
    architecture: archResult.architecture,
    characters: charResult.characters,
    worldSettings: worldResult.worldSettings,
    chapters: chaptersResult.chapters,
    foreshadowings: foreshadowingResult.foreshadowings,
    styleAnchor: styleAnchorResult.styleAnchor,
  }

  // ======== 质量校验 ========
  onProgress({
    type: 'validation',
    step: 'validation',
    progress: 96,
    message: '正在验证生成结果...',
  })

  const validation = validatePipelineResult(pipelineResult)

  onProgress({
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

  return pipelineResult
}

// ============ 统计辅助函数 ============

function countRoles(characters: { role: string }[]): Record<string, number> {
  const counts: Record<string, number> = {}
  characters.forEach(c => {
    const role = c.role || '未知'
    counts[role] = (counts[role] || 0) + 1
  })
  return counts
}

function countWorldTypes(elements: { type: string }[]): Record<string, number> {
  const counts: Record<string, number> = {}
  elements.forEach(e => {
    const type = e.type || '其他'
    counts[type] = (counts[type] || 0) + 1
  })
  return counts
}

function countForeshadowingTypes(fs: { type: string }[]): Record<string, number> {
  const counts: Record<string, number> = {}
  fs.forEach(f => {
    const type = f.type || '未知'
    counts[type] = (counts[type] || 0) + 1
  })
  return counts
}
