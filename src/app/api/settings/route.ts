import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError } from '@/lib/api/response'

// 获取所有系统设置
export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { category: 'asc' },
    })

    // 将设置数组转换为对象
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    return apiSuccess({
      settings: settingsObj,
      categories: groupByCategory(settings),
    })
  } catch (error) {
    console.error('获取系统设置失败:', error)
    return apiError('SERVER_ERROR', '获取系统设置失败')
  }
}

// 批量更新系统设置
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return apiError('INVALID_SETTINGS', '无效的设置数据', undefined, 400)
    }

    // 使用事务批量更新
    const updates = Object.entries(settings).map(([key, value]) => {
      return prisma.systemSetting.upsert({
        where: { key },
        update: { value: value as string },
        create: {
          key,
          value: value as string,
          category: getCategoryByKey(key),
          description: getDescriptionByKey(key),
        },
      })
    })

    await prisma.$transaction(updates)

    return apiSuccess({ message: '设置已保存' })
  } catch (error) {
    console.error('保存系统设置失败:', error)
    return apiError('SERVER_ERROR', '保存系统设置失败')
  }
}

// 辅助函数：根据 key 获取 category
function getCategoryByKey(key: string): string {
  if (key.startsWith('ai.')) return 'ai'
  if (key.startsWith('export.')) return 'export'
  if (key.startsWith('editor.')) return 'editor'
  return 'general'
}

// 辅助函数：根据 key 获取描述
function getDescriptionByKey(key: string): string {
  const descriptions: Record<string, string> = {
    'ai.apiKey': 'Google AI API 密钥',
    'ai.model': '默认 AI 模型',
    'ai.endpoint': 'API 端点地址',
    'ai.temperature': '生成温度 (0.0 - 1.0)',
    'ai.maxTokens': '最大生成 tokens',
  }
  return descriptions[key] || ''
}

// 辅助函数：按 category 分组
function groupByCategory(settings: any[]) {
  return settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = []
    }
    acc[setting.category].push({
      key: setting.key,
      value: setting.value,
      description: setting.description,
    })
    return acc
  }, {} as Record<string, any[]>)
}
