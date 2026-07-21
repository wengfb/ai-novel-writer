/**
 * Agent 提示词存储
 *
 * 读路径：DB（AgentPrompt）覆盖优先 → 代码默认（AgentDefinition.promptSlots）
 * 写路径：save / reset 后清缓存，保证后续请求读到新值
 *
 * 注意：缓存是进程内 15s TTL，多实例部署时各自独立
 */

import { prisma } from '@/lib/db/prisma'
import type {
  AgentDefinition,
  PromptSlotDefinition,
  PromptVariableMeta,
  ResolvedPromptSlot,
} from './types'
import { normalizePromptContent } from './prompt-utils'

/** agentId::slotKey → 槽位（仅缓存 DB 行，defaultContent 在 resolve 时回填） */
let cache: Map<string, ResolvedPromptSlot> | null = null
let cacheExpiry = 0
const CACHE_TTL = 15_000

function cacheKey(agentId: string, slotKey: string) {
  return `${agentId}::${slotKey}`
}

/** 清除提示词缓存（保存/重置后必须调用） */
export function clearPromptCache() {
  cache = null
  cacheExpiry = 0
}

/** 解析 AgentPrompt.variables JSON */
function parseVariables(raw: string | null | undefined): PromptVariableMeta[] | undefined {
  if (!raw) return undefined
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as PromptVariableMeta[]) : undefined
  } catch {
    return undefined
  }
}

/**
 * 合并代码默认定义与可选 DB 行
 * @param def 代码侧槽位定义
 * @param row DB 行；null 表示使用默认
 */
function resolveSlot(
  def: PromptSlotDefinition,
  row?: {
    content: string
    name: string
    description: string | null
    variables: string | null
    version: number
    isCustom: boolean
  } | null
): ResolvedPromptSlot {
  if (!row) {
    return {
      key: def.key,
      name: def.name,
      description: def.description,
      content: def.defaultContent,
      defaultContent: def.defaultContent,
      variables: def.variables,
      isCustom: false,
      version: 0,
    }
  }

  return {
    key: def.key,
    name: row.name || def.name,
    description: row.description ?? def.description,
    content: row.content,
    defaultContent: def.defaultContent,
    variables: parseVariables(row.variables) ?? def.variables,
    isCustom: row.isCustom,
    version: row.version,
  }
}

/**
 * 解析某 Agent 的全部提示词槽位（已应用用户覆盖）
 * @param definition 静态定义
 */
export async function resolveAgentPrompts(
  definition: AgentDefinition
): Promise<ResolvedPromptSlot[]> {
  const now = Date.now()
  if (!cache || now >= cacheExpiry) {
    cache = new Map()
    try {
      const rows = await prisma.agentPrompt.findMany()
      for (const row of rows) {
        cache.set(cacheKey(row.agentId, row.slotKey), {
          key: row.slotKey,
          name: row.name,
          description: row.description ?? undefined,
          content: row.content,
          // 占位；真正 default 在下方用定义回填
          defaultContent: row.content,
          variables: parseVariables(row.variables),
          isCustom: row.isCustom,
          version: row.version,
        })
      }
    } catch {
      // 表未迁移或 DB 暂不可用：降级为纯默认
      cache = new Map()
    }
    cacheExpiry = now + CACHE_TTL
  }

  return definition.promptSlots.map((slot) => {
    const cached = cache!.get(cacheKey(definition.id, slot.key))
    if (!cached) return resolveSlot(slot, null)
    return {
      ...cached,
      defaultContent: slot.defaultContent,
      variables: cached.variables ?? slot.variables,
      name: cached.name || slot.name,
      description: cached.description ?? slot.description,
    }
  })
}

/**
 * 取某 Agent 指定 slot 的最终 content
 * @throws 槽位不存在
 */
export async function getPromptContent(
  definition: AgentDefinition,
  slotKey: string
): Promise<string> {
  const slots = await resolveAgentPrompts(definition)
  const slot = slots.find((s) => s.key === slotKey)
  if (!slot) {
    throw new Error(`Agent ${definition.id} 没有提示词槽位: ${slotKey}`)
  }
  return slot.content
}

/** 保存提示词的请求体 */
export interface SavePromptInput {
  agentId: string
  slotKey: string
  content: string
  name?: string
  description?: string
}

/**
 * 保存用户自定义提示词
 * content 与默认完全一致时 isCustom=false（仍落库，便于审计）
 */
export async function saveAgentPrompt(
  definition: AgentDefinition,
  input: SavePromptInput
): Promise<ResolvedPromptSlot> {
  const slotDef = definition.promptSlots.find((s) => s.key === input.slotKey)
  if (!slotDef) {
    throw new Error(`Agent ${definition.id} 没有提示词槽位: ${input.slotKey}`)
  }

  const content = normalizePromptContent(input.content)
  const isCustom = content !== normalizePromptContent(slotDef.defaultContent)
  const name = input.name || slotDef.name
  const description = input.description ?? slotDef.description ?? null
  const variables = slotDef.variables ? JSON.stringify(slotDef.variables) : null

  const existing = await prisma.agentPrompt.findUnique({
    where: {
      agentId_slotKey: {
        agentId: definition.id,
        slotKey: input.slotKey,
      },
    },
  })

  const row = existing
    ? await prisma.agentPrompt.update({
        where: { id: existing.id },
        data: {
          content,
          name,
          description,
          variables,
          isCustom,
          version: existing.version + 1,
        },
      })
    : await prisma.agentPrompt.create({
        data: {
          agentId: definition.id,
          slotKey: input.slotKey,
          content,
          name,
          description,
          variables,
          isCustom,
          version: 1,
        },
      })

  clearPromptCache()
  return resolveSlot(slotDef, row)
}

/**
 * 重置单个槽位为代码默认（删除覆盖行）
 */
export async function resetAgentPrompt(
  definition: AgentDefinition,
  slotKey: string
): Promise<ResolvedPromptSlot> {
  const slotDef = definition.promptSlots.find((s) => s.key === slotKey)
  if (!slotDef) {
    throw new Error(`Agent ${definition.id} 没有提示词槽位: ${slotKey}`)
  }

  await prisma.agentPrompt.deleteMany({
    where: { agentId: definition.id, slotKey },
  })
  clearPromptCache()
  return resolveSlot(slotDef, null)
}

/** 重置某 Agent 全部槽位为代码默认 */
export async function resetAllAgentPrompts(
  definition: AgentDefinition
): Promise<ResolvedPromptSlot[]> {
  await prisma.agentPrompt.deleteMany({ where: { agentId: definition.id } })
  clearPromptCache()
  return definition.promptSlots.map((s) => resolveSlot(s, null))
}
