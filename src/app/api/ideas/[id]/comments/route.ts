import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, ApiErrors, withErrorHandler } from '@/lib/api/response'
import { parseJsonBody, validateRequest, validateQuery } from '@/lib/api/validators'
import { CreateIdeaCommentSchema, IdeaCommentQuerySchema } from '@/lib/api/schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id } = await params
    const query = validateQuery(IdeaCommentQuerySchema, request.nextUrl.searchParams)

    const idea = await prisma.idea.findUnique({ where: { id } })
    if (!idea) {
      return ApiErrors.notFound('创意')
    }

    const skip = (query.page - 1) * query.limit
    const [comments, total] = await Promise.all([
      prisma.ideaComment.findMany({
        where: { ideaId: id },
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.ideaComment.count({ where: { ideaId: id } }),
    ])

    return apiSuccess({ comments, total, page: query.page, limit: query.limit })
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id } = await params
    const body = await parseJsonBody(request)
    const { content } = validateRequest(CreateIdeaCommentSchema, body)

    const idea = await prisma.idea.findUnique({ where: { id } })
    if (!idea) {
      return ApiErrors.notFound('创意')
    }

    const comment = await prisma.ideaComment.create({
      data: { ideaId: id, content },
    })

    // 更新评论计数
    const commentCount = await prisma.ideaComment.count({ where: { ideaId: id } })
    await prisma.idea.update({
      where: { id },
      data: { commentCount },
    })

    return apiSuccess({ comment }, 201)
  })
}
