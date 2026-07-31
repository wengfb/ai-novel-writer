import type { StoryIdeaCard } from '@/types'
import type { BootstrapParams } from '../types'
import {
  audienceContext,
  povContext,
  JSON_FORMAT_REQUIREMENT,
} from './helpers'

export function buildWorldPrompt(
  idea: StoryIdeaCard,
  architecture: { storySummary: string; mainConflict: string },
  characters: { name: string; description: string }[],
  params: BootstrapParams
): string {
  const charNames = characters.map(c => c.name).join('、')

  // 角色身份由 onboarding-world Agent 的 system 槽位提供
  return `请基于以下故事和角色信息，构建完整的世界观体系。

【故事概要】
${architecture.storySummary}

【核心冲突】
${architecture.mainConflict}

【已有角色】
${charNames}

【原始世界观概念】
${idea.worldBuilding}
${idea.genre ? `题材类型：${idea.genre}` : ''}${audienceContext(params.audience)}${povContext(params.pov)}

【任务要求】

请生成 **8-12 个世界观元素**，覆盖以下类型：
- 地理/地点 (location)：3-4 个（与角色和情节相关的重要地点）
- 历史/传说 (history)：1-2 个（影响当前故事的历史事件或传说）
- 力量/魔法/修炼体系 (magic)：1-2 个（如果适用）
- 组织/势力 (organization)：2-3 个（与核心冲突相关的势力）
- 关键物品 (item)：1-2 个
- 其他 (other)：0-1 个

每个世界观元素必须包含：

1. **基本信息**：type, name, description（300-500字详细描述）
2. **重要性与范围**：
   - importance：1-10（该元素对故事的重要程度）
   - scope：global（影响整个故事世界）/ regional（影响某个区域）/ local（影响特定地点）
   - category：core_rule（核心规则：力量体系、世界法则）/ detail（细节设定）/ background（背景信息）
3. **约束与例外**：
   - constraints：至少 1 条该设定的限制或规则
   - exceptions：例外情况（如有）
4. **关联**：relatedTo（关联的角色名或世界观元素名列表）
5. **演化空间**：isEvolvable（是否可随时间演化），evolutionSpace（可能的演化方向）

请输出以下 JSON：
{
  "worldSettings": [
    {
      "type": "location/history/magic/organization/item/other",
      "name": "设定名称",
      "description": "详细描述（300-500字，包含视觉细节、功能说明、故事意义）",
      "importance": 7,
      "scope": "global",
      "category": "core_rule",
      "constraints": [
        { "description": "约束说明", "rule": "具体规则" }
      ],
      "exceptions": [
        { "condition": "例外条件", "description": "例外说明" }
      ],
      "relatedTo": ["角色名或元素名"],
      "isEvolvable": false,
      "evolutionSpace": "演化空间描述（如不可演化则写'不可演化'并说明原因）"
    }
  ]
}

要求：
- 世界元素总数 8-12 个
- **创建前先核对本次输出的设定名单：同一地点、组织、规则或物品只能出现一次；名称仅有空格、大小写或别称差异时视为同一设定。别称请写入 description，不要额外创建重复元素。**
- 核心规则类至少 2 个（必须包含力量体系/魔法体系/修炼体系中的一个，如果故事中有的话）
- 每个地点的描述要具体到可以用作场景描写的参考
- 每个组织/势力的概况必须包含其目标和与其他势力的关系
- constraints 不能为空，要写出真正的限制
- relatedTo 必须引用前面角色的真实名称：${charNames}${JSON_FORMAT_REQUIREMENT}`
}
