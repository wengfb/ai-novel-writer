import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getContextManager } from '@/lib/ai/context-manager'
import { apiSuccess, withErrorHandler, ApiErrors } from '@/lib/api/response'

/**
 * GET /api/ai/context
 * 获取章节的上下文信息（使用 ContextManager 统一构建）
 */
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const { searchParams } = request.nextUrl
    const projectId = searchParams.get('projectId')
    const chapterId = searchParams.get('chapterId')

    if (!projectId || !chapterId) {
      return ApiErrors.badRequest('缺少必要参数')
    }

    // 获取项目和章节
    const [project, chapter] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        include: {
          characters: true,
          worldElements: true,
          foreshadowings: true,
          chapters: { orderBy: { chapterNumber: 'asc' } },
        },
      }),
      prisma.chapter.findFirst({
        where: { id: chapterId, projectId },
        select: { chapterNumber: true },
      }),
    ])

    if (!project) {
      return ApiErrors.projectNotFound()
    }

    if (!chapter) {
      return ApiErrors.chapterNotFound()
    }

    // 使用 ContextManager 构建上下文
    const contextManager = getContextManager()
    const contextPackage = contextManager.buildContext({
      currentChapter: chapter.chapterNumber,
      allChapters: project.chapters as any,
      characters: project.characters as any,
      worldElements: project.worldElements as any,
      foreshadowings: project.foreshadowings as any,
      genre: project.genre,
    })

    // 计算 token 估算
    const formattedPrompt = contextManager.formatContextForPrompt(contextPackage)
    const estimatedTokens = contextManager.estimateTokens(formattedPrompt)

    return apiSuccess({
      projectId,
      chapterId: chapterId,
      totalTokens: estimatedTokens,
      characters: contextPackage.characters.map(c => ({
        id: c.id,
        name: c.name,
        role: c.role,
      })),
      worldElements: contextPackage.worldElements.map(w => ({
        id: w.id,
        name: w.name,
        type: w.type,
      })),
      previousChapters: contextPackage.chapterSummaries.map(s => ({
        id: '',
        chapterNumber: s.chapterNumber,
        title: s.summary.slice(0, 30),
        summary: s.summary,
      })),
    })
  })
}
