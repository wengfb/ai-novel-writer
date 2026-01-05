import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getChapterGenerator } from '@/lib/ai/chapter-generator'
import { withErrorHandler, ApiErrors } from '@/lib/api/response'
import { parseJsonBody, validateRequest } from '@/lib/api/validators'
import { GenerateChapterSchema } from '@/lib/api/schemas'

/**
 * POST /api/ai/generate/chapter
 * AI 生成章节（流式输出）
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    // 解析并验证请求体
    const body = await parseJsonBody(request)
    const data = validateRequest(GenerateChapterSchema, body)

    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    })

    if (!project) {
      return ApiErrors.projectNotFound()
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

          // 生成章节内容（收集进度）
          let fullContent = ''
          let sceneCount = 0

          const content = await chapterGenerator.generateChapter({
            projectId: data.projectId,
            chapterNumber: data.chapterNumber,
            chapterTitle: data.chapterTitle,
            chapterOutline: data.chapterOutline,
            targetWords: data.targetWords,
            model: data.model,
            onProgress: (text) => {
              sceneCount++
              // 发送进度事件
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'progress',
                    scene: sceneCount,
                    totalScenes: 3, // 默认值
                  })}\n\n`
                )
              )
            },
          })

          fullContent = content

          // 计算字数
          const wordCount = countWords(fullContent)

          // 保存章节到数据库
          const chapter = await prisma.chapter.create({
            data: {
              projectId: data.projectId,
              chapterNumber: data.chapterNumber,
              title: data.chapterTitle,
              content: fullContent,
              wordCount,
              summary: data.chapterOutline.slice(0, 500), // 简化处理
            },
          })

          // 更新项目统计
          await updateProjectStats(data.projectId)

          // 发送完成事件
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'done',
                chapterId: chapter.id,
                wordCount,
                content: fullContent,
              })}\n\n`
            )
          )

          controller.close()
        } catch (error) {
          console.error('Chapter generation error:', error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                error: error instanceof Error ? error.message : '生成失败',
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
