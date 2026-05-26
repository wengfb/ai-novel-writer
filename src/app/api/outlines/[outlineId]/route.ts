import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, ApiErrors, withErrorHandler } from '@/lib/api/response'
import { validateRequest } from '@/lib/api/validators'
import { z } from 'zod'

/**
 * 大纲节点详情 API
 * GET /api/outlines/[outlineId] - 获取大纲节点详情
 * PUT /api/outlines/[outlineId] - 更新大纲节点
 * DELETE /api/outlines/[outlineId] - 删除大纲节点
 */

// 更新大纲 Schema（所有字段可选）
const UpdateOutlineSchema = z.object({
  type: z.enum(['volume', 'chapter', 'scene'], {
    errorMap: () => ({ message: '无效的大纲类型' }),
  } as any).optional(),
  order: z.number().int().positive('序号必须是正整数').optional(),
  title: z.string().min(1, '标题不能为空').max(200, '标题最多200个字符').optional(),
  description: z.string().optional().nullable(),
  targetWords: z.number().int().positive().optional().nullable(),
  parentId: z.string().optional().nullable(),
  chapterId: z.string().optional().nullable(),
  status: z.enum(['planned', 'writing', 'completed']).optional(),
  keyEvents: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
  emotionalGoal: z.string().optional().nullable(),
  plotFunction: z.enum(['推进', '转折', '铺垫', '高潮', '过渡']).optional(),
  tensionLevel: z.number().int().min(1).max(10).optional(),
})

/**
 * GET /api/outlines/[outlineId]
 * 获取大纲节点详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ outlineId: string }> }
) {
  return withErrorHandler(async () => {
    const { outlineId } = await params

    const outline = await prisma.outline.findUnique({
      where: { id: outlineId },
      include: {
        chapter: {
          select: {
            id: true,
            chapterNumber: true,
            title: true,
            wordCount: true,
            summary: true,
          },
        },
        parent: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
        children: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!outline) {
      return ApiErrors.notFound('大纲节点')
    }

    return apiSuccess({ outline })
  })
}

/**
 * PUT /api/outlines/[outlineId]
 * 更新大纲节点
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ outlineId: string }> }
) {
  return withErrorHandler(async () => {
    const { outlineId } = await params

    // 检查大纲节点是否存在
    const existing = await prisma.outline.findUnique({
      where: { id: outlineId },
    })

    if (!existing) {
      return ApiErrors.notFound('大纲节点')
    }

    // 验证请求数据
    const data = validateRequest(UpdateOutlineSchema, await request.json())

    // 如果要修改 parentId，检查父节点是否存在且不是自己或自己的子孙节点
    if (data.parentId !== undefined) {
      if (data.parentId === outlineId) {
        return apiError('INVALID_PARENT', '不能将自己设为父节点', undefined, 400)
      }

      if (data.parentId) {
        const parent = await prisma.outline.findUnique({
          where: { id: data.parentId },
        })

        if (!parent) {
          return apiError('INVALID_PARENT', '父节点不存在', undefined, 400)
        }
      }
    }

    // 如果要修改 chapterId，检查章节是否存在
    if (data.chapterId !== undefined) {
      if (data.chapterId) {
        const chapter = await prisma.chapter.findUnique({
          where: { id: data.chapterId },
        })

        if (!chapter) {
          return apiError('INVALID_CHAPTER', '关联章节不存在', undefined, 400)
        }
      }
    }

    // 更新大纲节点
    const outline = await prisma.outline.update({
      where: { id: outlineId },
      data: {
        ...data,
        type: data.type ? (data.type as any) : undefined,
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

    return apiSuccess({ outline })
  })
}

/**
 * DELETE /api/outlines/[outlineId]
 * 删除大纲节点（会级联删除子节点）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ outlineId: string }> }
) {
  return withErrorHandler(async () => {
    const { outlineId } = await params

    // 检查大纲节点是否存在
    const existing = await prisma.outline.findUnique({
      where: { id: outlineId },
      include: {
        children: true,
      },
    })

    if (!existing) {
      return ApiErrors.notFound('大纲节点')
    }

    // 统计将要删除的节点数量（包括子节点）
    const countNodes = (node: any): number => {
      let count = 1
      for (const child of node.children) {
        count += countNodes(child)
      }
      return count
    }
    const deleteCount = countNodes(existing)

    // 删除大纲节点（会级联删除子节点）
    await prisma.outline.delete({
      where: { id: outlineId },
    })

    return apiSuccess({
      deleted: true,
      message: `已删除 ${deleteCount} 个大纲节点`,
      deleteCount,
    })
  })
}

// 辅助函数
function apiError(code: string, message: string, details?: any, status: number = 400) {
  return import('@/lib/api/response').then(m => m.apiError(code, message, details, status))
}
