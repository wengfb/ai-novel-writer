import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, ApiErrors, withErrorHandler } from '@/lib/api/response'
import { validateRequest } from '@/lib/api/validators'
import { z } from 'zod'

/**
 * 世界观管理 API
 * GET /api/projects/[projectId]/world-elements - 获取世界观元素列表
 * POST /api/projects/[projectId]/world-elements - 创建世界观元素
 */

// 查询参数 Schema
const WorldElementQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  type: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// 创建世界观元素 Schema
const CreateWorldElementSchema = z.object({
  type: z.string().min(1, '类型不能为空'),
  name: z.string().min(1, '名称不能为空').max(200, '名称最多200个字符'),
  description: z.string().optional(),
  attributes: z.union([z.record(z.any(), z.any()), z.string()]).optional(),
  rules: z.array(z.string()).optional(),
  relatedTo: z.union([z.array(z.string()), z.string()]).optional(),
  references: z.union([z.array(z.string()), z.string()]).optional(),
})

/**
 * GET /api/projects/[projectId]/world-elements
 * 获取世界观元素列表
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  return withErrorHandler(async () => {
    const { projectId } = await params

    // 验证查询参数
    const query = validateRequest(WorldElementQuerySchema, Object.fromEntries(request.nextUrl.searchParams))

    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return ApiErrors.projectNotFound()
    }

    // 分页和排序
    const { page, limit, type, sortBy, sortOrder } = query
    const skip = (page - 1) * limit

    // 构建查询条件
    const where: any = { projectId }
    if (type) {
      where.type = type
    }

    // 查询世界观元素列表
    const [elements, total] = await Promise.all([
      prisma.worldElement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.worldElement.count({ where }),
    ])

    return apiSuccess({
      elements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  })
}

/**
 * POST /api/projects/[projectId]/world-elements
 * 创建世界观元素
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  return withErrorHandler(async () => {
    const { projectId } = await params

    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return ApiErrors.projectNotFound()
    }

    // 验证请求数据
    const data = validateRequest(CreateWorldElementSchema, await request.json())

    // 处理字段转换（将对象/数组转换为 JSON 字符串）
    const attributesValue = typeof data.attributes === 'object'
      ? JSON.stringify(data.attributes || {})
      : data.attributes || undefined

    const relatedToValue = Array.isArray(data.relatedTo)
      ? JSON.stringify(data.relatedTo)
      : data.relatedTo

    const referencesValue = Array.isArray(data.references)
      ? JSON.stringify(data.references)
      : data.references

    // 将 rules 合并到 attributes
    let finalAttributes = attributesValue
    if (data.rules && data.rules.length > 0) {
      const attrs = typeof data.attributes === 'object' ? data.attributes : {}
      finalAttributes = JSON.stringify({
        ...attrs,
        rules: data.rules,
      })
    }

    // 创建世界观元素
    const element = await prisma.worldElement.create({
      data: {
        projectId,
        type: data.type as any,
        name: data.name,
        description: data.description || '',
        attributes: finalAttributes,
        relatedTo: relatedToValue,
        references: referencesValue,
      },
    })

    return apiSuccess({ element }, 201)
  })
}
