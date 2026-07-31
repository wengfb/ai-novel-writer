import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { ApiErrors } from '@/lib/api/response'

const Schema = z.object({
  confirmedFacts: z.array(z.string()).optional(),
  openQuestions: z.array(z.string()).optional(),
  itemStatuses: z.array(z.object({ id: z.string(), status: z.enum(['candidate', 'accepted', 'dismissed', 'resolved']) })).optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const input = Schema.parse(await request.json())
    const changeSet = await prisma.changeSet.update({
      where: { id },
      data: {
        ...(input.confirmedFacts ? { confirmedFacts: JSON.stringify(input.confirmedFacts) } : {}),
        ...(input.openQuestions ? { openQuestions: JSON.stringify(input.openQuestions) } : {}),
        ...(input.itemStatuses ? { items: { update: input.itemStatuses.map((item) => ({ where: { id: item.id }, data: { status: item.status } })) } } : {}),
      },
      include: { items: true },
    })
    return Response.json({ data: { changeSet } })
  } catch (error) {
    return ApiErrors.badRequest(error instanceof Error ? error.message : '更新变更草稿失败')
  }
}
