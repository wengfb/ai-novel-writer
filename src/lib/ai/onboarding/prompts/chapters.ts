import type { StoryIdeaCard } from '@/types'
import type { BootstrapParams, ChapterCalculation } from '../types'
import {
  PACE_LABELS,
  audienceContext,
  povContext,
  JSON_FORMAT_REQUIREMENT,
} from './helpers'

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
  const charNames = characters.map(c => c.name).join('、')
  const worldNames = worldSettings.map(w => w.name).join('、')

  const actDescriptions = architecture.actStructure
    .map(a => `第${a.act}幕（第${a.chapterRange[0]}-${a.chapterRange[1]}章）：${a.description}\n  情感弧线：${a.emotionalArc}`)
    .join('\n')

  const volumeDescriptions = architecture.volumePlan
    .map(v => `第${v.volumeNumber}卷"${v.title}"（第${v.chapterRange[0]}-${v.chapterRange[1]}章）：${v.description}`)
    .join('\n')

  return `你是一位专业的小说大纲设计师。请基于以下完整的项目设定，生成 ${calc.chapterCount} 章的分章大纲。

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
- 计划章节数：${calc.chapterCount} 章
- 每章平均字数：${calc.avgChapterWords} 字
- 叙事节奏：${PACE_LABELS[params.pace]}${audienceContext(params.audience)}${povContext(params.pov)}

【任务要求】

为全部 ${calc.chapterCount} 章生成大纲，每章包含：

1. **章节标题**：title（要有吸引力，不能是"第X章"）
2. **章节摘要**：summary（80-150字，写清本章发生的关键事件）
3. **情感目标**：emotionalGoal（本章想让读者产生什么情感反应）
4. **情节功能**：plotFunction（只能是：推进、转折、铺垫、高潮、过渡 之一）
5. **张力等级**：tensionLevel（1-10，高潮章节 8-10，铺垫章节 3-5）
6. **关键事件**：keyEvents（2-4 个具体事件）
7. **涉及角色**：characters（从角色列表中选择，必须是真实角色名）
8. **预估字数**：estimatedWords
9. **所属幕**：act（1/2/3，按幕结构分配）
10. **因果链**：causalFrom（前一章的什么事件导致本章发生）、causalTo（本章的事件会引发什么后果）

【字数与张力分布要求】
- 高潮章节（tensionLevel 8-10）estimatedWords 应偏高（${Math.round(calc.avgChapterWords * 1.3)} 字左右）
- 过渡章节（plotFunction="过渡"）estimatedWords 可偏低（${Math.round(calc.avgChapterWords * 0.7)} 字左右）
- 所有章节的 estimatedWords 之和应接近 ${params.targetWords.toLocaleString()}
- 张力曲线应该呈现波浪式上升：有起有伏，但整体从低到高
- 每卷结尾应有一个小高潮（tensionLevel ≥ 8）
- 最后 3 章应是大高潮和收束

请输出以下 JSON：
{
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
  "wordCountRationale": "总体篇幅分配说明",
  "tensionArcSummary": "整体张力曲线描述（高潮点在哪几章，为什么这样安排）"
}

要求：
- 必须生成全部 ${calc.chapterCount} 章，不能少
- 章节标题必须有特色，不能是"新的征程"、"危机来临"这种空洞标题
- causalFrom/causalTo 必须形成完整的因果链：第N章的 causalTo 应大致对应第N+1章的 causalFrom
- keyEvents 要具体到发生了什么事，不能是"发生了一场战斗"这种模糊描述
- plotFunction 分布合理：高潮章节占 15%，转折占 20%，铺垫占 25%，推进占 30%，过渡占 10%
- 角色登场必须符合前面设定：如果某个角色在第一章还没出现，就不要写在 characters 中${JSON_FORMAT_REQUIREMENT}`
}
