import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, ApiErrors, withErrorHandler } from '@/lib/api/response'
import { validateRequest } from '@/lib/api/validators'
import { z } from 'zod'

/**
 * 世界观元素详情 API
 * GET /api/world-elements/[elementId] - 获取世界观元素详情
 * PUT /api/world-elements/[elementId] - 更新世界观元素
 * DELETE /api/world-elements/[elementId] - 删除世界观元素
 */

// 更新世界观元素 Schema（所有字段可选）
const UpdateWorldElementSchema = z.object({
  type: z.string().min(1, '类型不能为空').optional(),
  name: z.string().min(1, '名称不能为空').max(200, '名称最多200个字符').optional(),
  description: z.string().optional(),
  attributes: z.union([z.record(z.any(), z.any()), z.string()]).optional(),
  rules: z.array(z.string()).optional(),
  relatedTo: z.union([z.array(z.string()), z.string()]).optional(),
  references: z.union([z.array(z.string()), z.string()]).optional(),
})

/**
 * GET /api/world-elements/[elementId]
 * 获取世界观元素详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ elementId: string }> }
) {
  return withErrorHandler(async () => {
    const { elementId } = await params

    const element = await prisma.worldElement.findUnique({
      where: { id: elementId },
    })

    if (!element) {
      return ApiErrors.notFound('世界观元素')
    }

    return apiSuccess({ element })
  })
}

/**
 * PUT /api/world-elements/[elementId]
 * 更新世界观元素
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ elementId: string }> }
) {
  return withErrorHandler(async () => {
    const { elementId } = await params

    // 检查世界观元素是否存在
    const existing = await prisma.worldElement.findUnique({
      where: { id: elementId },
    })

    if (!existing) {
      return ApiErrors.notFound('世界观元素')
    }

    // 验证请求数据
    const data = validateRequest(UpdateWorldElementSchema, await request.json())

    // 处理字段转换
    const updateData: any = {}
    if (data.type !== undefined) updateData.type = data.type as any
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description

    if (data.attributes !== undefined || data.rules !== undefined) {
      const attrs = typeof data.attributes === 'object' ? data.attributes : {}
      if (data.rules && data.rules.length > 0) {
        updateData.attributes = JSON.stringify({
          ...attrs,
          rules: data.rules,
        })
      } else if (typeof data.attributes === 'object') {
        updateData.attributes = JSON.stringify(data.attributes)
      } else {
        updateData.attributes = data.attributes
      }
    }

    if (data.relatedTo !== undefined) {
      updateData.relatedTo = Array.isArray(data.relatedTo)
        ? JSON.stringify(data.relatedTo)
        : data.relatedTo
    }

    if (data.references !== undefined) {
      updateData.references = Array.isArray(data.references)
        ? JSON.stringify(data.references)
        : data.references
    }

    // 更新世界观元素
    const element = await prisma.worldElement.update({
      where: { id: elementId },
      data: updateData,
    })

    return apiSuccess({ element })
  })
}

/**
 * DELETE /api/world-elements/[elementId]
 * 删除世界观元素
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ elementId: string }> }
) {
  return withErrorHandler(async () => {
    const { elementId } = await params

    // 检查世界观元素是否存在
    const existing = await prisma.worldElement.findUnique({
      where: { id: elementId },
    })

    if (!existing) {
      return ApiErrors.notFound('世界观元素')
    }

    // 删除世界观元素
    await prisma.worldElement.delete({
      where: { id: elementId },
    })

    return apiSuccess({
      deleted: true,
      message: '世界观元素已删除',
    })
  })
}
