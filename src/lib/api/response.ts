import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Validation_error } from '@/lib/api/validators'

/**
 * 统一 API 响应格式
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
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
  details?: unknown,
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
  badRequest: (message: string = '请求参数错误', details?: unknown) =>
    apiError('INVALID_PARAMS', message, details, 400),

  unauthorized: (message: string = '未授权') =>
    apiError('UNAUTHORIZED', message, undefined, 401),

  notFound: (resource: string = '资源') =>
    apiError('NOT_FOUND', `${resource}不存在`, undefined, 404),

  serverError: (message: string = '服务器错误', details?: unknown) =>
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

    // Next 路由拆包可能导致不同模块实例的 instanceof 失效，同时认 name
    if (
      error instanceof Validation_error ||
      (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError')
    ) {
      const details =
        error instanceof Validation_error
          ? error.errors
          : (error as { errors?: unknown }).errors
      return ApiErrors.badRequest(
        error instanceof Error ? error.message : '参数验证失败',
        details
      )
    }

    // 路由里直接 schema.parse() 时抛出的 ZodError → 400
    if (
      error instanceof z.ZodError ||
      (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError' && 'issues' in error)
    ) {
      const issues = (error as z.ZodError).issues || []
      const details = issues.map((issue) => ({
        field: issue.path.join('.') || '(root)',
        message: issue.message,
      }))
      return ApiErrors.badRequest('参数验证失败', details)
    }

    // Prisma 错误处理
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return ApiErrors.notFound()
    }

    // 其他错误
    const message = error instanceof Error ? error.message : '服务器错误'
    return ApiErrors.serverError(message)
  })
}
