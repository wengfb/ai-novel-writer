import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler, ApiErrors } from '@/lib/api/response'
import { parseJsonBody, validateQuery } from '@/lib/api/validators'
import { ProjectQuerySchema, CreateProjectSchema } from '@/lib/api/schemas'

/**
 * GET /api/projects
 * 获取项目列表
 */
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    // 验证查询参数
    const query = validateQuery(ProjectQuerySchema, request.nextUrl.searchParams)

    // 构建查询条件
    const where: any = {}
    if (query.status) {
      where.status = query.status
    }
    if (query.genre) {
      where.genre = query.genre
    }

    // 计算分页
    const skip = (query.page - 1) * query.limit

    // 查询项目
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          genre: true,
          tags: true,
          status: true,
          coverImage: true,
          totalWords: true,
          chapterCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.project.count({ where }),
    ])

    return apiSuccess({
      projects,
      total,
      page: query.page,
      limit: query.limit,
    })
  })
}

/**
 * POST /api/projects
 * 创建项目
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    // 解析并验证请求体
    const body = await parseJsonBody(request)
    const data = validateRequest(CreateProjectSchema, body)

    // 创建项目
    const project = await prisma.project.create({
      data: {
        title: data.title,
        description: data.description,
        genre: data.genre,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        status: data.status || 'draft',
        totalWords: 0,
        chapterCount: 0,
      },
    })

    return apiSuccess({ project }, 201)
  })
}

import { validateRequest } from '@/lib/api/validators'
