import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, apiError } from '@/lib/api/response'
import {
  AI_CONTEXT_MAX_TOKENS_LIMIT,
  AI_MAX_OUTPUT_TOKENS_LIMIT,
  clearConfigCache,
} from '@/lib/ai/config'

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

    // 密钥绝不能回传到浏览器；留空的输入框表示“保留现有密钥”。
    const publicSettings = Object.fromEntries(
      Object.entries(settingsObj).filter(([key]) => key !== 'ai.apiKey')
    )
    const publicCategories = Object.fromEntries(
      Object.entries(groupByCategory(settings) as Record<string, Array<{ key: string; value: string; description: string }>>).map(([category, categorySettings]) => [
        category,
        categorySettings.filter((setting) => setting.key !== 'ai.apiKey'),
      ])
    )

    return apiSuccess({
      settings: publicSettings,
      categories: publicCategories,
    })
  } catch (error) {
    console.error('获取系统设置失败:', error)
    return apiError('SERVER_ERROR', '获取系统设置失败')
  }
}

/**
 * 校验并规范化可写入的设置值。
 * 对 token 类数字做上下限钳制，避免 1e8 这类危险默认值再次写入。
 */
function normalizeSettingValue(key: string, raw: unknown): { ok: true; value: string } | { ok: false; message: string } {
  if (raw === null || raw === undefined) {
    return { ok: false, message: `设置 ${key} 不能为空` }
  }
  const value = String(raw).trim()

  if (key === 'ai.contextMaxTokens') {
    if (value === '') return { ok: true, value: '' }
    const n = Number(value)
    if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
      return { ok: false, message: '上下文窗口上限必须是正整数' }
    }
    if (n > AI_CONTEXT_MAX_TOKENS_LIMIT) {
      return { ok: false, message: `上下文窗口上限不能超过 ${AI_CONTEXT_MAX_TOKENS_LIMIT.toLocaleString()}` }
    }
    return { ok: true, value: String(n) }
  }

  if (key === 'ai.maxTokens') {
    if (value === '') return { ok: true, value: '' }
    const n = Number(value)
    if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
      return { ok: false, message: '最大输出 Token 必须是正整数' }
    }
    if (n > AI_MAX_OUTPUT_TOKENS_LIMIT) {
      return { ok: false, message: `最大输出 Token 不能超过 ${AI_MAX_OUTPUT_TOKENS_LIMIT.toLocaleString()}` }
    }
    return { ok: true, value: String(n) }
  }

  if (key === 'ai.temperature') {
    if (value === '') return { ok: true, value: '' }
    const n = Number(value)
    if (!Number.isFinite(n) || n < 0 || n > 2) {
      return { ok: false, message: '生成温度必须在 0–2 之间' }
    }
    return { ok: true, value: String(n) }
  }

  return { ok: true, value: String(raw) }
}

// 批量更新系统设置
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return apiError('INVALID_SETTINGS', '无效的设置数据', undefined, 400)
    }

    const normalized: Record<string, string> = {}
    for (const [key, raw] of Object.entries(settings as Record<string, unknown>)) {
      // 前端不会提交 apiKey 明文替换策略以外的字段时跳过空密钥覆盖
      if (key === 'ai.apiKey' && (raw === '' || raw == null)) continue
      const result = normalizeSettingValue(key, raw)
      if (!result.ok) {
        return apiError('INVALID_SETTINGS', result.message, undefined, 400)
      }
      // 空字符串表示清除该项，由 upsert 写入空值；读路径会回退默认
      normalized[key] = result.value
    }

    // 使用事务批量更新
    const updates = Object.entries(normalized).map(([key, value]) => {
      return prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: {
          key,
          value,
          category: getCategoryByKey(key),
          description: getDescriptionByKey(key),
        },
      })
    })

    if (updates.length > 0) {
      await prisma.$transaction(updates)
    }

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
