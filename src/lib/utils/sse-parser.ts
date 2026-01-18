/**
 * Server-Sent Events (SSE) 解析器
 * 用于处理流式 AI 生成响应
 */

export interface SSEEvent {
  type: 'progress' | 'done' | 'error'
  content?: string
  data?: any
  error?: string
}

/**
 * SSE 解析器类
 * 负责解析 SSE 格式的数据流
 */
export class SSEParser {
  private decoder = new TextDecoder()
  private buffer = ''

  /**
   * 解析 SSE 数据块
   * @param chunk - 数据块
   * @returns 解析出的事件数组
   */
  parse(chunk: Uint8Array): SSEEvent[] {
    const text = this.decoder.decode(chunk, { stream: true })
    this.buffer += text

    const events: SSEEvent[] = []
    const lines = this.buffer.split('\n')

    // 保留最后一行（可能不完整）
    this.buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6))
          events.push(data)
        } catch (e) {
          console.error('Failed to parse SSE data:', line, e)
        }
      }
    }

    return events
  }

  /**
   * 重置解析器状态
   */
  reset() {
    this.buffer = ''
  }
}

/**
 * 流式处理 SSE 响应
 * @param url - API 端点
 * @param body - 请求体
 * @param onProgress - 进度回调
 * @param onDone - 完成回调
 * @param onError - 错误回调
 * @param signal - 取消信号
 */
export async function streamSSE(
  url: string,
  body: any,
  onProgress: (content: string) => void,
  onDone: (data: any) => void,
  onError: (error: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    const error = await response.text()
    onError(error || 'Request failed')
    return
  }

  if (!response.body) {
    onError('No response body')
    return
  }

  const reader = response.body.getReader()
  const parser = new SSEParser()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const events = parser.parse(value)

      for (const event of events) {
        if (event.type === 'progress' && event.content) {
          onProgress(event.content)
        } else if (event.type === 'done') {
          onDone(event.data)
          return
        } else if (event.type === 'error') {
          onError(event.error || 'Unknown error')
          return
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      // 用户取消，不报错
      return
    }
    onError(error instanceof Error ? error.message : 'Stream error')
  } finally {
    reader.releaseLock()
    parser.reset()
  }
}
