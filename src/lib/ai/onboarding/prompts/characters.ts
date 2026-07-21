import type { StoryIdeaCard } from '@/types'
import type { BootstrapParams } from '../types'
import {
  audienceContext,
  povContext,
  JSON_FORMAT_REQUIREMENT,
} from './helpers'

export function buildCharactersPrompt(
  idea: StoryIdeaCard,
  architecture: { storySummary: string; mainConflict: string; thematicThread: string },
  params: BootstrapParams
): string {
  return `你是一位专业的小说角色设计师。请基于以下故事架构，创建完整的角色群像。

【故事概要】
${architecture.storySummary}

【核心冲突】
${architecture.mainConflict}

【主题线索】
${architecture.thematicThread}

【角色基础设定】
- 主角：${idea.protagonist}${audienceContext(params.audience)}${params.tone ? `\n- 故事基调：${params.tone}` : ''}${povContext(params.pov)}

【任务要求】

请生成 **10-15 个角色**，覆盖以下角色类型，确保每个类型都有代表：
- 主角 (protagonist)：1-2 个
- 反派 (antagonist)：2-3 个（包括最终反派和阶段性反派）
- 主要配角 (supporting)：4-6 个（盟友、导师、伙伴等关键配角）
- 次要角色 (minor)：3-4 个（功能性角色但有自己的特点）

每个角色必须包含：

1. **基本信息**：name, role（主角/配角/反派/次要角色）, description（100-200字的角色简介）
2. **性格**：personality（可以是字符串或数组，描述性格的多维度特征）
3. **动机与弧光**：
   - goal：角色的核心目标和驱动力
   - characterArc：角色在故事中的变化轨迹（从A变成B，或者因为什么而改变）
4. **对话风格**：dialogueStyle（描述该角色的语言习惯、口头禅、语气特点）
5. **关系网络**：relationships（至少列出 2 个与其他角色的关系，说明关系性质和互动要点）
6. **登场时机**：firstAppearance（角色在故事的大致哪个阶段登场）

请输出以下 JSON：
{
  "characters": [
    {
      "name": "角色名",
      "role": "主角/配角/反派/次要角色",
      "description": "角色简介（100-200字）",
      "personality": "性格特点",
      "goal": "核心目标",
      "characterArc": "角色弧光（从何种状态变为何种状态）",
      "dialogueStyle": "对话风格描述",
      "relationships": [
        { "targetName": "关联角色名", "relation": "关系名称（师徒/对手/爱人/仇敌等）", "description": "关系具体描述" }
      ],
      "firstAppearance": "登场阶段描述"
    }
  ]
}

要求：
- 角色数量必须达到 10-15 个
- 每个角色的性格必须具体，不能是"性格坚韧"这种泛泛描述
- 关系网络要形成闭环：如果A的关系中提到B，B的关系中也应提到A
- 反派的动机必须有其合理性，不能是纯粹的恶
- 配角要有独立的性格和目标，不能只是主角的附庸${JSON_FORMAT_REQUIREMENT}`
}
