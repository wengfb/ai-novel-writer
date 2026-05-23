import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getContextManager } from '@/lib/ai/context-manager'
import { withErrorHandler, ApiErrors, apiSuccess } from '@/lib/api/response'
import { parseJsonBody } from '@/lib/api/validators'
import { z } from 'zod'

const SummarizeRequestSchema = z.object({
  projectId: z.string().min(1),
})

/**
 * POST /api/ai/summarize
 * 为项目中缺少摘要的章节批量生成 AI 摘要
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const body = await parseJsonBody(request)
    const { projectId } = SummarizeRequestSchema.parse(body)

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return ApiErrors.projectNotFound()
    }

    const contextManager = getContextManager()
    const updatedCount = await contextManager.summarizeProjectChapters(projectId)

    return apiSuccess({
      chapterCount: updatedCount,
      message: updatedCount > 0
        ? `已为 ${updatedCount} 个章节生成摘要`
        : '所有章节已有摘要，无需更新',
    })
  })
}
