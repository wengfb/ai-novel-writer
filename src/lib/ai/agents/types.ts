/**
 * Agent 框架类型定义
 *
 * 设计目标：
 * 1. 一个领域能力 = 一个 Agent；领域内多模板 = 多 Slot
 * 2. 结构化任务走 runAgentObject（Zod schema）；散文走 runAgent / streamAgent
 * 3. 提示词可在「设置 → Agent 提示词」查看/编辑（DB 覆盖）
 */

/** 提示词槽位中可用变量的元信息（供设置页展示） */
export interface PromptVariableMeta {
  /** 变量名，对应模板中的 {name} */
  name: string
  /** 中文说明 */
  description: string
  /** 是否运行时必填（缺失时占位符会保留） */
  required?: boolean
}

/**
 * 单个提示词槽位的代码侧默认定义
 * 用户覆盖写入 Prisma AgentPrompt，不改这里
 */
export interface PromptSlotDefinition {
  /** 槽位键，如 system / user / system.plan / user.continue */
  key: string
  /** UI 展示名 */
  name: string
  /** 用途说明 */
  description?: string
  /** 默认模板正文，支持 {var} 插值 */
  defaultContent: string
  /** 可用变量说明 */
  variables?: PromptVariableMeta[]
}

/** 运行时解析后的提示词槽位（含是否被用户覆盖） */
export interface ResolvedPromptSlot {
  key: string
  name: string
  description?: string
  /** 当前生效正文（用户覆盖或默认） */
  content: string
  /** 代码默认正文（用于对比 / 恢复） */
  defaultContent: string
  variables?: PromptVariableMeta[]
  /** 是否相对默认被用户改过 */
  isCustom: boolean
  /** 用户版本号；默认未覆盖时为 0 */
  version: number
}

/** Agent 业务分类（设置页筛选 / 目录分组） */
export type AgentCategory =
  | 'chat'
  | 'onboarding'
  | 'chapter'
  | 'outline'
  | 'character'
  | 'world'
  | 'rewrite'
  | 'ideas'
  | 'utility'

/**
 * Agent 静态定义（代码注册，id 稳定不可变）
 * @see definitions/catalog.ts
 */
export interface AgentDefinition {
  /** 唯一 ID，如 studio-chat、chapter、onboarding */
  id: string
  /** 展示名 */
  name: string
  /** 功能说明 */
  description: string
  /** 业务分类 */
  category: AgentCategory
  /**
   * 提示词槽位
   * - system / system.*：系统指令
   * - user / user.*：用户消息模板（任务型）
   */
  promptSlots: PromptSlotDefinition[]
  /** 默认采样温度 */
  temperature?: number
  /** 工具循环最大步数（chat / tool agent） */
  maxSteps?: number
  /**
   * 是否可在 Studio Chat 中切换使用
   * true 时与界面聊天共用 UIMessage 流式协议
   */
  chatCompatible?: boolean
}

/** 设置页 / API 返回的 Agent 清单项（含已解析提示词） */
export interface AgentCatalogItem {
  id: string
  name: string
  description: string
  category: AgentCategory
  chatCompatible: boolean
  promptSlots: ResolvedPromptSlot[]
}

/**
 * 任务型 Agent 运行请求（非多轮 chat）
 * chat 场景由 messages 驱动，使用 renderAgentSlot 即可
 */
export interface AgentRunRequest {
  agentId: string
  /** 覆盖模型 ID */
  model?: string
  /** 插值变量，用于渲染 prompt slots */
  variables?: Record<string, unknown>
  /**
   * 直接指定用户消息（跳过 user slot 模板）
   * 未传则用 user 槽位 + variables 渲染
   */
  userMessage?: string
  /** system 槽位键，默认 system；多模板 agent 如 system.plan */
  systemSlot?: string
  /** user 槽位键，默认 user；多模板 agent 如 user.continue */
  userSlot?: string
  /** 附加系统上下文（如项目 context），拼在 system 之后 */
  contextAppend?: string
  temperature?: number
  /** 最大输出 token（传给 Provider） */
  maxTokens?: number
}

/** 任务型 Agent 运行结果（散文） */
export interface AgentRunResult {
  agentId: string
  /** 模型输出正文 */
  text: string
  /** 实际使用的 system（调试 / 落库） */
  systemPrompt: string
  /** 实际使用的 user（调试 / 落库） */
  userPrompt: string
  provider?: string
  modelUsed?: string
  /** 耗时 ms */
  duration?: number
  tokensUsed?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  cost?: number
}

/** 结构化任务运行结果 */
export interface AgentObjectResult<T> extends Omit<AgentRunResult, 'text'> {
  /** 已通过 Zod 校验的对象 */
  object: T
  /** 原始 JSON 字符串（调试 / 落库） */
  text: string
}
