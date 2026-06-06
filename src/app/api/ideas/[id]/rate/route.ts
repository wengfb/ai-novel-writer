import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, ApiErrors, withErrorHandler } from '@/lib/api/response'
import { parseJsonBody, validateRequest } from '@/lib/api/validators'
import { CreateIdeaRatingSchema } from '@/lib/api/schemas'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id } = await params
    const body = await parseJsonBody(request)
    const { score } = validateRequest(CreateIdeaRatingSchema, body)

    // 确保创意存在
    const idea = await prisma.idea.findUnique({ where: { id } })
    if (!idea) {
      return ApiErrors.notFound('创意')
    }

    // 创建评分记录（简单模式：每次评分创建新记录）
    const rating = await prisma.ideaRating.create({
      data: { ideaId: id, score },
    })

    // 重新计算平均分
    const agg = await prisma.ideaRating.aggregate({
      where: { ideaId: id },
      _avg: { score: true },
      _count: { score: true },
    })

    const avgRating = Math.round((agg._avg.score || 0) * 10) / 10
    const ratingCount = agg._count.score || 0

    await prisma.idea.update({
      where: { id },
      data: { avgRating, ratingCount },
    })

    return apiSuccess({ rating, avgRating, ratingCount })
  })
}
