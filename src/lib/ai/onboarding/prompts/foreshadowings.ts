import type { BootstrapParams } from '../types'
import {
  JSON_FORMAT_REQUIREMENT,
} from './helpers'

export function buildForeshadowingsPrompt(
  chapters: { chapterNumber: number; title: string; summary: string }[],
  characters: { name: string }[],
  worldSettings: { name: string }[],
  _params: BootstrapParams
): string {
  const chapterList = chapters
    .map(c => `第${c.chapterNumber}章《${c.title}》：${c.summary}`)
    .join('\n')

  const charNames = characters.map(c => c.name).join('、')
  const worldNames = worldSettings.map(w => w.name).join('、')

  return `你是一位擅长埋伏笔和设置悬念的小说家。请基于以下章节大纲，设计一个完整的伏笔网络。

【章节大纲】
${chapterList}

【角色列表】${charNames}
【世界观元素】${worldNames}

【总章节数】${chapters.length} 章

【任务要求】

请设计 **10-15 个伏笔**，均匀分布在故事的不同阶段。伏笔类型分布：
- 剧情伏笔 (plot)：3-5 个（与主线剧情转折相关）
- 角色伏笔 (character)：3-5 个（与角色身份、背景、关系相关）
- 世界伏笔 (world)：2-3 个（与世界观秘密、隐藏设定相关）
- 悬疑伏笔 (mystery)：2-3 个（与谜题、悬念相关）

每个伏笔必须包含：
1. **标题和描述**：title, description（该伏笔的具体内容）
2. **类型和重要性**：type, importance（1-10）
3. **埋设点**：plantedInChapterNumber（在哪个章节埋下线索）
4. **回收点**：expectedChapterNumber（预期在哪个章节揭晓/回收）
5. **关联角色和元素**：relatedCharacters, relatedElements

设计原则：
- 伏笔有层次：小的伏笔 2-3 章内回收，大的伏笔贯穿全书
- 回收点不能全部集中在最后，应该分布在中后期
- 同一个章节可以同时埋多个伏笔
- plantedInChapterNumber 和 expectedChapterNumber 必须在 1-${chapters.length} 范围内
- 每个伏笔的回收点必须 > 埋设点

请输出以下 JSON：
{
  "foreshadowings": [
    {
      "title": "伏笔名称",
      "description": "伏笔具体描述（埋下了什么线索）",
      "type": "plot",
      "importance": 5,
      "plantedInChapterNumber": 3,
      "expectedChapterNumber": 15,
      "relatedCharacters": ["角色名"],
      "relatedElements": ["世界观元素名"]
    }
  ]
}

要求：
- 伏笔总数 10-15 个
- 不同类型伏笔要均匀分布
- 回收章节要合理（不能全部挤在最后几章）
- 本中途回收的伏笔要标记清楚${JSON_FORMAT_REQUIREMENT}`
}
