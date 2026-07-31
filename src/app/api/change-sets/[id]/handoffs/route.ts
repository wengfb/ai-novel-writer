import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { ApiErrors } from '@/lib/api/response'
import { getAgentOption } from '@/lib/ai/agent-workspace'

const Schema = z.object({ toAgentId: z.enum(['studio-chat', 'outline', 'character', 'chapter', 'world', 'consistency']) })

function parseList(value: string) { try { return JSON.parse(value) as string[] } catch { return [] as string[] } }

/** 将用户确认的事实和候选影响交接到新的目标 Agent 会话。 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { toAgentId } = Schema.parse(await request.json())
    const changeSet = await prisma.changeSet.findUnique({ where: { id }, include: { items: true } })
    if (!changeSet) return ApiErrors.notFound('变更草稿')
    const facts = parseList(changeSet.confirmedFacts)
    const questions = parseList(changeSet.openQuestions)
    const accepted = changeSet.items.filter((item) => item.status === 'accepted' || item.status === 'candidate')
    const target = getAgentOption(toAgentId)
    const brief = [
      `原始需求：${changeSet.requestSummary}`,
      `已确认事实：${facts.length ? facts.map((item) => `- ${item}`).join('\n') : '尚未确认，请先向作者澄清。'}`,
      `候选影响：${accepted.length ? accepted.map((item) => `- [${item.resourceType}] ${item.resourceTitle}：${item.evidence}`).join('\n') : '规则扫描未发现确定命中。'}`,
      `待决事项：${questions.length ? questions.map((item) => `- ${item}`).join('\n') : '无'}`,
      `你的交付：作为${target.label}提出可审阅的调整方案。不要直接修改任何项目资产；如需写入，先说明并通过工具审批。`,
    ].join('\n\n')
    const conversation = await prisma.agentConversation.create({ data: { projectId: changeSet.projectId, scopeType: 'project', agentId: toAgentId, title: `${target.label}：${changeSet.title}`, contextSnapshot: brief } })
    const handoff = await prisma.agentHandoff.create({ data: { changeSetId: id, fromAgentId: changeSet.sourceAgentId, toAgentId, targetConversationId: conversation.id, brief, status: 'started' } })
    await prisma.changeSet.update({ where: { id }, data: { status: 'handed_off' } })
    return Response.json({ data: { handoff, conversation } })
  } catch (error) {
    return ApiErrors.badRequest(error instanceof Error ? error.message : '创建交接失败')
  }
}
