import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { ApiErrors } from '@/lib/api/response'
import { scanCharacterImpacts } from '@/lib/ai/change-set-service'

const Schema = z.object({
  sourceAgentId: z.string().default('character'),
  requestSummary: z.string().min(3),
  characterId: z.string(),
  confirmedFacts: z.array(z.string()).default([]),
})

/** 从角色改动创建可解释的候选影响草稿。 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params
    const input = Schema.parse(await request.json())
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } })
    if (!project) return ApiErrors.projectNotFound()

    const impacts = await scanCharacterImpacts(projectId, input.characterId)
    const changeSet = await prisma.changeSet.create({
      data: {
        projectId,
        sourceAgentId: input.sourceAgentId,
        title: '角色设定变更影响分析',
        requestSummary: input.requestSummary,
        confirmedFacts: JSON.stringify(input.confirmedFacts),
        status: 'ready',
        items: { create: impacts.map((item) => ({ ...item })) },
      },
      include: { items: true },
    })
    return Response.json({ data: { changeSet } })
  } catch (error) {
    console.error('Change set analyze error:', error)
    return ApiErrors.badRequest(error instanceof Error ? error.message : '影响分析请求无效')
  }
}
