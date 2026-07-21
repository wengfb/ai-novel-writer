import type { BootstrapParams } from '../types'
import { JSON_FORMAT_REQUIREMENT } from './helpers'
import { BOOTSTRAP_DETAILED_CHAPTER_COUNT } from './chapters'

/**
 * 构建伏笔规划提示词
 * Bootstrap 仅有前几章细纲 + 全书总纲时：埋设点优先落在已细化章节，回收点可指向全书后续章号
 */
export function buildForeshadowingsPrompt(
  chapters: { chapterNumber: number; title: string; summary: string }[],
  characters: { name: string }[],
  worldSettings: { name: string }[],
  _params: BootstrapParams,
  options?: {
    plannedTotalChapters?: number
    overallOutline?: string
  }
): string {
  const detailedCount = chapters.length || BOOTSTRAP_DETAILED_CHAPTER_COUNT
  const plannedTotal = Math.max(
    options?.plannedTotalChapters || detailedCount,
    detailedCount
  )

  const chapterList = chapters
    .map((c) => `第${c.chapterNumber}章《${c.title}》：${c.summary}`)
    .join('\n')

  const overall = options?.overallOutline?.trim()
    ? `\n【全书总纲（后续章节仅阶段级）】\n${options.overallOutline.trim()}\n`
    : ''

  const charNames = characters.map((c) => c.name).join('、')
  const worldNames = worldSettings.map((w) => w.name).join('、')

  // 角色身份由 onboarding-foreshadowings Agent 的 system 槽位提供
  return `请基于以下已细化的开篇大纲与全书总纲，设计伏笔网络。

【已细化开篇大纲（第 1-${detailedCount} 章）】
${chapterList}
${overall}
【角色列表】${charNames}
【世界观元素】${worldNames}

【规模】
- 已细化章数：${detailedCount}
- 全书计划总章数：${plannedTotal}

【任务要求】

请设计 **6-10 个伏笔**（Bootstrap 阶段，宁精勿滥），类型分布大致为：
- 剧情伏笔 (plot)：2-3 个
- 角色伏笔 (character)：2-3 个
- 世界伏笔 (world)：1-2 个
- 悬疑伏笔 (mystery)：1-2 个

每个伏笔必须包含：
1. title, description
2. type, importance（1-10）
3. plantedInChapterNumber（埋设章）
4. expectedChapterNumber（回收章）
5. relatedCharacters, relatedElements

设计原则：
- **埋设点优先落在第 1-${detailedCount} 章**（已有细纲，可写清如何埋）
- 允许少量「短线伏笔」在第 1-${detailedCount} 章内回收
- **长线伏笔**的回收章可以在 ${detailedCount + 1}-${plannedTotal}（对应总纲中段/后段），但 description 要说明在总纲哪一阶段揭晓
- plantedInChapterNumber 必须在 1-${detailedCount}
- expectedChapterNumber 必须在 1-${plannedTotal}，且严格大于 plantedInChapterNumber
- 不要把所有回收都挤在最后一章

请输出以下 JSON：
{
  "foreshadowings": [
    {
      "title": "伏笔名称",
      "description": "埋下了什么线索；若回收在后续阶段请点明对应总纲阶段",
      "type": "plot",
      "importance": 5,
      "plantedInChapterNumber": 1,
      "expectedChapterNumber": 12,
      "relatedCharacters": ["角色名"],
      "relatedElements": ["世界观元素名"]
    }
  ]
}

要求：
- 伏笔总数 6-10 个
- 至少 2 个回收点落在第 ${detailedCount + 1} 章及之后（长线）
- 至少 1 个在开篇 ${detailedCount} 章内可回收（短线）${JSON_FORMAT_REQUIREMENT}`
}
