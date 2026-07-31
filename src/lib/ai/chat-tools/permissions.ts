import type { AssistantScopeType } from '@/lib/ai/agent-workspace'

/** Chat Agent 的最小工具集；写工具自身仍会请求用户审批。 */
const TOOL_ALLOWLIST: Record<string, readonly string[]> = {
  'studio-chat': [
    'createCharacter', 'updateCharacter', 'createWorldElement', 'updateWorldElement',
    'updateChapterContent', 'createChapter', 'getProjectInfo', 'createOutline',
    'updateOutline', 'createForeshadowing', 'resolveForeshadowing',
    'listForeshadowings', 'checkWorldConsistency',
  ],
  character: ['createCharacter', 'updateCharacter', 'getProjectInfo', 'listForeshadowings', 'checkWorldConsistency'],
  outline: ['createOutline', 'updateOutline', 'getProjectInfo', 'listForeshadowings'],
  chapter: ['updateChapterContent', 'createChapter', 'getProjectInfo', 'listForeshadowings', 'checkWorldConsistency'],
  world: ['createWorldElement', 'updateWorldElement', 'getProjectInfo', 'checkWorldConsistency'],
  consistency: ['getProjectInfo', 'listForeshadowings', 'checkWorldConsistency'],
  rewrite: [],
}

export function getAllowedChatTools(agentId: string, scopeType?: AssistantScopeType) {
  const allowed = TOOL_ALLOWLIST[agentId] ?? TOOL_ALLOWLIST['studio-chat']
  // 作用域为兜底约束：审校不因传入错误作用域获得写工具。
  if (scopeType === 'character' && agentId === 'character') return allowed
  return allowed
}
