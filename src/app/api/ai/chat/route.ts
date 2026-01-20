import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

/**
 * POST /api/ai/chat
 * AI 对话接口（使用 Vercel AI SDK 标准格式）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, chapterId, messages } = body

    console.log('Received messages:', JSON.stringify(messages, null, 2))

    // 手动将 UIMessage 格式转换为 ModelMessage 格式
    const coreMessages = messages.map((msg: any) => {
      // 提取文本内容
      const text = msg.parts
        ?.filter((part: any) => part.type === 'text')
        ?.map((part: any) => part.text)
        ?.join('') || ''

      return {
        role: msg.role,
        content: text,
      }
    })

    console.log('Converted messages:', JSON.stringify(coreMessages, null, 2))

    // 检查转换后的消息
    if (!coreMessages || coreMessages.length === 0) {
      console.error('转换后的消息为空')
      return new Response(
        JSON.stringify({ error: '无效的消息格式：转换失败' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 获取最后一条用户消息
    const lastMessage = coreMessages[coreMessages.length - 1]
    if (!lastMessage || lastMessage.role !== 'user') {
      console.error('最后一条消息不是用户消息:', lastMessage)
      return new Response(
        JSON.stringify({ error: '无效的消息格式' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 构建系统提示词
    let systemPrompt = '你是一个专业的小说创作助手。'

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

      let contextInfo = ''

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

    // 创建 Google AI 实例
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
      baseURL: process.env.GEMINI_BASE_URL,
    })

    // 使用 Vercel AI SDK 的 streamText
    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      messages: coreMessages,
      temperature: 0.8,
    })

    // 使用标准的 UIMessageChunk 格式构建 SSE 流
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 生成一个唯一的消息 ID
          const messageId = Date.now().toString()

          // 发送文本开始事件
          const startData = JSON.stringify({
            type: 'text-start',
            id: messageId,
          })
          controller.enqueue(encoder.encode(`data: ${startData}\n\n`))

          // 流式发送文本内容
          for await (const chunk of result.textStream) {
            const deltaData = JSON.stringify({
              type: 'text-delta',
              delta: chunk,
              id: messageId,
            })
            controller.enqueue(encoder.encode(`data: ${deltaData}\n\n`))
          }

          // 发送文本结束事件
          const endData = JSON.stringify({
            type: 'text-end',
            id: messageId,
          })
          controller.enqueue(encoder.encode(`data: ${endData}\n\n`))

          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          const errorData = JSON.stringify({
            type: 'error',
            errorText: error instanceof Error ? error.message : '生成失败',
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
