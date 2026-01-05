import { NextResponse } from 'next/server'

/**
 * 统一 API 响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  } | null
}

/**
 * 成功响应
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      error: null,
    },
    { status }
  )
}

/**
 * 错误响应
 */
export function apiError(
  code: string,
  message: string,
  details?: any,
  status: number = 400
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  )
}

/**
 * 常见错误响应
 */
export const ApiErrors = {
  badRequest: (message: string = '请求参数错误', details?: any) =>
    apiError('INVALID_PARAMS', message, details, 400),

  unauthorized: (message: string = '未授权') =>
    apiError('UNAUTHORIZED', message, undefined, 401),

  notFound: (resource: string = '资源') =>
    apiError('NOT_FOUND', `${resource}不存在`, undefined, 404),

  serverError: (message: string = '服务器错误', details?: any) =>
    apiError('SERVER_ERROR', message, details, 500),

  projectNotFound: () => apiError('PROJECT_NOT_FOUND', '项目不存在', undefined, 404),

  chapterNotFound: () => apiError('CHAPTER_NOT_FOUND', '章节不存在', undefined, 404),

  aiGenerationFailed: (message: string = 'AI 生成失败') =>
    apiError('AI_GENERATION_FAILED', message, undefined, 500),

  databaseError: (message: string = '数据库错误') =>
    apiError('DATABASE_ERROR', message, undefined, 500),

  rateLimitExceeded: (retryAfter: number = 60) =>
    apiError('RATE_LIMIT_EXCEEDED', '请求过于频繁，请稍后再试', { retryAfter }, 429),
}

/**
 * 处理异步错误
 */
export function withErrorHandler<T>(
  handler: () => Promise<T>
): Promise<T | NextResponse<ApiResponse>> {
  return handler().catch((error) => {
    console.error('API Error:', error)

    // Prisma 错误处理
    if (error.code === 'P2025') {
      return ApiErrors.notFound()
    }

    // 其他错误
    return ApiErrors.serverError(error.message)
  })
}
