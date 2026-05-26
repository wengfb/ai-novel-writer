import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError } from '@/lib/api/response'
import { UpdateProjectSchema } from '@/lib/api/schemas'
import { validateRequest, Validation_error } from '@/lib/api/validators'

// 获取项目详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        chapters: {
          orderBy: { chapterNumber: 'asc' },
        },
        characters: true,
        worldElements: true,
        outlines: {
          where: { parentId: null },
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!project) {
      return apiError('PROJECT_NOT_FOUND', '项目不存在', undefined, 404)
    }

    return apiSuccess(project)
  } catch (error) {
    console.error('获取项目详情失败:', error)
    return apiError('SERVER_ERROR', '获取项目详情失败')
  }
}

// 更新项目
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const body = await request.json()

    const validated = validateRequest(UpdateProjectSchema, body)

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(validated.title !== undefined && { title: validated.title }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.genre !== undefined && { genre: validated.genre }),
        ...(validated.tags !== undefined && { tags: JSON.stringify(validated.tags) }),
        ...(validated.status !== undefined && { status: validated.status }),
        ...(validated.coverImage !== undefined && { coverImage: validated.coverImage }),
        ...(validated.outlineMode !== undefined && { outlineMode: validated.outlineMode }),
        ...(validated.planningRange !== undefined && { planningRange: validated.planningRange }),
      },
    })

    return apiSuccess(project)
  } catch (error) {
    console.error('更新项目失败:', error)
    if (error instanceof Validation_error) {
      return apiError('INVALID_PARAMS', '参数验证失败', error.errors, 400)
    }
    return apiError('SERVER_ERROR', '更新项目失败')
  }
}

// 删除项目
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params

    // 级联删除：Prisma 会自动删除相关联的章节、角色、世界观等
    // 因为我们在 schema 中定义了 onDelete: Cascade
    await prisma.project.delete({
      where: { id: projectId },
    })

    return apiSuccess({ message: '项目已删除' })
  } catch (error) {
    console.error('删除项目失败:', error)
    return apiError('SERVER_ERROR', '删除项目失败')
  }
}
