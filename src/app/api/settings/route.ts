import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError } from '@/lib/api/response'
import { clearConfigCache } from '@/lib/ai/config'

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

    // 清除 AI 配置缓存，下次请求时重新读取
    clearConfigCache()

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
  if (key.startsWith('project.')) return 'project'
  if (key.startsWith('styleAnchor.')) return 'project'
  return 'general'
}

// 辅助函数：根据 key 获取描述
function getDescriptionByKey(key: string): string {
  const descriptions: Record<string, string> = {
    'ai.provider': 'AI 服务提供商',
    'ai.apiKey': 'AI API 密钥',
    'ai.baseUrl': 'API 端点地址',
    'ai.model': '默认 AI 模型',
    'ai.temperature': '生成温度 (0.0 - 2.0)',
    'ai.maxTokens': '单次最大生成 Token 数',
    'ai.contextMaxTokens': '上下文窗口上限 (Token)',
    'editor.fontSize': '编辑器字体大小',
    'editor.width': '编辑器宽度',
    'editor.theme': '界面主题',
    'editor.autoSave': '是否自动保存',
    'editor.autoSaveInterval': '自动保存间隔（秒）',
    'project.defaultGenre': '默认小说类型',
    'project.defaultWords': '默认章节字数目标',
    'styleAnchor.default': '全局默认写作风格锚点（样章，500-2000字）',
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
