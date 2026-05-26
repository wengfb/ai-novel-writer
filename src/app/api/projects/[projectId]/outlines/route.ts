import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, ApiErrors, withErrorHandler } from '@/lib/api/response'
import { validateRequest } from '@/lib/api/validators'
import { z } from 'zod'

/**
 * 大纲管理 API
 * GET /api/projects/[projectId]/outlines - 获取大纲列表
 * POST /api/projects/[projectId]/outlines - 创建大纲节点
 */

// 查询参数 Schema
const OutlineQuerySchema = z.object({
  type: z.enum(['volume', 'chapter', 'scene']).optional(),
  status: z.string().optional(),
  parentId: z.string().optional(),
  sortBy: z.enum(['order', 'createdAt', 'updatedAt']).optional().default('order'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
})

// 创建大纲 Schema
const CreateOutlineSchema = z.object({
  type: z.enum(['volume', 'chapter', 'scene'], {
    errorMap: () => ({ message: '无效的大纲类型' }),
  } as any),
  order: z.number().int().positive('序号必须是正整数'),
  title: z.string().min(1, '标题不能为空').max(200, '标题最多200个字符'),
  description: z.string().optional().nullable(),
  targetWords: z.number().int().positive().optional().nullable(),
  parentId: z.string().optional().nullable(),
  chapterId: z.string().optional().nullable(),
  status: z.enum(['planned', 'writing', 'completed']).optional().default('planned'),
  notes: z.string().optional().nullable(),
  emotionalGoal: z.string().optional().nullable(),
  plotFunction: z.enum(['推进', '转折', '铺垫', '高潮', '过渡']).optional().default('推进'),
  tensionLevel: z.number().int().min(1).max(10).optional().default(5),
})

/**
 * GET /api/projects/[projectId]/outlines
 * 获取大纲列表
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  return withErrorHandler(async () => {
    const { projectId } = await params

    // 验证查询参数
    const query = validateRequest(OutlineQuerySchema, Object.fromEntries(request.nextUrl.searchParams))

    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return ApiErrors.projectNotFound()
    }

    // 构建查询条件
    const where: any = { projectId }
    if (query.type) where.type = query.type
    if (query.status) where.status = query.status
    if (query.parentId !== undefined) {
      where.parentId = query.parentId || null
    }

    // 查询大纲列表
    const outlines = await prisma.outline.findMany({
      where,
      orderBy: { [query.sortBy]: query.sortOrder },
      include: {
        chapter: {
          select: {
            id: true,
            chapterNumber: true,
            title: true,
            wordCount: true,
          },
        },
      },
    })

    // 构建树形结构
    const buildTree = (parentId: string | null = null): any[] => {
      return outlines
        .filter(o => o.parentId === parentId)
        .map(o => ({
          ...o,
          children: buildTree(o.id),
        }))
    }

    const tree = buildTree()

    return apiSuccess({
      outlines: tree,
      flat: outlines,
    })
  })
}

/**
 * POST /api/projects/[projectId]/outlines
 * 创建大纲节点
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
    const data = validateRequest(CreateOutlineSchema, await request.json())

    // 如果指定了 parentId，检查父节点是否存在
    if (data.parentId) {
      const parent = await prisma.outline.findUnique({
        where: { id: data.parentId },
      })

      if (!parent) {
        return apiError('INVALID_PARENT', '父节点不存在', undefined, 400)
      }
    }

    // 如果指定了 chapterId，检查章节是否存在
    if (data.chapterId) {
      const chapter = await prisma.chapter.findUnique({
        where: { id: data.chapterId },
      })

      if (!chapter) {
        return apiError('INVALID_CHAPTER', '关联章节不存在', undefined, 400)
      }
    }

    // 创建大纲节点
    const outline = await prisma.outline.create({
      data: {
        projectId,
        ...data,
      },
      include: {
        chapter: {
          select: {
            id: true,
            chapterNumber: true,
            title: true,
            wordCount: true,
          },
        },
      },
    })

    return apiSuccess({ outline }, 201)
  })
}

// 辅助函数
function apiError(code: string, message: string, details?: any, status: number = 400) {
  return import('@/lib/api/response').then(m => m.apiError(code, message, details, status))
}
