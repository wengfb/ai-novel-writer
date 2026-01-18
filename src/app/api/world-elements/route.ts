import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { validateRequest } from '@/lib/api/validators'
import { z } from 'zod'

/**
 * 世界观元素列表 API
 * POST /api/world-elements - 创建世界观元素
 */

// 创建世界观元素 Schema
const CreateWorldElementSchema = z.object({
  projectId: z.string().min(1, '项目ID不能为空'),
  name: z.string().min(1, '名称不能为空').max(100, '名称最多100个字符'),
  type: z.enum(['location', 'history', 'magic', 'organization', 'item', 'other']),
  description: z.string().min(1, '描述不能为空'),
  attributes: z.union([z.record(z.string(), z.any()), z.string()]).optional().nullable(),
  importance: z.number().int().min(1).max(10).default(5),
  scope: z.enum(['global', 'regional', 'local']).default('local'),
  category: z.enum(['core_rule', 'detail', 'background']).default('detail'),
  isEvolvable: z.boolean().default(false),
  parentId: z.string().optional().nullable(),
  constraints: z.union([z.record(z.string(), z.any()), z.string()]).optional().nullable(),
  exceptions: z.union([z.record(z.string(), z.any()), z.string()]).optional().nullable(),
})

/**
 * POST /api/world-elements
 * 创建世界观元素
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    // 验证请求数据
    const data = validateRequest(CreateWorldElementSchema, await request.json())

    // 处理 JSON 字段（可能是对象或字符串）
    const attributesStr = data.attributes
      ? typeof data.attributes === 'object'
        ? JSON.stringify(data.attributes)
        : data.attributes
      : null

    const constraintsStr = data.constraints
      ? typeof data.constraints === 'object'
        ? JSON.stringify(data.constraints)
        : data.constraints
      : null

    const exceptionsStr = data.exceptions
      ? typeof data.exceptions === 'object'
        ? JSON.stringify(data.exceptions)
        : data.exceptions
      : null

    // 创建世界观元素
    const worldElement = await prisma.worldElement.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        type: data.type,
        description: data.description,
        attributes: attributesStr,
        importance: data.importance,
        scope: data.scope,
        category: data.category,
        isEvolvable: data.isEvolvable,
        parentId: data.parentId,
        constraints: constraintsStr,
        exceptions: exceptionsStr,
      },
    })

    return apiSuccess({ worldElement })
  })
}
