/**
 * API 响应类型
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

/**
 * API 错误类
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * 统一的 API 客户端
 */
export class ApiClient {
  private baseUrl = '/api'

  /**
   * 通用请求方法
   */
  async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      const data = await response.json()

      if (!data.success) {
        throw new ApiError(data.error.code, data.error.message)
      }

      return data
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError('NETWORK_ERROR', '网络请求失败')
    }
  }

  /**
   * GET 请求
   */
  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  /**
   * POST 请求
   */
  post<T>(endpoint: string, body: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /**
   * PUT 请求
   */
  put<T>(endpoint: string, body: any) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  /**
   * DELETE 请求
   */
  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  /**
   * 流式请求 (SSE)
   */
  async stream(endpoint: string, body: any): Promise<ReadableStream> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.body) {
      throw new Error('No response body')
    }

    return response.body
  }
}

/**
 * 导出单例
 */
export const apiClient = new ApiClient()
