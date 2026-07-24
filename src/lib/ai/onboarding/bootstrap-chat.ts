/**
 * Bootstrap 对话式步骤：Agent 映射、首轮任务文案、结构化提取 schema 说明
 */

import type { StepKey } from '@/components/onboarding/step3/types'
import type { StoryIdeaCard } from '@/types'
import { calculateChapterCount } from '@/lib/ai/onboarding/normalize'
import {
  buildArchitecturePrompt,
  buildCharactersPrompt,
  buildChaptersPrompt,
  buildForeshadowingsPrompt,
  buildStyleAnchorPrompt,
  buildWorldPrompt,
  BOOTSTRAP_DETAILED_CHAPTER_COUNT,
} from '@/lib/ai/onboarding/prompts'
import type { BootstrapParams } from '@/lib/ai/onboarding/types'

/** 引导步骤统一使用 onboarding agent（system slot 由 STEP_SYSTEM_SLOT 指定） */
export const ONBOARDING_AGENT_ID = 'onboarding' as const

export const STEP_SYSTEM_SLOT: Record<StepKey, string> = {
  architecture: 'system.architecture',
  characters: 'system.characters',
  world: 'system.world',
  volume: 'system.chapters',
  foreshadowings: 'system.foreshadowings',
  styleAnchor: 'system.style-anchor',
}

/** 对话 / extract 使用的 agentId（均为 onboarding；兼容旧调用名） */
export const STEP_AGENT_ID: Record<StepKey, string> = {
  architecture: 'onboarding',
  characters: 'onboarding',
  world: 'onboarding',
  volume: 'onboarding',
  foreshadowings: 'onboarding',
  styleAnchor: 'onboarding',
}

export const STEP_WELCOME: Record<StepKey, { title: string; subtitle: string }> = {
  architecture: {
    title: '和故事架构师对话',
    subtitle: '先对齐梗概与冲突，再补三幕与分卷。聊完后点右侧「整理并确认」。',
  },
  characters: {
    title: '和角色群像师对话',
    subtitle: '先定核心角色骨架，再展开弧光与关系。',
  },
  world: {
    title: '和世界观架构师对话',
    subtitle: '先定核心规则与势力，再补细节与约束。',
  },
  volume: {
    title: '和大纲设计师对话',
    subtitle: '先定全书总纲节奏，再细化前 3 章。',
  },
  foreshadowings: {
    title: '和伏笔策划对话',
    subtitle: '短线与长线搭配，埋设点优先落在开篇章。',
  },
  styleAnchor: {
    title: '和样章写手对话',
    subtitle: '先确认文风，再写一段可作锚点的样章正文。',
  },
}

export interface BootstrapChatContext {
  idea: StoryIdeaCard
  projectTitle: string
  targetWords: number
  pace: 'fast' | 'medium' | 'slow'
  audience?: string
  tone?: string
  pov?: 'first_person' | 'third_person' | 'multiple_pov'
  /** 已确认步骤的摘要/数据，注入 system */
  priorSummary?: string
  /** 完整任务说明（由 build*Prompt 生成），对话首轮使用 */
  taskBrief?: string
}

/** 将步骤上下文压成 system 附加段（对话用，非巨型 JSON 任务） */
export function buildOnboardingChatContextAppend(
  stepKey: StepKey,
  ctx: BootstrapChatContext
): string {
  const idea = ctx.idea
  const lines = [
    '【当前引导步骤】' + STEP_WELCOME[stepKey].title,
    `【项目】《${ctx.projectTitle}》`,
    `【题材】${idea.genre || '未指定'}`,
    `【高概念】${idea.highConcept || ''}`,
    idea.protagonist ? `【主角设定】${idea.protagonist}` : '',
    idea.coreConflict ? `【核心冲突草稿】${idea.coreConflict}` : '',
    idea.openingHook ? `【开篇钩子】${idea.openingHook}` : '',
    idea.sublimation ? `【主题升华】${idea.sublimation}` : '',
    `【目标字数】${ctx.targetWords.toLocaleString()} · 节奏 ${ctx.pace}`,
    ctx.tone ? `【基调】${ctx.tone}` : '',
    ctx.audience ? `【受众】${ctx.audience}` : '',
    ctx.pov ? `【人称】${ctx.pov}` : '',
    ctx.priorSummary ? `\n【已确认的前置结果】\n${ctx.priorSummary}` : '',
    '\n请用中文与用户协作；先给可讨论的草稿，不要一次输出巨型 JSON。用户准备落库时会有单独的结构化提取步骤。',
  ]
  return lines.filter(Boolean).join('\n')
}

/** 构建首轮自动发送的用户消息（偏轻量引导，完整 schema 仍用于 extract） */
export function buildStepOpeningMessage(
  stepKey: StepKey,
  ctx: BootstrapChatContext
): string {
  const idea = ctx.idea
  const base = `项目《${ctx.projectTitle}》｜题材：${idea.genre}｜高概念：${idea.highConcept}`

  switch (stepKey) {
    case 'architecture':
      return `${base}

请先给一版**轻量架构草稿**（不要 JSON）：
1. 故事梗概 150–250 字（开篇到结局）
2. 核心内外冲突各 1–2 句
3. 三幕各用一句话概括
4. 建议分几卷、每卷一句话目标

主角/冲突参考：${idea.protagonist}；${idea.coreConflict}
开篇钩子：${idea.openingHook || '未指定'}
主题：${idea.sublimation || '未指定'}
目标约 ${ctx.targetWords.toLocaleString()} 字，节奏 ${ctx.pace}。`

    case 'characters':
      return `${base}

基于已确认架构，请先列出 **5–7 个核心角色**（不要 JSON）：
每条：姓名｜定位（主角/反派/配角）｜一句话人设｜与主角关系。
主角设定参考：${idea.protagonist}
确认骨架后再展开弧光与对话风格。`

    case 'world':
      return `${base}

基于已确认架构与角色，请先给 **4–6 个核心世界观元素**（不要 JSON）：
每条：名称｜类型｜一句核心规则/作用｜服务哪条冲突。
需要力量体系时优先讲清代价与上限。`

    case 'volume':
      return `${base}

Bootstrap 精简模式：请先给**全书阶段级总纲**（400 字内），并规划**前 ${BOOTSTRAP_DETAILED_CHAPTER_COUNT} 章**细纲骨架：
每章：标题草案｜本章功能｜1–2 个关键事件｜情绪目标。
不要写全书逐章。计划总章数请给出数字。`

    case 'foreshadowings':
      return `${base}

请先列 **5–8 条伏笔**（不要 JSON）：
标题｜短线/长线｜埋点（优先开篇章）｜预计回收阶段｜关联角色。
确认后再补描述细节。`

    case 'styleAnchor':
      return `${base}

请先用 3–5 句话描述你建议的文风（人称、节奏、描写密度、对话风格），
再写一段约 400–600 字的开篇样章草稿（可后续加长到 800–1200 字）。
基调：${ctx.tone || '未指定'}。`

    default:
      return base
  }
}

/** 提取步骤的 JSON schema 说明（给 extract agent 用） */
export function getExtractSchemaInstruction(stepKey: StepKey): string {
  switch (stepKey) {
    case 'architecture':
      return `输出纯 JSON 对象（不要 markdown），字段：
{
  "storySummary": "完整梗概",
  "mainConflict": "核心冲突",
  "suggestedTotalWords": number,
  "wordCountRationale": "篇幅说明",
  "actStructure": [{ "act": 1, "chapterRange": [1, N], "description": "", "emotionalArc": "" }],
  "volumePlan": [{ "volumeNumber": 1, "title": "", "description": "", "chapterRange": [1, N] }],
  "thematicThread": "主题线索"
}`
    case 'characters':
      return `输出纯 JSON：
{
  "characters": [
    {
      "name": "",
      "role": "protagonist|antagonist|supporting|minor 或中文定位",
      "description": "",
      "personality": "" 或 [],
      "goal": "",
      "characterArc": "",
      "dialogueStyle": "",
      "relationships": [{ "targetName": "", "relation": "", "description": "" }],
      "firstAppearance": ""
    }
  ]
}
至少 5 个角色，主角与反派必须存在。`
    case 'world':
      return `输出纯 JSON：
{
  "worldSettings": [
    {
      "type": "location|history|magic|organization|item|other",
      "name": "",
      "description": "",
      "importance": 1-10,
      "scope": "global|regional|local",
      "category": "core_rule|detail|background",
      "constraints": [{ "description": "", "rule": "" }],
      "exceptions": [{ "condition": "", "description": "" }],
      "relatedTo": [],
      "isEvolvable": true,
      "evolutionSpace": ""
    }
  ]
}
至少 4 个元素，含不少于 1 个 core_rule。`
    case 'volume':
      return `输出纯 JSON：
{
  "overallOutline": "全书阶段级总纲",
  "plannedTotalChapters": number,
  "chapters": [
    {
      "chapterNumber": 1,
      "title": "",
      "summary": "",
      "emotionalGoal": "",
      "plotFunction": "推进|转折|铺垫|高潮|过渡",
      "tensionLevel": 1-10,
      "keyEvents": [],
      "characters": [],
      "estimatedWords": number,
      "act": 1,
      "causalFrom": "",
      "causalTo": ""
    }
  ],
  "suggestedTotalWords": number,
  "wordCountRationale": "",
  "tensionArcSummary": ""
}
chapters 必须恰好 ${BOOTSTRAP_DETAILED_CHAPTER_COUNT} 章（开篇细纲）。`
    case 'foreshadowings':
      return `输出纯 JSON：
{
  "foreshadowings": [
    {
      "title": "",
      "description": "",
      "type": "plot|character|world|mystery",
      "importance": 1-10,
      "plantedInChapterNumber": number,
      "expectedChapterNumber": number,
      "relatedCharacters": [],
      "relatedElements": []
    }
  ]
}
至少 4 条，planted < expected。`
    case 'styleAnchor':
      return `不要 JSON。直接输出样章正文（800-1200 字），不要标题或说明。`
    default:
      return '输出与步骤匹配的结构化结果。'
  }
}

/** 服务端：用完整 build*Prompt 作为 extract 的 schema+任务参考 */
export function buildExtractTaskBody(
  stepKey: StepKey,
  ctx: BootstrapChatContext & {
    architecture?: any
    characters?: any[]
    worldSettings?: any[]
    chapters?: any[]
  }
): string {
  const params: BootstrapParams = {
    projectTitle: ctx.projectTitle,
    idea: ctx.idea,
    targetWords: ctx.targetWords,
    pace: ctx.pace,
    audience: ctx.audience,
    tone: ctx.tone,
    pov: ctx.pov,
  }
  const calc = calculateChapterCount(ctx.targetWords, ctx.pace)

  switch (stepKey) {
    case 'architecture':
      return buildArchitecturePrompt(ctx.idea, params, calc)
    case 'characters':
      return buildCharactersPrompt(
        ctx.idea,
        {
          storySummary: ctx.architecture?.storySummary || '',
          mainConflict: ctx.architecture?.mainConflict || '',
          thematicThread: ctx.architecture?.thematicThread || '',
        },
        params
      )
    case 'world':
      return buildWorldPrompt(
        ctx.idea,
        {
          storySummary: ctx.architecture?.storySummary || '',
          mainConflict: ctx.architecture?.mainConflict || '',
        },
        (ctx.characters || []).map((c: any) => ({
          name: c.name,
          description: c.description || '',
        })),
        params
      )
    case 'volume':
      return buildChaptersPrompt(
        ctx.idea,
        {
          storySummary: ctx.architecture?.storySummary || '',
          actStructure: ctx.architecture?.actStructure || [],
          volumePlan: ctx.architecture?.volumePlan || [],
          thematicThread: ctx.architecture?.thematicThread || '',
        },
        (ctx.characters || []).map((c: any) => ({
          name: c.name,
          role: c.role || '',
        })),
        (ctx.worldSettings || []).map((w: any) => ({
          name: w.name,
          type: w.type || '',
        })),
        params,
        calc
      )
    case 'foreshadowings':
      return buildForeshadowingsPrompt(
        (ctx.chapters || []).map((c: any) => ({
          chapterNumber: c.chapterNumber,
          title: c.title,
          summary: c.summary || '',
        })),
        (ctx.characters || []).map((c: any) => ({ name: c.name })),
        (ctx.worldSettings || []).map((w: any) => ({ name: w.name })),
        params,
        {
          plannedTotalChapters:
            (ctx as any).plannedTotalChapters || calc.chapterCount,
          overallOutline: (ctx as any).overallOutline || '',
        }
      )
    case 'styleAnchor':
      return buildStyleAnchorPrompt(
        ctx.idea,
        ctx.architecture?.storySummary || ctx.idea.highConcept || '',
        params
      )
    default:
      return ''
  }
}
