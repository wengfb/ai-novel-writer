import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { validateRequest } from '@/lib/api/validators'
import { z } from 'zod'

/**
 * 角色列表 API
 * POST /api/characters - 创建角色
 */

// 创建角色 Schema
const CreateCharacterSchema = z.object({
  projectId: z.string().min(1, '项目ID不能为空'),
  name: z.string().min(1, '角色名不能为空').max(100, '角色名最多100个字符'),
  nickname: z.string().max(50, '昵称最多50个字符').optional().nullable(),
  age: z.number().int().positive().optional().nullable(),
  gender: z.string().max(20, '性别最多20个字符').optional().nullable(),
  importance: z.number().int().min(1).max(10).default(5),
  role: z.enum(['protagonist', 'antagonist', 'supporting', 'minor']).default('supporting'),
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
 * POST /api/characters
 * 创建角色
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    // 验证请求数据
    const data = validateRequest(CreateCharacterSchema, await request.json())

    // 处理 personality 字段（可能是字符串或数组）
    const personalityStr = data.personality
      ? Array.isArray(data.personality)
        ? data.personality.join('、')
        : data.personality
      : null

    // 处理 relationships 字段（可能是对象或字符串）
    const relationshipsStr = data.relationships
      ? typeof data.relationships === 'object'
        ? JSON.stringify(data.relationships)
        : data.relationships
      : null

    // 创建角色
    const character = await prisma.character.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        nickname: data.nickname,
        age: data.age,
        gender: data.gender,
        importance: data.importance,
        role: data.role,
        appearance: data.appearance,
        personality: personalityStr,
        backstory: data.backstory,
        motivation: data.motivation,
        dialogueStyle: data.dialogueStyle,
        characterArc: data.characterArc,
        relationships: relationshipsStr,
      },
    })

    return apiSuccess({ character })
  })
}
