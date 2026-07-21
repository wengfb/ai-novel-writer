import type { StoryIdeaCard } from '@/types'
import type { BootstrapParams, ChapterCalculation } from '../types'
import {
  PACE_LABELS,
  audienceContext,
  povContext,
  JSON_FORMAT_REQUIREMENT,
  getActDistribution,
} from './helpers'

export function buildArchitecturePrompt(
  idea: StoryIdeaCard,
  params: BootstrapParams,
  calc: ChapterCalculation
): string {
  const actDistribution = getActDistribution(calc.chapterCount)

  return `你是一位资深的小说策划编辑。请基于以下创意，为小说《${params.projectTitle}》设计完整的全局架构。

【创意设定】
- 题材：${idea.genre}
- 世界观：${idea.worldBuilding}
- 主角：${idea.protagonist}
- 核心冲突：${idea.coreConflict}
- 主线目标：${idea.mainGoal}
- 高概念梗概：${idea.highConcept}
- 主题升华：${idea.sublimation}
- 开篇切入点：${idea.openingHook}

【创作参数】
- 目标总字数：${params.targetWords.toLocaleString()} 字
- 叙事节奏：${PACE_LABELS[params.pace]}
- 计划章节数：${calc.chapterCount} 章
- 分卷数：${calc.volumeCount} 卷，每卷约 ${calc.chaptersPerVolume} 章${audienceContext(params.audience)}${params.tone ? `\n- 故事基调：${params.tone}` : ''}${povContext(params.pov)}

【任务要求】

1. **故事梗概** (300-500字)：完整的故事主线，从开篇到结局，涵盖关键转折点和最终结局。将"${idea.openingHook}"作为开篇引子融入故事线，将"${idea.sublimation}"作为主题线索贯穿全篇。

2. **核心冲突**：明确的内外冲突。外部冲突（对抗力量是什么？）和内部冲突（主角的内心挣扎是什么？）。

3. **三幕结构** (${actDistribution.acts.length} 幕)：
${actDistribution.acts.map(a => `   - 第${a.act}幕："${a.label}"：第 ${a.chapterRange[0]}-${a.chapterRange[1]} 章，${a.description}`).join('\n')}

4. **分卷方案** (${calc.volumeCount} 卷)：每卷有自己的小高潮和阶段目标。

5. **主题线索**：说明"${idea.sublimation}"这个主题如何在故事的不同阶段展开和深化。

请输出以下 JSON：
{
  "storySummary": "完整故事梗概（300-500字，包含开篇-发展-高潮-结局）",
  "mainConflict": "核心冲突描述（内外部冲突）",
  "suggestedTotalWords": ${params.targetWords},
  "wordCountRationale": "篇幅分配说明（为什么这样分配，高潮章节占比等）",
  "actStructure": [
    { "act": 1, "chapterRange": [${actDistribution.acts[0].chapterRange[0]}, ${actDistribution.acts[0].chapterRange[1]}], "description": "该幕的主要事件和情感走向", "emotionalArc": "情感弧线描述" }
  ],
  "volumePlan": [
    { "volumeNumber": 1, "title": "卷名", "description": "本卷主要内容和阶段目标", "chapterRange": [1, N] }
  ],
  "thematicThread": "主题线索如何在各阶段展开"
}

要求：
- storySummary 必须覆盖从开篇到结局的完整主线，不能只有开头
- 开篇切入点必须体现在 actStructure 第1幕中
- 卷名要有吸引力，不能是"第一卷"这种占位符
- 每卷的小高潮规划要具体${JSON_FORMAT_REQUIREMENT}`
}
