import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, ApiErrors, withErrorHandler } from '@/lib/api/response'
import { parseJsonBody } from '@/lib/api/validators'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id } = await params
    const body: any = await parseJsonBody(request)
    const score = body?.score

    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return ApiErrors.badRequest('评分必须是 1-5 的整数')
    }

    const idea = await prisma.idea.findUnique({ where: { id } })
    if (!idea) {
      return ApiErrors.notFound('创意')
    }

    await prisma.idea.update({
      where: { id },
      data: { rating: score },
    })

    return apiSuccess({ rating: score })
  })
}
