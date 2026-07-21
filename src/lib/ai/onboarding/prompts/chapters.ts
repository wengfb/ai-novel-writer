import type { StoryIdeaCard } from '@/types'
import type { BootstrapParams, ChapterCalculation } from '../types'
import {
  PACE_LABELS,
  audienceContext,
  povContext,
  JSON_FORMAT_REQUIREMENT,
} from './helpers'

/** Bootstrap 阶段只细化的开篇章数 */
export const BOOTSTRAP_DETAILED_CHAPTER_COUNT = 3

/**
 * 构建章节大纲提示词
 * Bootstrap 策略：全书总纲 + 前 3 章细纲（避免一次生成数十章导致超时）
 */
export function buildChaptersPrompt(
  idea: StoryIdeaCard,
  architecture: {
    storySummary: string
    actStructure: { act: number; chapterRange: [number, number]; description: string; emotionalArc: string }[]
    volumePlan: { volumeNumber: number; title: string; description: string; chapterRange: [number, number] }[]
    thematicThread: string
  },
  characters: { name: string; role: string }[],
  worldSettings: { name: string; type: string }[],
  params: BootstrapParams,
  calc: ChapterCalculation
): string {
  const charNames = characters.map((c) => c.name).join('、')
  const worldNames = worldSettings.map((w) => w.name).join('、')
  const detailedCount = Math.min(BOOTSTRAP_DETAILED_CHAPTER_COUNT, calc.chapterCount)

  const actDescriptions = architecture.actStructure
    .map(
      (a) =>
        `第${a.act}幕（第${a.chapterRange[0]}-${a.chapterRange[1]}章）：${a.description}\n  情感弧线：${a.emotionalArc}`
    )
    .join('\n')

  const volumeDescriptions = architecture.volumePlan
    .map(
      (v) =>
        `第${v.volumeNumber}卷"${v.title}"（第${v.chapterRange[0]}-${v.chapterRange[1]}章）：${v.description}`
    )
    .join('\n')

  // 角色身份由 onboarding-chapters Agent 的 system 槽位提供
  return `请基于以下完整的项目设定，输出「全书总纲 + 开篇细纲」。

【故事概要】
${architecture.storySummary}

【幕结构】
${actDescriptions}

【分卷方案】
${volumeDescriptions}

【主题线索】
${architecture.thematicThread}

【角色列表】
${charNames}

【世界观元素列表】
${worldNames}

【创作参数】
- 目标总字数：${params.targetWords.toLocaleString()} 字
- 全书计划章节数：${calc.chapterCount} 章（后续可再细化）
- 每章平均字数：${calc.avgChapterWords} 字
- 叙事节奏：${PACE_LABELS[params.pace]}${audienceContext(params.audience)}${povContext(params.pov)}
- 本次只需细化前 ${detailedCount} 章细纲，不要输出第 ${detailedCount + 1} 章及之后的逐章细纲

【任务要求】

## A. 全书总纲（overallOutline）
用 400-800 字写清全书节奏与阶段划分（按卷或按幕均可），至少覆盖：
1. 开篇 1-${detailedCount} 章要完成的钩子与建置
2. 中段主要升级线与关键转折（点到为止，不必逐章）
3. 后段高潮与收束方向
4. 主线因果与主题「${idea.sublimation || architecture.thematicThread}」如何贯穿

## B. 前 ${detailedCount} 章细纲（chapters 数组，长度必须为 ${detailedCount}）
每一章必须包含：
1. **章节标题**：title（有吸引力，不能是"第X章"）
2. **章节摘要**：summary（80-150字，写清本章关键事件）
3. **情感目标**：emotionalGoal
4. **情节功能**：plotFunction（只能是：推进、转折、铺垫、高潮、过渡 之一）
5. **张力等级**：tensionLevel（1-10）
6. **关键事件**：keyEvents（2-4 个具体事件）
7. **涉及角色**：characters（真实角色名）
8. **预估字数**：estimatedWords
9. **所属幕**：act（1/2/3）
10. **因果链**：causalFrom、causalTo

开篇细纲要求：
- 第 1 章必须落实开篇切入点：「${idea.openingHook}」
- 前 ${detailedCount} 章要完成世界观/主角处境的最小可读闭环，并抛出持续阅读的钩子
- 第 ${detailedCount} 章的 causalTo 要能自然接向总纲中的中段发展
- 前 ${detailedCount} 章张力整体偏低到中等（约 4-7），为后文留空间

请输出以下 JSON：
{
  "overallOutline": "全书总纲（400-800字，阶段级，不要逐章罗列全部章节）",
  "plannedTotalChapters": ${calc.chapterCount},
  "chapters": [
    {
      "chapterNumber": 1,
      "title": "章节标题（有吸引力）",
      "summary": "章节摘要（80-150字）",
      "emotionalGoal": "情感目标",
      "plotFunction": "推进/转折/铺垫/高潮/过渡",
      "tensionLevel": 5,
      "keyEvents": ["关键事件1", "关键事件2"],
      "characters": ["角色1", "角色2"],
      "estimatedWords": ${calc.avgChapterWords},
      "act": 1,
      "causalFrom": "前因（第一章可写'故事开端'）",
      "causalTo": "后果"
    }
  ],
  "suggestedTotalWords": ${params.targetWords},
  "wordCountRationale": "篇幅分配说明（全书尺度 + 开篇三章为何如此安排）",
  "tensionArcSummary": "全书张力曲线概述（开篇/中段/高潮大致落点，不必列出每一章）"
}

要求：
- chapters 数组长度必须恰好为 ${detailedCount}，chapterNumber 为 1..${detailedCount}
- plannedTotalChapters 必须等于 ${calc.chapterCount}
- overallOutline 必须是阶段总纲，禁止把全书每一章都写成细纲
- 不要生成第 ${detailedCount + 1} 章及之后的细纲条目
- 章节标题要有特色；keyEvents 要具体${JSON_FORMAT_REQUIREMENT}`
}
