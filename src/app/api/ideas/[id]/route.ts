import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, ApiErrors, withErrorHandler } from '@/lib/api/response'
import { parseJsonBody, validateRequest } from '@/lib/api/validators'
import { UpdateIdeaSchema } from '@/lib/api/schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id } = await params

    const idea = await prisma.idea.findUnique({
      where: { id },
      include: {
        ratings: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        _count: { select: { ratings: true, comments: true } },
      },
    })

    if (!idea) {
      return ApiErrors.notFound('创意')
    }

    return apiSuccess({ idea })
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id } = await params
    const body = await parseJsonBody(request)
    const data = validateRequest(UpdateIdeaSchema, body)

    const existing = await prisma.idea.findUnique({ where: { id } })
    if (!existing) {
      return ApiErrors.notFound('创意')
    }

    const idea = await prisma.idea.update({
      where: { id },
      data,
    })

    return apiSuccess({ idea })
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id } = await params

    const existing = await prisma.idea.findUnique({ where: { id } })
    if (!existing) {
      return ApiErrors.notFound('创意')
    }

    await prisma.idea.delete({ where: { id } })

    return apiSuccess({ deleted: true })
  })
}
