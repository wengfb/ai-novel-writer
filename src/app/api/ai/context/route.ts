import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler, ApiErrors } from '@/lib/api/response'

/**
 * GET /api/ai/context
 * 获取章节的上下文信息
 */
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const { searchParams } = request.nextUrl
    const projectId = searchParams.get('projectId')
    const chapterId = searchParams.get('chapterId')

    if (!projectId || !chapterId) {
      return ApiErrors.badRequest('缺少必要参数')
    }

    // 检查项目和章节是否存在
    const [project, chapter] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId } }),
      prisma.chapter.findFirst({
        where: { id: chapterId, projectId },
      }),
    ])

    if (!project) {
      return ApiErrors.projectNotFound()
    }

    if (!chapter) {
      return ApiErrors.chapterNotFound()
    }

    // 获取活跃角色（前 5 个）
    const characters = await prisma.character.findMany({
      where: { projectId },
      orderBy: { importance: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        role: true,
      },
    })

    // 获取相关世界观元素（前 5 个）
    const worldElements = await prisma.worldElement.findMany({
      where: { projectId },
      orderBy: { importance: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        type: true,
      },
    })

    // 获取前置章节（前 3 章）
    const previousChapters = await prisma.chapter.findMany({
      where: {
        projectId,
        chapterNumber: { lt: chapter.chapterNumber },
      },
      orderBy: { chapterNumber: 'desc' },
      take: 3,
      select: {
        id: true,
        chapterNumber: true,
        title: true,
        summary: true,
      },
    })

    // 估算 Token 数量（简单估算：中文 1 字 = 2 tokens，英文 1 词 = 1 token）
    const contentLength = chapter.content?.length || 0
    const estimatedTokens = Math.ceil(contentLength * 1.5)

    return apiSuccess({
      projectId,
      chapterId,
      totalTokens: estimatedTokens,
      characters,
      worldElements,
      previousChapters,
    })
  })
}
