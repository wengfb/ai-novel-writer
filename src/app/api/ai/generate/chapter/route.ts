import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getChapterGenerator } from '@/lib/ai/chapter-generator'
import { getContextManager } from '@/lib/ai/context-manager'
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

    // 检查章节号是否已存在
    const existingChapter = await prisma.chapter.findUnique({
      where: {
        projectId_chapterNumber: {
          projectId: data.projectId,
          chapterNumber: data.chapterNumber,
        },
      },
    })

    if (existingChapter) {
      return ApiErrors.badRequest(`第 ${data.chapterNumber} 章已存在，请更换章节号`)
    }

    // 如果未提供标题或大纲，从 Outline 表自动获取
    let chapterTitle = data.chapterTitle
    let chapterOutline = data.chapterOutline

    if (!chapterTitle || !chapterOutline) {
      const matchedOutline = await prisma.outline.findFirst({
        where: {
          projectId: data.projectId,
          type: 'chapter',
          order: data.chapterNumber,
        },
      })

      if (matchedOutline) {
        chapterTitle = chapterTitle || matchedOutline.title
        chapterOutline = chapterOutline || matchedOutline.description || ''
      }

      // 如果还是没有，使用兜底值
      chapterTitle = chapterTitle || `第${data.chapterNumber}章`
      chapterOutline = chapterOutline || ''
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

          const result = await chapterGenerator.generateChapter({
            projectId: data.projectId,
            chapterNumber: data.chapterNumber,
            chapterTitle,
            chapterOutline,
            targetWords: data.targetWords,
            model: data.model,
            emotionalGoal: data.emotionalGoal,
            plotFunction: data.plotFunction,
            tensionLevel: data.tensionLevel,
            onProgress: (progress) => {
              // 发送进度事件（包含实际场景内容和总数）
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'progress',
                    content: progress.content,
                    scene: progress.sceneIndex + 1,
                    totalScenes: progress.totalScenes,
                  })}\n\n`
                )
              )
            },
          })

          fullContent = result.content

          // 计算字数
          const wordCount = countWords(fullContent)

          // 使用 AI 生成章节摘要
          const contextManager = getContextManager()
          const summary = await contextManager.generateChapterSummary(
            fullContent,
            chapterTitle
          )

          // 保存章节到数据库
          const chapter = await prisma.chapter.create({
            data: {
              projectId: data.projectId,
              chapterNumber: data.chapterNumber,
              title: chapterTitle,
              content: fullContent,
              wordCount,
              summary,
            },
          })

          if (result.generationId) {
            await prisma.generation.update({
              where: { id: result.generationId },
              data: { targetId: chapter.id },
            })
          }

          // 更新项目统计
          await updateProjectStats(data.projectId)

          // 发送完成事件
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'done',
                data: {
                  chapterId: chapter.id,
                  wordCount,
                  content: fullContent,
                },
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
