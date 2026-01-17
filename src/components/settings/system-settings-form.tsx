'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Eye, EyeOff } from 'lucide-react'

interface SystemSettingsFormProps {
  category: 'ai' | 'export' | 'editor'
}

const aiFields = [
  {
    key: 'ai.apiKey',
    label: 'Google AI API Key',
    type: 'password',
    description: '用于调用 Google AI 服务的密钥',
    placeholder: 'AIza...',
  },
  {
    key: 'ai.endpoint',
    label: 'API 端点地址',
    type: 'text',
    description: '自定义 API 端点（可选，留空使用默认）',
    placeholder: 'https://generativelanguage.googleapis.com',
  },
  {
    key: 'ai.model',
    label: '默认模型',
    type: 'select',
    description: '选择默认使用的 AI 模型',
    options: [
      { value: 'gemini-3-flash', label: 'Gemini 3 Flash (快速)' },
      { value: 'gemini-3-pro', label: 'Gemini 3 Pro (高质量)' },
      { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    ],
  },
  {
    key: 'ai.temperature',
    label: '生成温度',
    type: 'range',
    description: '控制生成的随机性和创造性 (0.0 - 1.0)',
    min: 0,
    max: 1,
    step: 0.1,
  },
  {
    key: 'ai.maxTokens',
    label: '最大 Tokens',
    type: 'number',
    description: '单次生成的最大 tokens 数量',
    placeholder: '8192',
  },
]

const exportFields = [
  {
    key: 'export.format',
    label: '默认导出格式',
    type: 'select',
    description: '选择默认的导出文件格式',
    options: [
      { value: 'markdown', label: 'Markdown (.md)' },
      { value: 'txt', label: '纯文本 (.txt)' },
      { value: 'docx', label: 'Word 文档 (.docx)' },
    ],
  },
  {
    key: 'export.includeMetadata',
    label: '包含元数据',
    type: 'select',
    description: '导出时是否包含章节信息、时间戳等元数据',
    options: [
      { value: 'true', label: '是' },
      { value: 'false', label: '否' },
    ],
  },
]

const editorFields = [
  {
    key: 'editor.fontSize',
    label: '字体大小',
    type: 'number',
    description: '编辑器字体大小（像素）',
    placeholder: '16',
  },
  {
    key: 'editor.autoSave',
    label: '自动保存',
    type: 'select',
    description: '启用编辑器自动保存功能',
    options: [
      { value: 'true', label: '启用' },
      { value: 'false', label: '禁用' },
    ],
  },
]

const categoryFields: Record<string, any[]> = {
  ai: aiFields,
  export: exportFields,
  editor: editorFields,
}

export function SystemSettingsForm({ category }: SystemSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [saveMessage, setSaveMessage] = useState('')

  const fields = categoryFields[category] || []

  // 加载设置
  useEffect(() => {
    loadSettings()
  }, [category])

  const loadSettings = async () => {
    setIsLoadingSettings(true)
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()

      if (data.success) {
        setFormData(data.data.settings || {})
      }
    } catch (error) {
      console.error('加载设置失败:', error)
    } finally {
      setIsLoadingSettings(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSaveMessage('')

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: formData,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSaveMessage('✓ 设置已保存')
        setTimeout(() => setSaveMessage(''), 3000)
      } else {
        alert(data.error || '保存失败')
      }
    } catch (error) {
      console.error('保存设置失败:', error)
      alert('保存失败')
    } finally {
      setIsLoading(false)
    }
  }

  const renderField = (field: any) => {
    const value = formData[field.key] || ''

    switch (field.type) {
      case 'password':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <div className="relative">
              <Input
                id={field.key}
                type={showPassword ? 'text' : 'password'}
                value={value}
                onChange={(e) =>
                  setFormData({ ...formData, [field.key]: e.target.value })
                }
                placeholder={field.placeholder}
                disabled={isLoading || isLoadingSettings}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        )

      case 'select':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Select
              value={value}
              onValueChange={(newValue) =>
                setFormData({ ...formData, [field.key]: newValue })
              }
              disabled={isLoading || isLoadingSettings}
            >
              <SelectTrigger id={field.key}>
                <SelectValue placeholder="请选择" />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        )

      case 'range':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label} ({value || field.placeholder})
            </Label>
            <input
              id={field.key}
              type="range"
              min={field.min}
              max={field.max}
              step={field.step}
              value={value || field.placeholder}
              onChange={(e) =>
                setFormData({ ...formData, [field.key]: e.target.value })
              }
              disabled={isLoading || isLoadingSettings}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{field.min}</span>
              <span>{field.max}</span>
            </div>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        )

      default:
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              type={field.type}
              value={value}
              onChange={(e) =>
                setFormData({ ...formData, [field.key]: e.target.value })
              }
              placeholder={field.placeholder}
              disabled={isLoading || isLoadingSettings}
            />
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        )
    }
  }

  if (isLoadingSettings) {
    return <div className="flex justify-center py-8">加载中...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {fields.map((field) => renderField(field))}

      <div className="flex items-center gap-3 pt-4">
        <Button type="submit" disabled={isLoading || isLoadingSettings}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            '保存设置'
          )}
        </Button>
        {saveMessage && (
          <Badge variant="secondary" className="text-green-600">
            {saveMessage}
          </Badge>
        )}
      </div>
    </form>
  )
}
