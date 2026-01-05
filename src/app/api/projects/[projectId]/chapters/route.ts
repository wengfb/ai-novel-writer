import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler, ApiErrors } from '@/lib/api/response'
import { parseJsonBody, validateId, validateQuery, validateRequest } from '@/lib/api/validators'
import { ChapterQuerySchema, CreateChapterSchema } from '@/lib/api/schemas'

type RouteContext = {
  params: Promise<{ projectId: string }>
}

/**
 * GET /api/projects/[projectId]/chapters
 * 获取章节列表
 */
export async function GET(request: NextRequest, context: RouteContext) {
  return withErrorHandler(async () => {
    const params = await context.params
    const projectId = validateId(params.projectId, '项目ID')

    // 验证查询参数
    const query = validateQuery(ChapterQuerySchema, request.nextUrl.searchParams)

    // 检查项目是否存在
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return ApiErrors.projectNotFound()
    }

    // 计算分页
    const skip = (query.page - 1) * query.limit

    // 查询章节
    const [chapters, total] = await Promise.all([
      prisma.chapter.findMany({
        where: { projectId },
        skip,
        take: query.limit,
        orderBy: { [query.orderBy]: query.order },
        select: {
          id: true,
          chapterNumber: true,
          title: true,
          wordCount: true,
          summary: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.chapter.count({ where: { projectId } }),
    ])

    return apiSuccess({
      chapters,
      total,
      page: query.page,
      limit: query.limit,
    })
  })
}

/**
 * POST /api/projects/[projectId]/chapters
 * 创建章节
 */
export async function POST(request: NextRequest, context: RouteContext) {
  return withErrorHandler(async () => {
    const params = await context.params
    const projectId = validateId(params.projectId, '项目ID')

    // 检查项目是否存在
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return ApiErrors.projectNotFound()
    }

    // 解析并验证请求体
    const body = await parseJsonBody(request)
    const data = validateRequest(CreateChapterSchema, body)

    // 检查章节号是否已存在
    const existing = await prisma.chapter.findUnique({
      where: {
        projectId_chapterNumber: {
          projectId,
          chapterNumber: data.chapterNumber,
        },
      },
    })

    if (existing) {
      return ApiErrors.badRequest('章节号已存在')
    }

    // 计算字数
    const wordCount = data.content ? countWords(data.content) : 0

    // 创建章节
    const chapter = await prisma.chapter.create({
      data: {
        projectId,
        chapterNumber: data.chapterNumber,
        title: data.title,
        content: data.content || '',
        wordCount,
        summary: data.summary,
        notes: data.notes,
      },
    })

    // 更新项目的章节统计
    await updateProjectStats(projectId)

    return apiSuccess({ chapter }, 201)
  })
}

/**
 * 统计字数（中文字符 + 英文单词）
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
