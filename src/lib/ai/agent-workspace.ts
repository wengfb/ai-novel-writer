/** Agent Workspace 的结构化上下文，确保聊天参考的资产可追溯。 */
export type AssistantScopeType = 'project' | 'chapter' | 'character' | 'outline' | 'world'

export interface AssistantScope {
  type: AssistantScopeType
  id?: string
  title: string
  subtitle: string
  contextAppend?: string
}

export interface AgentWorkspaceOption {
  id: string
  label: string
  description: string
}

const OPTIONS: Record<string, AgentWorkspaceOption> = {
  'studio-chat': { id: 'studio-chat', label: '创作总监', description: '统筹项目方向、跨模块协作与下一步。' },
  'story-idea': { id: 'story-idea', label: '灵感编辑', description: '发散选题、卖点与开局方案。' },
  outline: { id: 'outline', label: '故事策划', description: '梳理大纲、节奏、冲突与伏笔。' },
  character: { id: 'character', label: '人物编辑', description: '完善人物动机、弧光与关系冲突。' },
  chapter: { id: 'chapter', label: '章节编辑', description: '协助场景设计、续写与章节打磨。' },
  world: { id: 'world', label: '设定顾问', description: '完善世界规则、势力与设定一致性。' },
  consistency: { id: 'consistency', label: '一致性审校', description: '只读检查人设、设定与时间线矛盾。' },
}

const SCOPE_AGENT_IDS: Record<AssistantScopeType, string[]> = {
  project: ['studio-chat', 'outline', 'consistency'],
  chapter: ['studio-chat', 'chapter', 'consistency'],
  character: ['studio-chat', 'character', 'outline', 'consistency'],
  outline: ['studio-chat', 'outline', 'character', 'consistency'],
  world: ['studio-chat', 'world', 'consistency'],
}

const DEFAULT_AGENT: Record<AssistantScopeType, string> = {
  project: 'studio-chat',
  chapter: 'chapter',
  character: 'character',
  outline: 'outline',
  world: 'world',
}

const QUICK_PROMPTS: Record<AssistantScopeType, string[]> = {
  project: ['补齐项目资料', '检查初始化缺口', '规划下一步'],
  chapter: ['设计下一场景', '检查章节节奏', '续写当前章节'],
  character: ['分析角色弧光', '设计关系冲突', '检查人物撞型'],
  outline: ['检查剧情节奏', '加强冲突与爽点', '梳理伏笔回收'],
  world: ['检查设定矛盾', '补充势力规则', '梳理能力体系'],
}

export function getAgentOptions(scope: AssistantScopeType): AgentWorkspaceOption[] {
  return SCOPE_AGENT_IDS[scope].map((id) => OPTIONS[id])
}

export function getDefaultAgent(scope: AssistantScopeType) {
  return DEFAULT_AGENT[scope]
}

export function getQuickPrompts(scope: AssistantScopeType) {
  return QUICK_PROMPTS[scope]
}

export function getAgentOption(agentId: string) {
  return OPTIONS[agentId] ?? OPTIONS['studio-chat']
}

export function getScopeKey(scope: AssistantScope) {
  return `${scope.type}:${scope.id ?? 'project'}`
}
