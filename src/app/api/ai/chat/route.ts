import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getGeminiProvider } from '@/lib/ai/providers/gemini'
import { ApiErrors } from '@/lib/api/response'

/**
 * POST /api/ai/chat
 * AI 对话接口（流式输出）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, chapterId, message, messages } = body

    // 支持两种调用方式：
    // 1. 传统方式：{ projectId, message } - 用于项目内对话
    // 2. Onboarding 方式：{ messages: [{ role, content }] } - 用于项目创建前的 AI 脑暴
    const userMessage = message || (messages && messages[0]?.content)

    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: '缺少必要参数' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 构建系统提示词
    let systemPrompt = '你是一个专业的小说创作助手。'
    let contextInfo = ''

    // 如果提供了 projectId，获取项目上下文
    if (projectId) {
      // 检查项目是否存在
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      })

      if (!project) {
        return new Response(
          JSON.stringify({ error: '项目不存在' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // 如果提供了章节 ID，获取章节信息
      if (chapterId) {
        const chapter = await prisma.chapter.findFirst({
          where: { id: chapterId, projectId },
        })

        if (chapter) {
          contextInfo += `\n当前章节：第 ${chapter.chapterNumber} 章 - ${chapter.title}\n`
          if (chapter.content) {
            contextInfo += `章节内容摘要：${chapter.content.slice(0, 500)}...\n`
          }
        }
      }

      // 获取项目信息
      contextInfo += `\n项目信息：\n`
      contextInfo += `- 标题：${project.title}\n`
      contextInfo += `- 类型：${project.genre}\n`
      if (project.description) {
        contextInfo += `- 简介：${project.description}\n`
      }

      // 获取角色信息（前 5 个）
      const characters = await prisma.character.findMany({
        where: { projectId },
        orderBy: { importance: 'desc' },
        take: 5,
      })

      if (characters.length > 0) {
        contextInfo += `\n主要角色：\n`
        characters.forEach((char) => {
          contextInfo += `- ${char.name}（${char.role}）：${char.personality || '暂无描述'}\n`
        })
      }

      systemPrompt = `你是一个专业的小说创作助手，正在帮助作者创作《${project.title}》这部${project.genre}小说。

${contextInfo}

请根据以上上下文信息，回答作者的问题，提供创作建议。你的回答应该：
1. 符合小说的类型和风格
2. 考虑已有的角色和情节
3. 提供具体、可操作的建议
4. 保持创意和专业性`
    }

    // 使用 Gemini 生成回复（流式）
    const gemini = getGeminiProvider()

    // 创建流式响应
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = gemini.streamGenerate({
            type: 'dialogue',
            model: 'gemini-3-flash',
            prompt: userMessage,
            systemPrompt,
            temperature: 0.8,
          })

          for await (const chunk of generator) {
            const data = JSON.stringify({
              type: 'progress',
              content: chunk,
            })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          }

          // 发送完成信号
          const doneData = JSON.stringify({
            type: 'done',
          })
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`))
          controller.close()
        } catch (error) {
          console.error('AI chat error:', error)
          const errorData = JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : '生成失败',
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
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
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: '服务器错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
