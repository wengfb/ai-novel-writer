import type { StoryIdeaCard } from '@/types'
import type { BootstrapParams } from '../types'
import {
  PACE_LABELS,
  audienceContext,
} from './helpers'

export function buildStyleAnchorPrompt(
  idea: StoryIdeaCard,
  summary: string,
  params: BootstrapParams
): string {
  // 角色身份由 onboarding-style-anchor Agent 的 system 槽位提供
  return `请根据以下设定，写一段 800-1200 字的样章，作为本项目后续 AI 生成的写作风格参考。

【故事设定】
- 题材：${idea.genre}
- 核心创意：${idea.highConcept}
- 主角：${idea.protagonist}
- 核心冲突：${idea.coreConflict}
- 故事基调：${params.tone || '正剧'}${audienceContext(params.audience)}

【故事概要】
${summary}

【写作要求】

1. 选择一个有代表性的场景来写（可以是开篇场景，也可以是某个关键冲突场景）
2. 样章要求：
   - 展示该题材应有的叙事节奏和描写密度
   - 包含对话片段，展示对话风格
   - 包含环境/场景描写，展示描写风格
   - 包含动作描写和心理描写
3. 风格注意事项：
   - 句式要有变化，长短句结合
   - 描写要有画面感，但不堆砌辞藻
   - 对话要符合角色身份和性格
   - 节奏要符合 ${PACE_LABELS[params.pace]} 的要求

请直接输出样章正文，不要附带任何说明文字、标题或标签。输出字数 800-1200 字。`
}
