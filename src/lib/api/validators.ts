import { NextRequest } from 'next/server'
import { z } from 'zod'

/**
 * 从请求中解析 JSON
 */
export async function parseJsonBody<T>(request: NextRequest): Promise<T> {
  try {
    return await request.json()
  } catch (error) {
    throw new Error('Invalid JSON body')
  }
}

/**
 * 验证请求数据
 */
export function validateRequest<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      // 输出详细的验证错误信息
      console.error('Validation failed:', JSON.stringify(errors, null, 2))
      console.error('Received data:', JSON.stringify(data, null, 2))
      throw new Validation_error('Validation failed', errors)
    }
    throw error
  }
}

/**
 * 验证查询参数
 */
export function validateQuery<T extends z.ZodType>(
  schema: T,
  searchParams: URLSearchParams
): z.infer<T> {
  const data: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    data[key] = value
  })
  return validateRequest(schema, data)
}

/**
 * 验证错误类
 */
export class Validation_error extends Error {
  constructor(
    message: string,
    public errors: Array<{ field: string; message: string }>
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * 路径参数验证
 */
export function validateId(id: string, paramName: string = 'ID'): string {
  if (!id || typeof id !== 'string') {
    throw new Error(`Invalid ${paramName}`)
  }
  // CUID 格式验证（基本检查）
  const cuidRegex = /^[a-z0-9]{25}$/
  if (!cuidRegex.test(id)) {
    throw new Error(`Invalid ${paramName} format`)
  }
  return id
}
