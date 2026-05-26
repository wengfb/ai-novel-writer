import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getChapterGenerator } from '@/lib/ai/chapter-generator'
import { getContextManager } from '@/lib/ai/context-manager'
import { withErrorHandler, ApiErrors } from '@/lib/api/response'
import { parseJsonBody, validateRequest } from '@/lib/api/validators'
import { ContinueChapterSchema } from '@/lib/api/schemas'
import { plainTextToHtml } from '@/lib/utils/text-format'

/**
 * POST /api/ai/continue
 * AI 续写章节内容（流式输出）
 */
export async function POST(request: NextRequest) {
  try {
    // 解析并验证请求体
    const body = await parseJsonBody(request)
    const data = validateRequest(ContinueChapterSchema, body)

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

    // 创建流式响应
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const chapterGenerator = getChapterGenerator()

          // 发送开始事件
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'start',
              })}\n\n`
            )
          )

          // 续写章节（流式输出）
          const continuation = await chapterGenerator.continueChapter({
            projectId: data.projectId,
            chapterId: data.chapterId,
            currentContent: data.currentContent,
            targetWords: data.targetWords,
            model: data.model,
            onProgress: (chunk) => {
              // 实时发送进度事件
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'progress',
                    content: chunk,
                  })}\n\n`
                )
              )
            },
          })

          // 计算新增字数
          const addedWordCount = countWords(continuation)
          // continuation 是纯文本，转换为 HTML 后追加到已有内容
          const fullContent = data.currentContent + plainTextToHtml(continuation)
          const totalWordCount = countWords(fullContent)

          // 使用 AI 重新生成章节摘要
          const contextManager = getContextManager()
          const summary = await contextManager.generateChapterSummary(
            fullContent,
            chapter.title
          ).catch(() => chapter.summary) // 失败保留旧摘要

          // 更新章节内容
          const updatedChapter = await prisma.chapter.update({
            where: { id: data.chapterId },
            data: {
              content: fullContent,
              wordCount: totalWordCount,
              summary,
            },
          })

          // 更新项目统计
          await updateProjectStats(data.projectId)

          // 发送完成事件
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'done',
                data: {
                  chapterId: chapter.id,
                  addedContent: continuation,
                  addedWordCount,
                  totalWordCount: updatedChapter.wordCount,
                },
              })}\n\n`
            )
          )

          controller.close()
        } catch (error) {
          console.error('Chapter continuation error:', error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                error: error instanceof Error ? error.message : '续写失败',
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

/**
 * 统计字数
 */
function countWords(text: string): number {
  // \u53bb\u9664 HTML \u6807\u7b7e\u540e\u7edf\u8ba1
  const plainText = text.replace(/<[^>]*>/g, '')
  const chineseChars = (plainText.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishWords = (plainText.match(/[a-zA-Z]+/g) || []).length
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
