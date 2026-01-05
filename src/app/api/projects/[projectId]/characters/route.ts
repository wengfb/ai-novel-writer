import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, ApiErrors, withErrorHandler } from '@/lib/api/response'
import { validateRequest } from '@/lib/api/validators'
import { z } from 'zod'

/**
 * 角色管理 API
 * GET /api/projects/[projectId]/characters - 获取角色列表
 * POST /api/projects/[projectId]/characters - 创建角色
 */

// 查询参数 Schema
const CharacterQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// 创建角色 Schema
const CreateCharacterSchema = z.object({
  name: z.string().min(1, '角色名不能为空').max(100, '角色名最多100个字符'),
  nickname: z.string().max(50, '昵称最多50个字符').optional().nullable(),
  age: z.number().int().positive().optional().nullable(),
  gender: z.string().max(20, '性别最多20个字符').optional().nullable(),
  appearance: z.string().optional().nullable(),
  personality: z.union([z.string(), z.array(z.string())]).optional(),
  backstory: z.string().optional().nullable(),
  motivation: z.string().optional().nullable(),
  dialogueStyle: z.string().optional().nullable(),
  characterArc: z.string().optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  relationships: z.union([z.record(z.string(), z.string()), z.string()]).optional().nullable(),
})

/**
 * GET /api/projects/[projectId]/characters
 * 获取角色列表
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  return withErrorHandler(async () => {
    const { projectId } = await params

    // 验证查询参数
    const query = validateRequest(CharacterQuerySchema, Object.fromEntries(request.nextUrl.searchParams))

    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return ApiErrors.projectNotFound()
    }

    // 分页和排序
    const { page, limit, sortBy, sortOrder } = query
    const skip = (page - 1) * limit

    // 查询角色列表
    const [characters, total] = await Promise.all([
      prisma.character.findMany({
        where: { projectId },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.character.count({ where: { projectId } }),
    ])

    return apiSuccess({
      characters,
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
 * POST /api/projects/[projectId]/characters
 * 创建角色
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
    const data = validateRequest(CreateCharacterSchema, await request.json())

    // 处理 personality 字段（可能是字符串或数组）
    const personalityValue = Array.isArray(data.personality)
      ? data.personality.join('、')
      : data.personality

    // 处理 relationships 字段（可能是对象或字符串）
    const relationshipsValue = typeof data.relationships === 'object'
      ? JSON.stringify(data.relationships)
      : data.relationships

    // 创建角色
    const character = await prisma.character.create({
      data: {
        projectId,
        name: data.name,
        nickname: data.nickname,
        age: data.age,
        gender: data.gender,
        appearance: data.appearance,
        personality: personalityValue,
        backstory: data.backstory,
        motivation: data.motivation,
        dialogueStyle: data.dialogueStyle,
        characterArc: data.characterArc,
        avatar: data.avatar,
        relationships: relationshipsValue,
      },
    })

    return apiSuccess({ character }, 201)
  })
}
