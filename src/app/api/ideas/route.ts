import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { parseJsonBody, validateRequest, validateQuery } from '@/lib/api/validators'
import { IdeaQuerySchema, CreateIdeaSchema } from '@/lib/api/schemas'

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const query = validateQuery(IdeaQuerySchema, request.nextUrl.searchParams)

    const where: any = {}
    if (query.status) where.status = query.status
    if (query.genre) where.genre = query.genre
    if (query.aiGenerated !== undefined) where.aiGenerated = query.aiGenerated

    const orderBy: any = { [query.sortBy]: query.sortOrder }
    const skip = (query.page - 1) * query.limit

    const [ideas, total] = await Promise.all([
      prisma.idea.findMany({
        where,
        skip,
        take: query.limit,
        orderBy,
        select: {
          id: true,
          title: true,
          genre: true,
          worldBuilding: true,
          protagonist: true,
          coreConflict: true,
          mainGoal: true,
          highConcept: true,
          sublimation: true,
          openingHook: true,
          source: true,
          status: true,
          convertedToProjectId: true,
          rating: true,
          commentCount: true,
          aiGenerated: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.idea.count({ where }),
    ])

    return apiSuccess({ ideas, total, page: query.page, limit: query.limit })
  })
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const body = await parseJsonBody(request)
    const data = validateRequest(CreateIdeaSchema, body)

    const idea = await prisma.idea.create({
      data: {
        title: data.title,
        genre: data.genre,
        worldBuilding: data.worldBuilding,
        protagonist: data.protagonist,
        coreConflict: data.coreConflict,
        mainGoal: data.mainGoal,
        highConcept: data.highConcept,
        sublimation: data.sublimation,
        openingHook: data.openingHook,
        source: data.source,
        status: data.status || 'draft',
        aiGenerated: data.aiGenerated ?? false,
      },
    })

    return apiSuccess({ idea }, 201)
  })
}
