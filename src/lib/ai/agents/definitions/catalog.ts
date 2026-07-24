/**
 * 全部 Agent 静态定义（含默认提示词）
 *
 * ## 约定
 * - 一个领域能力 = 一个 Agent；领域内多模板 = 多 Slot
 * - 结构化任务：runAgentObject + agents/schemas.ts
 * - 散文任务：runAgent / streamAgent
 * - 用户覆盖：Prisma AgentPrompt（prompt-store）
 *
 * ## 清单（10）
 * studio-chat / story-idea / chapter / outline / character /
 * world / rewrite / consistency / summary / onboarding
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

请严格按 schema 输出对象：{ "ideas": [ ...3 个创意... ] }，不要 markdown 代码块、不要解释文字。`

const SCENE_PLANNER_SYSTEM = `你是一位专业的小说结构师。请根据章节大纲划分 3-5 个场景，严格按 JSON schema 输出。`

const SCENE_PLANNER_USER = `请根据以下章节大纲，将其划分为3-5个场景：

**章节大纲**：
{chapterOutline}

**创作意图约束**：
- 情节功能：{plotFunction}
- 张力等级：{tensionLevel}/10
{emotionalGoalLine}

**故事背景**：
{briefContext}

请分析并返回场景划分（scenes 数组：title、goal、location、characters、estimatedWords）。`

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

const ONBOARDING_USER = `{taskBody}{extraConstraints}`

/** 注册表：新增 AI 功能时在此追加定义 */
export const AGENT_DEFINITIONS: AgentDefinition[] = [
  // ---------- Chat ----------
  {
    id: 'studio-chat',
    name: 'Studio 创作助手',
    description: '项目内多轮对话助手，支持角色/世界观/章节等工具操作。',
    category: 'chat',
    chatCompatible: true,
    temperature: 0.8,
    maxSteps: 5,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        description: 'Studio 聊天的主系统提示词。',
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
    description: '生成商业网文创意方向（结构化输出）。',
    category: 'ideas',
    chatCompatible: true,
    temperature: 0.9,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        defaultContent: STORY_IDEA_SYSTEM,
      },
      {
        key: 'user',
        name: '用户消息模板',
        defaultContent: `{filters}{examples}

请生成 3 个不同方向的小说创意。`,
        variables: [
          { name: 'filters', description: '题材/受众等筛选条件文本' },
          { name: 'examples', description: '正反例注入文本' },
        ],
      },
    ],
  },

  // ---------- Chapter（多 slot 管线） ----------
  {
    id: 'chapter',
    name: '章节创作',
    description:
      '章节全流程：场景规划(plan) / 场景写作(write) / 润色(refine) / 单次成章(full) / 续写(continue)。',
    category: 'chapter',
    chatCompatible: true,
    temperature: 0.85,
    promptSlots: [
      {
        key: 'system.plan',
        name: '场景规划 · 系统',
        defaultContent: SCENE_PLANNER_SYSTEM,
      },
      {
        key: 'user.plan',
        name: '场景规划 · 用户',
        defaultContent: SCENE_PLANNER_USER,
        variables: [
          { name: 'chapterOutline', description: '章节大纲' },
          { name: 'plotFunction', description: '情节功能' },
          { name: 'tensionLevel', description: '张力等级' },
          { name: 'emotionalGoalLine', description: '情感目标行（可空）' },
          { name: 'briefContext', description: '简要故事背景' },
        ],
      },
      {
        key: 'system.write',
        name: '场景写作 · 系统',
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
        key: 'user.write',
        name: '场景写作 · 用户',
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
      {
        key: 'system.refine',
        name: '章节润色 · 系统',
        defaultContent: CHAPTER_REFINE_SYSTEM,
        variables: [{ name: 'contextPrompt', description: '项目上下文' }],
      },
      {
        key: 'user.refine',
        name: '章节润色 · 用户',
        defaultContent: CHAPTER_REFINE_USER,
        variables: [
          { name: 'chapterOutline', description: '章节大纲' },
          { name: 'content', description: '待优化正文' },
          { name: 'intentCheckItems', description: '意图检查条目' },
        ],
      },
      {
        key: 'system.full',
        name: '单次成章 · 系统',
        defaultContent:
          '你是一位专业的小说作家。请根据用户提供的信息撰写小说章节，直接输出正文，不要包含说明性文字或标题。',
      },
      {
        key: 'user.full',
        name: '单次成章 · 用户',
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
      {
        key: 'system.continue',
        name: '续写 · 系统',
        defaultContent:
          '你是一位专业的小说作家。请续写用户提供的章节内容，保持文风一致，不要重复已有内容。',
      },
      {
        key: 'user.continue',
        name: '续写 · 用户',
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

  // ---------- Outline ----------
  {
    id: 'outline',
    name: '大纲',
    description: '大纲架构生成与章节细化（结构化输出）。',
    category: 'outline',
    chatCompatible: true,
    temperature: 0.75,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        defaultContent:
          '你是一位专业的小说大纲设计师。请严格按用户任务与 JSON schema 输出。',
      },
      {
        key: 'user.generate',
        name: '大纲生成',
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
      {
        key: 'user.refine',
        name: '大纲细化',
        defaultContent: OUTLINE_REFINEMENT_TEMPLATE,
        variables: [
          { name: 'chapterNumber', description: '章节号' },
          { name: 'currentOutline', description: '当前大纲' },
          { name: 'userRequirement', description: '用户要求' },
        ],
      },
    ],
  },

  // ---------- Character ----------
  {
    id: 'character',
    name: '角色',
    description: '角色卡片与场景对话生成。',
    category: 'character',
    chatCompatible: true,
    temperature: 0.8,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        defaultContent:
          '你是一位专业的小说角色设计师。生成角色卡片时严格按 JSON schema 输出；生成对话时直接输出正文。',
      },
      {
        key: 'user.create',
        name: '角色生成',
        defaultContent: CHARACTER_GENERATION_TEMPLATE,
        variables: [
          { name: 'role', description: '角色定位' },
          { name: 'storyContext', description: '故事背景' },
          { name: 'pov', description: '人称' },
          { name: 'requirements', description: '特殊要求' },
        ],
      },
      {
        key: 'user.dialogue',
        name: '角色对话',
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

  // ---------- World ----------
  {
    id: 'world',
    name: '世界观',
    description: '世界观设定条目生成（结构化输出）。',
    category: 'world',
    chatCompatible: true,
    temperature: 0.75,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        defaultContent:
          '你是一位专业的世界观架构师。请严格按 JSON schema 输出设定条目。',
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

  // ---------- Rewrite ----------
  {
    id: 'rewrite',
    name: '局部改写',
    description: '编辑器选区改写。',
    category: 'rewrite',
    chatCompatible: true,
    temperature: 0.7,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        defaultContent:
          '你是一位专业的小说编辑。只输出改写后的文本，不要说明。',
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

  // ---------- Utility ----------
  {
    id: 'consistency',
    name: '一致性检查',
    description: '检查正文与角色/世界观设定是否一致（结构化报告）。',
    category: 'utility',
    chatCompatible: true,
    temperature: 0.3,
    promptSlots: [
      {
        key: 'system',
        name: '系统指令',
        defaultContent:
          '你是一位专业小说编辑，负责设定一致性审查。请严格按 JSON schema 输出报告。',
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
  {
    id: 'summary',
    name: '章节摘要',
    description: '为已写章节生成上下文摘要（散文）。',
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

  // ---------- Onboarding（六步 = 六组 system slot） ----------
  {
    id: 'onboarding',
    name: '项目引导',
    description:
      'Bootstrap 六步：架构 / 角色 / 世界观 / 大纲 / 伏笔 / 风格锚点。任务型走结构化输出，对话型可 chatCompatible。',
    category: 'onboarding',
    temperature: 0.75,
    chatCompatible: true,
    maxSteps: 3,
    promptSlots: [
      {
        key: 'system.architecture',
        name: '架构 · 系统',
        defaultContent: ONBOARDING_ARCHITECTURE_SYSTEM,
      },
      {
        key: 'system.characters',
        name: '角色 · 系统',
        defaultContent: ONBOARDING_CHARACTERS_SYSTEM,
      },
      {
        key: 'system.world',
        name: '世界观 · 系统',
        defaultContent: ONBOARDING_WORLD_SYSTEM,
      },
      {
        key: 'system.chapters',
        name: '大纲 · 系统',
        defaultContent: ONBOARDING_CHAPTERS_SYSTEM,
      },
      {
        key: 'system.foreshadowings',
        name: '伏笔 · 系统',
        defaultContent: ONBOARDING_FORESHADOWINGS_SYSTEM,
      },
      {
        key: 'system.style-anchor',
        name: '风格锚点 · 系统',
        defaultContent: ONBOARDING_STYLE_ANCHOR_SYSTEM,
      },
      {
        key: 'user',
        name: '任务正文模板',
        description: '{taskBody} 为动态任务说明；{extraConstraints} 可选',
        defaultContent: ONBOARDING_USER,
        variables: [
          { name: 'taskBody', description: '由 onboarding/prompts 构建的任务说明', required: true },
          { name: 'extraConstraints', description: '可选追加约束' },
        ],
      },
    ],
  },
]

/**
 * 旧 agentId → 新 agentId + 默认 slot 映射
 * 用于 DB 中遗留 AgentPrompt 与外部调用兼容
 */
export const LEGACY_AGENT_MAP: Record<
  string,
  { agentId: string; systemSlot?: string; userSlot?: string }
> = {
  'studio-chat': { agentId: 'studio-chat' },
  'story-idea': { agentId: 'story-idea' },
  'chapter-writer': { agentId: 'chapter', systemSlot: 'system.full', userSlot: 'user.full' },
  'chapter-continue': {
    agentId: 'chapter',
    systemSlot: 'system.continue',
    userSlot: 'user.continue',
  },
  'scene-planner': { agentId: 'chapter', systemSlot: 'system.plan', userSlot: 'user.plan' },
  'scene-writer': { agentId: 'chapter', systemSlot: 'system.write', userSlot: 'user.write' },
  'chapter-editor': {
    agentId: 'chapter',
    systemSlot: 'system.refine',
    userSlot: 'user.refine',
  },
  'chapter-summary': { agentId: 'summary' },
  'outline-architect': { agentId: 'outline', userSlot: 'user.generate' },
  'outline-refiner': { agentId: 'outline', userSlot: 'user.refine' },
  'character-creator': { agentId: 'character', userSlot: 'user.create' },
  'character-dialogue': { agentId: 'character', userSlot: 'user.dialogue' },
  'world-builder': { agentId: 'world' },
  'consistency-checker': { agentId: 'consistency' },
  'local-rewriter': { agentId: 'rewrite' },
  'onboarding-architecture': {
    agentId: 'onboarding',
    systemSlot: 'system.architecture',
  },
  'onboarding-characters': { agentId: 'onboarding', systemSlot: 'system.characters' },
  'onboarding-world': { agentId: 'onboarding', systemSlot: 'system.world' },
  'onboarding-chapters': { agentId: 'onboarding', systemSlot: 'system.chapters' },
  'onboarding-foreshadowings': {
    agentId: 'onboarding',
    systemSlot: 'system.foreshadowings',
  },
  'onboarding-style-anchor': {
    agentId: 'onboarding',
    systemSlot: 'system.style-anchor',
  },
}

const byId = new Map(AGENT_DEFINITIONS.map((d) => [d.id, d]))

export function getAgentDefinition(agentId: string): AgentDefinition | undefined {
  return byId.get(agentId)
}

export function listAgentDefinitions(): AgentDefinition[] {
  return AGENT_DEFINITIONS
}

/** 解析可能为 legacy 的 agentId */
export function resolveAgentRef(agentId: string): {
  agentId: string
  systemSlot?: string
  userSlot?: string
} {
  if (byId.has(agentId)) return { agentId }
  return LEGACY_AGENT_MAP[agentId] ?? { agentId }
}
