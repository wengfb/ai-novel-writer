import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, ApiErrors, withErrorHandler } from '@/lib/api/response'
import { validateRequest } from '@/lib/api/validators'
import { z } from 'zod'

/**
 * 角色详情 API
 * GET /api/characters/[characterId] - 获取角色详情
 * PUT /api/characters/[characterId] - 更新角色
 * DELETE /api/characters/[characterId] - 删除角色
 */

// 更新角色 Schema（所有字段可选）
const UpdateCharacterSchema = z.object({
  name: z.string().min(1, '角色名不能为空').max(100, '角色名最多100个字符').optional(),
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
 * GET /api/characters/[characterId]
 * 获取角色详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) {
  return withErrorHandler(async () => {
    const { characterId } = await params

    const character = await prisma.character.findUnique({
      where: { id: characterId },
    })

    if (!character) {
      return ApiErrors.notFound('角色')
    }

    return apiSuccess({ character })
  })
}

/**
 * PUT /api/characters/[characterId]
 * 更新角色
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) {
  return withErrorHandler(async () => {
    const { characterId } = await params

    // 检查角色是否存在
    const existing = await prisma.character.findUnique({
      where: { id: characterId },
    })

    if (!existing) {
      return ApiErrors.notFound('角色')
    }

    // 验证请求数据
    const data = validateRequest(UpdateCharacterSchema, await request.json())

    // 处理 personality 和 relationships 字段（可能是字符串或数组/对象）
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.nickname !== undefined) updateData.nickname = data.nickname
    if (data.age !== undefined) updateData.age = data.age
    if (data.gender !== undefined) updateData.gender = data.gender
    if (data.appearance !== undefined) updateData.appearance = data.appearance
    if (data.backstory !== undefined) updateData.backstory = data.backstory
    if (data.motivation !== undefined) updateData.motivation = data.motivation
    if (data.dialogueStyle !== undefined) updateData.dialogueStyle = data.dialogueStyle
    if (data.characterArc !== undefined) updateData.characterArc = data.characterArc
    if (data.avatar !== undefined) updateData.avatar = data.avatar

    if (data.personality !== undefined) {
      updateData.personality = Array.isArray(data.personality)
        ? data.personality.join('、')
        : data.personality
    }

    if (data.relationships !== undefined) {
      updateData.relationships = typeof data.relationships === 'object'
        ? JSON.stringify(data.relationships)
        : data.relationships
    }

    // 更新角色
    const character = await prisma.character.update({
      where: { id: characterId },
      data: updateData,
    })

    return apiSuccess({ character })
  })
}

/**
 * DELETE /api/characters/[characterId]
 * 删除角色
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) {
  return withErrorHandler(async () => {
    const { characterId } = await params

    // 检查角色是否存在
    const existing = await prisma.character.findUnique({
      where: { id: characterId },
    })

    if (!existing) {
      return ApiErrors.notFound('角色')
    }

    // 删除角色
    await prisma.character.delete({
      where: { id: characterId },
    })

    return apiSuccess({
      deleted: true,
      message: '角色已删除',
    })
  })
}
