/**
 * 全部 Agent 静态定义（含默认提示词）
 *
 * ## 约定
 * - 每个 AI 功能点对应一个 **稳定** id
 * - 提示词必须放在 promptSlots；业务代码禁止再硬编码 system/user 长文
 * - 聊天 UI 与功能按钮通过同一 agentId 复用
 * - 用户覆盖：Prisma AgentPrompt（prompt-store）
 *
 * ## 分类一览
 * - chat / ideas：studio-chat、story-idea
 * - chapter：chapter-writer、continue、scene-*、chapter-editor、summary
 * - outline / character / world / rewrite / utility
 * - onboarding：architecture → … → style-anchor（Bootstrap 六步）
 *
 * 新增功能：在本文件追加定义 → API/设置页自动可见。
 */

import type { AgentDefinition } from '../types'
import {
  OUTLINE_GENERATION_TEMPLATE,
  OUTLINE_REFINEMENT_TEMPLATE,
  CHAPTER_GENERATION_TEMPLATE,
  CHAPTER_CONTINUATION_TEMPLATE,
  CHARACTER_GENERATION_TEMPLATE,
  CHARACTER_DIALOGUE_TEMPLATE,
  WORLD_ELEMENT_TEMPLATE,
  SCENE_GENERATION_TEMPLATE,
  CONSISTENCY_CHECK_TEMPLATE,
  LOCAL_REWRITE_TEMPLATE,
  CHAPTER_SUMMARY_TEMPLATE,
} from './default-prompts'
import {
  ONBOARDING_ARCHITECTURE_SYSTEM,
  ONBOARDING_CHARACTERS_SYSTEM,
  ONBOARDING_WORLD_SYSTEM,
  ONBOARDING_CHAPTERS_SYSTEM,
  ONBOARDING_FORESHADOWINGS_SYSTEM,
  ONBOARDING_STYLE_ANCHOR_SYSTEM,
} from '@/lib/ai/onboarding/prompts/system-defaults'

const STUDIO_CHAT_SYSTEM = `你是一个专业的小说创作助手，正在帮助作者创作《{projectTitle}》这部{genre}小说。

{styleAnchor}

{contextPrompt}

当用户需要创建/新增/保存/修改/更新角色、世界观、章节内容，或查询项目信息时，请优先考虑调用工具完成操作；如果用户意图明确且信息足够，直接使用对应工具比只给文字建议更合适。用户说"创建角色/新增设定/追加章节/查询项目"等操作类请求时，通常是在要求你操作当前项目数据，而不是只生成一段可复制的文本。写操作会先交由用户确认，不要因为需要确认而回避工具调用。工具完成后，用简洁的中文说明你做了什么，并给出下一步建议。若缺少必要信息，请先向用户提问再行动。`

const STORY_IDEA_SYSTEM = `你是一名网络小说编辑。

请随机生成 3 个不同方向的"适合商业网文"的小说创意。3 个方向应该在题材切入点、主角设定或世界观上有明显差异。

要求：
- 设定合理，容易被大多数普通人理解，不要多种题材混搭
- 具备长期连载空间
- 要有内容升华
- 每项1~2句话即可

请以纯 JSON 数组格式输出，不要用 markdown 代码块包裹：

[
  {
    "id": "1",
    "title": "小说名称",
    "genre": "题材",
    "worldBuilding": "世界观",
    "protagonist": "主角（描述人物设定、身份、性格特征，不要给具体姓名）",
    "coreConflict": "核心冲突",
    "mainGoal": "主线目标",
    "highConcept": "高概念梗概",
    "sublimation": "内容升华",
    "openingHook": "开篇切入点"
  }
]`

const SCENE_PLANNER_SYSTEM = `你是一位专业的小说结构师。请根据章节大纲划分 3-5 个场景，严格输出 JSON。`

const SCENE_PLANNER_USER = `请根据以下章节大纲，将其划分为3-5个场景：

**章节大纲**：
{chapterOutline}

**创作意图约束**：
- 情节功能：{plotFunction}
- 张力等级：{tensionLevel}/10
{emotionalGoalLine}

**故事背景**：
{briefContext}

请分析并返回场景划分，以JSON格式：
\`\`\`json
{
  "scenes": [
    {
      "title": "场景标题",
      "goal": "场景目标",
      "location": "地点",
      "characters": ["角色名"],
      "estimatedWords": 预估字数
    }
  ]
}
\`\`\``

const CHAPTER_REFINE_SYSTEM = `你是一位资深小说编辑，擅长发现剧情漏洞和角色行为不一致的问题。

{contextPrompt}`

const CHAPTER_REFINE_USER = `作为一位专业编辑，请审核并优化以下章节内容。

请严格对照上下文中的角色设定和世界观规则进行审核，确保角色行为不偏离设定、世界观描写无矛盾。同时请确保章节内容达到结构化创作意图的目标。

**章节大纲**：
{chapterOutline}

**待优化内容**：
{content}

**审核要点**：
1. 是否符合剧情发展逻辑？
2. 角色行为是否符合设定？（对照上下文中的角色信息检查）
3. 世界观描写是否有矛盾？（对照上下文中的世界观规则检查）
4. 是否遗漏了重要的伏笔回收机会？
5. 描写是否生动？是否有冗余？
6. 对话是否自然？
7. 是否需要补充细节？
{intentCheckItems}

请直接输出优化后的完整章节，不要包含点评和说明。`

const SCENE_WRITER_SYSTEM = `你是一位专业小说作家。正在撰写第{chapterNumber}章《{chapterTitle}》的第{sceneIndex}个场景（共{totalScenes}个场景）。

{styleAnchor}

{contextPrompt}`

/** 注册表：新增 AI 功能时在此追加定义 */
export const AGENT_DEFINITIONS: AgentDefinition[] = [
  // ---------- Chat ----------
  {
    id: 'studio-chat',
    name: 'Studio 创作助手',
    description: '项目内多轮对话助手，支持角色/世界观/章节等工具操作。聊天面板与工具调用共用此 Agent。',
    category: 'chat',
    chatCompatible: true,
    temperature: 0.8,
    maxSteps: 5,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        description: 'Studio 聊天的主系统提示词。可用变量会在运行时注入。',
        defaultContent: STUDIO_CHAT_SYSTEM,
        variables: [
          { name: 'projectTitle', description: '项目标题', required: true },
          { name: 'genre', description: '小说类型', required: true },
          { name: 'styleAnchor', description: '风格锚点文本（可为空）' },
          { name: 'contextPrompt', description: '上下文管理器格式化后的项目上下文' },
        ],
      },
    ],
  },

  // ---------- Ideas ----------
  {
    id: 'story-idea',
    name: '随机故事创意',
    description: '生成 3 个商业网文创意方向，供引导页与创意中心复用。',
    category: 'ideas',
    chatCompatible: true,
    temperature: 0.9,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        description: '生成创意时的系统提示词',
        defaultContent: STORY_IDEA_SYSTEM,
      },
      {
        key: 'user',
        name: '用户消息模板',
        description: '可附加筛选条件与正反例。{filters} {examples}',
        defaultContent: `{filters}{examples}

请生成 3 个不同方向的小说创意。`,
        variables: [
          { name: 'filters', description: '题材/受众等筛选条件文本' },
          { name: 'examples', description: '正反例注入文本' },
        ],
      },
    ],
  },

  // ---------- Chapter ----------
  {
    id: 'chapter-writer',
    name: '章节正文生成',
    description: '按大纲生成完整章节正文（单次生成模板）。分场景流程会组合 scene-planner / scene-writer / chapter-editor。',
    category: 'chapter',
    chatCompatible: true,
    temperature: 0.85,
    promptSlots: [
      {
        key: 'system',
        name: '系统角色',
        description: '章节生成时的作者身份设定（可并入 user 模板前部）',
        defaultContent: '你是一位专业的小说作家。请根据用户提供的信息撰写小说章节，直接输出正文，不要包含说明性文字或标题。',
      },
      {
        key: 'user',
        name: '章节生成模板',
        description: '完整用户侧提示词',
        defaultContent: CHAPTER_GENERATION_TEMPLATE,
        variables: [
          { name: 'chapterNumber', description: '章节编号' },
          { name: 'chapterTitle', description: '章节标题' },
          { name: 'chapterOutline', description: '章节大纲' },
          { name: 'targetWords', description: '目标字数' },
          { name: 'pov', description: '叙事人称' },
          { name: 'characters', description: '相关角色' },
          { name: 'worldSettings', description: '世界观' },
          { name: 'previousSummary', description: '前文概要' },
        ],
      },
    ],
  },
  {
    id: 'chapter-continue',
    name: '章节续写',
    description: '在已有章节正文后续写。续写按钮与聊天指令复用。',
    category: 'chapter',
    chatCompatible: true,
    temperature: 0.85,
    promptSlots: [
      {
        key: 'system',
        name: '系统角色',
        defaultContent: '你是一位专业的小说作家。请续写用户提供的章节内容，保持文风一致，不要重复已有内容。',
      },
      {
        key: 'user',
        name: '续写模板',
        defaultContent: CHAPTER_CONTINUATION_TEMPLATE,
        variables: [
          { name: 'chapterNumber', description: '章节编号' },
          { name: 'currentContent', description: '已有正文' },
          { name: 'pov', description: '叙事人称' },
          { name: 'targetWords', description: '续写字数' },
          { name: 'chapterOutline', description: '章节大纲' },
        ],
      },
    ],
  },
  {
    id: 'scene-planner',
    name: '场景规划',
    description: '将章节大纲拆成 3-5 个场景，供章节生成管线使用。',
    category: 'chapter',
    temperature: 0.7,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        defaultContent: SCENE_PLANNER_SYSTEM,
      },
      {
        key: 'user',
        name: '规划模板',
        defaultContent: SCENE_PLANNER_USER,
        variables: [
          { name: 'chapterOutline', description: '章节大纲' },
          { name: 'plotFunction', description: '情节功能' },
          { name: 'tensionLevel', description: '张力等级' },
          { name: 'emotionalGoalLine', description: '情感目标行（可空）' },
          { name: 'briefContext', description: '简要故事背景' },
        ],
      },
    ],
  },
  {
    id: 'scene-writer',
    name: '场景写作',
    description: '按场景计划撰写单个场景正文。',
    category: 'chapter',
    temperature: 0.85,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        defaultContent: SCENE_WRITER_SYSTEM,
        variables: [
          { name: 'chapterNumber', description: '章节号' },
          { name: 'chapterTitle', description: '章节标题' },
          { name: 'sceneIndex', description: '当前场景序号（从 1 起）' },
          { name: 'totalScenes', description: '场景总数' },
          { name: 'styleAnchor', description: '风格锚点' },
          { name: 'contextPrompt', description: '上下文' },
        ],
      },
      {
        key: 'user',
        name: '场景写作模板',
        defaultContent: SCENE_GENERATION_TEMPLATE,
        variables: [
          { name: 'sceneGoal', description: '场景目标' },
          { name: 'characters', description: '出场角色' },
          { name: 'location', description: '地点' },
          { name: 'time', description: '时间' },
          { name: 'pov', description: '人称' },
          { name: 'previousText', description: '前文' },
          { name: 'targetWords', description: '目标字数' },
        ],
      },
    ],
  },
  {
    id: 'chapter-editor',
    name: '章节反思润色',
    description: '对生成章节做一致性与意图审核并输出优化后全文。',
    category: 'chapter',
    temperature: 0.6,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        defaultContent: CHAPTER_REFINE_SYSTEM,
        variables: [{ name: 'contextPrompt', description: '项目上下文' }],
      },
      {
        key: 'user',
        name: '润色模板',
        defaultContent: CHAPTER_REFINE_USER,
        variables: [
          { name: 'chapterOutline', description: '章节大纲' },
          { name: 'content', description: '待优化正文' },
          { name: 'intentCheckItems', description: '意图检查条目' },
        ],
      },
    ],
  },
  {
    id: 'chapter-summary',
    name: '章节摘要',
    description: '为已写章节生成上下文摘要。',
    category: 'utility',
    temperature: 0.4,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        defaultContent: '你是一位专业的小说编辑，擅长提炼情节摘要。',
      },
      {
        key: 'user',
        name: '摘要模板',
        defaultContent: CHAPTER_SUMMARY_TEMPLATE,
        variables: [
          { name: 'chapterTitle', description: '章节标题' },
          { name: 'chapterContent', description: '章节正文' },
          { name: 'characters', description: '出场角色' },
        ],
      },
    ],
  },

  // ---------- Outline ----------
  {
    id: 'outline-architect',
    name: '大纲架构生成',
    description: '根据创意生成卷章结构与角色/世界观草案。',
    category: 'outline',
    chatCompatible: true,
    temperature: 0.75,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        defaultContent: '你是一位专业的小说大纲设计师。请严格按用户模板输出合法 JSON。',
      },
      {
        key: 'user',
        name: '大纲生成模板',
        defaultContent: OUTLINE_GENERATION_TEMPLATE,
        variables: [
          { name: 'genre', description: '类型' },
          { name: 'coreIdea', description: '核心创意' },
          { name: 'style', description: '风格' },
          { name: 'pov', description: '人称' },
          { name: 'targetWords', description: '每章字数' },
          { name: 'chapterCount', description: '章数' },
          { name: 'totalWords', description: '总字数' },
        ],
      },
    ],
  },
  {
    id: 'outline-refiner',
    name: '大纲细化',
    description: '对指定章节大纲做场景级细化。',
    category: 'outline',
    temperature: 0.7,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        defaultContent: '你是一位专业的小说大纲设计师。请输出合法 JSON。',
      },
      {
        key: 'user',
        name: '细化模板',
        defaultContent: OUTLINE_REFINEMENT_TEMPLATE,
        variables: [
          { name: 'chapterNumber', description: '章节号' },
          { name: 'currentOutline', description: '当前大纲' },
          { name: 'userRequirement', description: '用户要求' },
        ],
      },
    ],
  },

  // ---------- Character / World ----------
  {
    id: 'character-creator',
    name: '角色生成',
    description: '生成角色卡片。创建角色对话框与聊天工具复用同一提示词。',
    category: 'character',
    chatCompatible: true,
    temperature: 0.8,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        defaultContent: '你是一位专业的小说角色设计师。请输出合法 JSON 角色卡片。',
      },
      {
        key: 'user',
        name: '角色生成模板',
        defaultContent: CHARACTER_GENERATION_TEMPLATE,
        variables: [
          { name: 'role', description: '角色定位' },
          { name: 'storyContext', description: '故事背景' },
          { name: 'pov', description: '人称' },
          { name: 'requirements', description: '特殊要求' },
        ],
      },
    ],
  },
  {
    id: 'character-dialogue',
    name: '角色对话生成',
    description: '按角色设定生成场景对话。',
    category: 'character',
    temperature: 0.85,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        defaultContent: '你是一位专业小说作家，擅长写出符合人物性格的对话。',
      },
      {
        key: 'user',
        name: '对话模板',
        defaultContent: CHARACTER_DIALOGUE_TEMPLATE,
        variables: [
          { name: 'characterName', description: '角色名' },
          { name: 'characterInfo', description: '角色信息' },
          { name: 'scenario', description: '场景' },
          { name: 'otherCharacters', description: '对话对象' },
          { name: 'purpose', description: '对话目的' },
        ],
      },
    ],
  },
  {
    id: 'world-builder',
    name: '世界观元素生成',
    description: '生成世界观设定条目。',
    category: 'world',
    chatCompatible: true,
    temperature: 0.75,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        defaultContent: '你是一位专业的世界观架构师。请输出合法 JSON。',
      },
      {
        key: 'user',
        name: '世界观模板',
        defaultContent: WORLD_ELEMENT_TEMPLATE,
        variables: [
          { name: 'elementType', description: '设定类型' },
          { name: 'storyContext', description: '故事背景' },
          { name: 'genre', description: '类型' },
          { name: 'requirements', description: '要求' },
        ],
      },
    ],
  },
  {
    id: 'consistency-checker',
    name: '一致性检查',
    description: '检查正文与角色/世界观设定是否一致。',
    category: 'utility',
    chatCompatible: true,
    temperature: 0.3,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        defaultContent: '你是一位专业小说编辑，负责设定一致性审查。请输出合法 JSON 报告。',
      },
      {
        key: 'user',
        name: '检查模板',
        defaultContent: CONSISTENCY_CHECK_TEMPLATE,
        variables: [
          { name: 'characterSettings', description: '角色设定' },
          { name: 'content', description: '待检查内容' },
        ],
      },
    ],
  },

  // ---------- Rewrite ----------
  {
    id: 'local-rewriter',
    name: '局部改写',
    description: '编辑器选区改写。气泡菜单与聊天复用。',
    category: 'rewrite',
    chatCompatible: true,
    temperature: 0.7,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        defaultContent: '你是一位专业的小说编辑。只输出改写后的文本，不要说明。',
      },
      {
        key: 'user',
        name: '改写模板',
        defaultContent: LOCAL_REWRITE_TEMPLATE,
        variables: [
          { name: 'style', description: '改写风格' },
          { name: 'fullChapterContent', description: '全章上下文' },
          { name: 'selectedText', description: '选中文本' },
        ],
      },
    ],
  },

  // ---------- Onboarding pipeline steps（每步独立 agent，system 可编辑） ----------
  {
    id: 'onboarding-architecture',
    name: '引导：故事架构',
    description: 'Bootstrap 管线第 1 步：生成故事架构。system 可编辑；任务正文由引导流程注入 {taskBody}。',
    category: 'onboarding',
    temperature: 0.75,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        description: '架构师身份与输出格式约束',
        defaultContent: ONBOARDING_ARCHITECTURE_SYSTEM,
      },
      {
        key: 'user',
        name: '任务正文模板',
        description: '{taskBody} 为动态构建的创意/参数/JSON schema；{extraConstraints} 可选追加约束',
        defaultContent: '{taskBody}{extraConstraints}',
        variables: [
          { name: 'taskBody', description: '由 onboarding/prompts 构建的完整任务说明', required: true },
          { name: 'extraConstraints', description: '可选全局追加约束' },
        ],
      },
    ],
  },
  {
    id: 'onboarding-characters',
    name: '引导：角色群像',
    description: 'Bootstrap 管线第 2 步：生成角色群像。',
    category: 'onboarding',
    temperature: 0.8,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        defaultContent: ONBOARDING_CHARACTERS_SYSTEM,
      },
      {
        key: 'user',
        name: '任务正文模板',
        defaultContent: '{taskBody}{extraConstraints}',
        variables: [
          { name: 'taskBody', description: '角色生成任务说明', required: true },
          { name: 'extraConstraints', description: '可选追加约束' },
        ],
      },
    ],
  },
  {
    id: 'onboarding-world',
    name: '引导：世界观',
    description: 'Bootstrap 管线第 3 步：生成世界观元素。',
    category: 'onboarding',
    temperature: 0.75,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        defaultContent: ONBOARDING_WORLD_SYSTEM,
      },
      {
        key: 'user',
        name: '任务正文模板',
        defaultContent: '{taskBody}{extraConstraints}',
        variables: [
          { name: 'taskBody', description: '世界观任务说明', required: true },
          { name: 'extraConstraints', description: '可选追加约束' },
        ],
      },
    ],
  },
  {
    id: 'onboarding-chapters',
    name: '引导：章节大纲',
    description: 'Bootstrap 管线第 4 步：全书总纲 + 前三章细纲（不全量逐章）。',
    category: 'onboarding',
    temperature: 0.6,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        defaultContent: ONBOARDING_CHAPTERS_SYSTEM,
      },
      {
        key: 'user',
        name: '任务正文模板',
        defaultContent: '{taskBody}{extraConstraints}',
        variables: [
          { name: 'taskBody', description: '分章大纲任务说明', required: true },
          { name: 'extraConstraints', description: '可选追加约束' },
        ],
      },
    ],
  },
  {
    id: 'onboarding-foreshadowings',
    name: '引导：伏笔规划',
    description: 'Bootstrap 管线第 5 步：生成伏笔计划。',
    category: 'onboarding',
    temperature: 0.7,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        defaultContent: ONBOARDING_FORESHADOWINGS_SYSTEM,
      },
      {
        key: 'user',
        name: '任务正文模板',
        defaultContent: '{taskBody}{extraConstraints}',
        variables: [
          { name: 'taskBody', description: '伏笔网络任务说明', required: true },
          { name: 'extraConstraints', description: '可选追加约束' },
        ],
      },
    ],
  },
  {
    id: 'onboarding-style-anchor',
    name: '引导：风格锚点',
    description: 'Bootstrap 管线第 6 步：生成文风样章。输出纯正文而非 JSON。',
    category: 'onboarding',
    temperature: 0.8,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        defaultContent: ONBOARDING_STYLE_ANCHOR_SYSTEM,
      },
      {
        key: 'user',
        name: '任务正文模板',
        defaultContent: '{taskBody}{extraConstraints}',
        variables: [
          { name: 'taskBody', description: '样章写作任务说明', required: true },
          { name: 'extraConstraints', description: '可选追加约束' },
        ],
      },
    ],
  },
]

const byId = new Map(AGENT_DEFINITIONS.map((d) => [d.id, d]))

export function getAgentDefinition(agentId: string): AgentDefinition | undefined {
  return byId.get(agentId)
}

export function listAgentDefinitions(): AgentDefinition[] {
  return AGENT_DEFINITIONS
}
