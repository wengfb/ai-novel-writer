import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError } from '@/lib/api/response'

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
      return apiError('项目不存在', null, 404)
    }

    return apiSuccess(project)
  } catch (error) {
    console.error('获取项目详情失败:', error)
    return apiError('获取项目详情失败')
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

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        title: body.title,
        description: body.description,
        genre: body.genre,
        tags: body.tags,
        status: body.status,
        coverImage: body.coverImage,
      },
    })

    return apiSuccess(project)
  } catch (error) {
    console.error('更新项目失败:', error)
    return apiError('更新项目失败')
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
    return apiError('删除项目失败')
  }
}
