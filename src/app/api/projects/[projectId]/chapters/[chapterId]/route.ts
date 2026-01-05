import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler, ApiErrors } from '@/lib/api/response'
import { parseJsonBody, validateId, validateRequest } from '@/lib/api/validators'
import { UpdateChapterSchema } from '@/lib/api/schemas'

type RouteContext = {
  params: Promise<{ projectId: string; chapterId: string }>
}

/**
 * GET /api/projects/[projectId]/chapters/[chapterId]
 * 获取章节详情
 */
export async function GET(request: NextRequest, context: RouteContext) {
  return withErrorHandler(async () => {
    const params = await context.params
    const projectId = validateId(params.projectId, '项目ID')
    const chapterId = validateId(params.chapterId, '章节ID')

    // 查询章节
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        projectId,
      },
      include: {
        scenes: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!chapter) {
      return ApiErrors.chapterNotFound()
    }

    return apiSuccess({ chapter })
  })
}

/**
 * PUT /api/projects/[projectId]/chapters/[chapterId]
 * 更新章节
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  return withErrorHandler(async () => {
    const params = await context.params
    const projectId = validateId(params.projectId, '项目ID')
    const chapterId = validateId(params.chapterId, '章节ID')

    // 检查章节是否存在
    const existing = await prisma.chapter.findFirst({
      where: { id: chapterId, projectId },
    })

    if (!existing) {
      return ApiErrors.chapterNotFound()
    }

    // 解析并验证请求体
    const body = await parseJsonBody(request)
    const data = validateRequest(UpdateChapterSchema, body)

    // 构建更新数据
    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.content !== undefined) {
      updateData.content = data.content
      updateData.wordCount = countWords(data.content)
    }
    if (data.summary !== undefined) updateData.summary = data.summary
    if (data.notes !== undefined) updateData.notes = data.notes

    // 更新章节
    const chapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: updateData,
    })

    // 更新项目统计
    await updateProjectStats(projectId)

    return apiSuccess({ chapter })
  })
}

/**
 * DELETE /api/projects/[projectId]/chapters/[chapterId]
 * 删除章节
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  return withErrorHandler(async () => {
    const params = await context.params
    const projectId = validateId(params.projectId, '项目ID')
    const chapterId = validateId(params.chapterId, '章节ID')

    // 检查章节是否存在
    const existing = await prisma.chapter.findFirst({
      where: { id: chapterId, projectId },
    })

    if (!existing) {
      return ApiErrors.chapterNotFound()
    }

    // 删除章节（级联删除场景）
    await prisma.chapter.delete({
      where: { id: chapterId },
    })

    // 更新项目统计
    await updateProjectStats(projectId)

    return apiSuccess({
      deleted: true,
      message: '章节已删除',
    })
  })
}

/**
 * 统计字数
 */
function countWords(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
  return chineseChars + englishWords
}

/**
 * 更新项目统计信息
 */
async function updateProjectStats(projectId: string) {
  const [totalWords, chapterCount] = await Promise.all([
    prisma.chapter.aggregate({
      where: { projectId },
      _sum: { wordCount: true },
    }),
    prisma.chapter.count({ where: { projectId } }),
  ])

  await prisma.project.update({
    where: { id: projectId },
    data: {
      totalWords: totalWords._sum.wordCount || 0,
      chapterCount,
    },
  })
}
