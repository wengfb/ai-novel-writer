import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getRewriteGenerator } from '@/lib/ai/rewrite-generator'
import { withErrorHandler, ApiErrors } from '@/lib/api/response'
import { parseJsonBody, validateRequest } from '@/lib/api/validators'
import { RewriteSchema } from '@/lib/api/schemas'

/**
 * POST /api/ai/rewrite
 * AI 局部重绘（流式输出）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request)
    const data = validateRequest(RewriteSchema, body)

    // 检查项目和章节是否存在
    const [project, chapter] = await Promise.all([
      prisma.project.findUnique({ where: { id: data.projectId } }),
      prisma.chapter.findFirst({
        where: { id: data.chapterId, projectId: data.projectId },
      }),
    ])

    if (!project) {
      return ApiErrors.projectNotFound()
    }

    if (!chapter) {
      return ApiErrors.chapterNotFound()
    }

    // 创建 SSE 流式响应
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const rewriteGenerator = getRewriteGenerator()

          // 发送开始事件
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'start' })}\n\n`
            )
          )

          // 流式改写
          const rewrittenText = await rewriteGenerator.rewrite({
            projectId: data.projectId,
            chapterId: data.chapterId,
            selectedText: data.selectedText,
            style: data.style,
            fullChapterContent: data.fullChapterContent,
            model: data.model,
            onProgress: (chunk) => {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'progress', content: chunk })}\n\n`
                )
              )
            },
          })

          // 发送完成事件（不写数据库，由前端 accept 时通过 auto-save 落库）
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'done',
                data: { rewrittenText },
              })}\n\n`
            )
          )

          controller.close()
        } catch (error) {
          console.error('Rewrite error:', error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                error: error instanceof Error ? error.message : '改写失败',
              })}\n\n`
            )
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('API Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error instanceof Error ? error.message : '服务器错误',
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
