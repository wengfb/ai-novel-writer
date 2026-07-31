import { prisma } from '@/lib/db/prisma'
import type { AgentRuntimeConfig } from './types'

export type { AgentRuntimeConfig } from './types'

const keyFor = (agentId: string, field: keyof AgentRuntimeConfig) =>
  `agent.${agentId}.${field}`

function parseNumber(value: string | undefined, min: number, max: number): number | undefined {
  if (!value?.trim()) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : undefined
}

/** 获取 Agent 的已保存运行参数。 */
export async function getAgentRuntimeConfig(agentId: string): Promise<AgentRuntimeConfig> {
  const rows = await prisma.systemSetting.findMany({
    where: {
      key: { in: [keyFor(agentId, 'model'), keyFor(agentId, 'temperature'), keyFor(agentId, 'maxTokens')] },
    },
  })
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]))

  return {
    model: values[keyFor(agentId, 'model')]?.trim() || undefined,
    temperature: parseNumber(values[keyFor(agentId, 'temperature')], 0, 2),
    maxTokens: parseNumber(values[keyFor(agentId, 'maxTokens')], 1, 200_000),
  }
}

/** 保存 Agent 运行参数。空值表示恢复为全局默认。 */
export async function saveAgentRuntimeConfig(
  agentId: string,
  config: AgentRuntimeConfig
): Promise<void> {
  const fields: Array<[keyof AgentRuntimeConfig, string | number | undefined]> = [
    ['model', config.model?.trim()],
    ['temperature', config.temperature],
    ['maxTokens', config.maxTokens],
  ]

  await prisma.$transaction(fields.map(([field, value]) => {
    const key = keyFor(agentId, field)
    if (value === undefined || value === '') {
      return prisma.systemSetting.deleteMany({ where: { key } })
    }
    return prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: {
        key,
        value: String(value),
        category: 'agent',
        description: `Agent ${agentId} 的${field}`,
      },
    })
  }))
}
