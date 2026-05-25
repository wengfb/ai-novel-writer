'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'

interface SettingsFormAIProps {
  settings: Record<string, string>
  onUpdate: (key: string, value: string) => void
}

const MODEL_OPTIONS = [
  { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash (推荐)' },
  { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
  { value: 'gemini-3-flash', label: 'Gemini 3 Flash' },
  { value: 'gemini-3-pro', label: 'Gemini 3 Pro' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4o', label: 'GPT-4o' },
]

export function SettingsFormAI({ settings, onUpdate }: SettingsFormAIProps) {
  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          AI 配置优先从数据库读取。未设置时使用环境变量中的默认值。
        </AlertDescription>
      </Alert>

      {/* Provider */}
      <div className="space-y-2">
        <Label htmlFor="ai.provider">AI 服务商</Label>
        <Select
          value={settings['ai.provider'] || ''}
          onValueChange={(value) => onUpdate('ai.provider', value)}
        >
          <SelectTrigger id="ai.provider">
            <SelectValue placeholder="使用环境变量默认值" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai-compatible">OpenAI 兼容接口</SelectItem>
            <SelectItem value="gemini">Google Gemini</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          留空则使用环境变量 AI_PROVIDER 的值
        </p>
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <Label htmlFor="ai.apiKey">API Key</Label>
        <Input
          id="ai.apiKey"
          type="password"
          placeholder="留空使用环境变量中的 Key"
          value={settings['ai.apiKey'] || ''}
          onChange={(e) => onUpdate('ai.apiKey', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          此 Key 将覆盖环境变量中的 AI_API_KEY
        </p>
      </div>

      {/* Base URL */}
      <div className="space-y-2">
        <Label htmlFor="ai.baseUrl">API 地址</Label>
        <Input
          id="ai.baseUrl"
          placeholder="留空使用默认地址或环境变量"
          value={settings['ai.baseUrl'] || ''}
          onChange={(e) => onUpdate('ai.baseUrl', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          例如 https://api.deepseek.com/v1，留空使用环境变量或默认值
        </p>
      </div>

      {/* Model */}
      <div className="space-y-2">
        <Label htmlFor="ai.model">默认模型</Label>
        <Select
          value={settings['ai.model'] || ''}
          onValueChange={(value) => onUpdate('ai.model', value)}
        >
          <SelectTrigger id="ai.model">
            <SelectValue placeholder="使用环境变量默认值" />
          </SelectTrigger>
          <SelectContent>
            {MODEL_OPTIONS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          生成章节/角色等操作时使用的默认模型
        </p>
      </div>

      {/* Temperature */}
      <div className="space-y-2">
        <Label htmlFor="ai.temperature">
          生成温度：{settings['ai.temperature'] || '0.7'}
        </Label>
        <Slider
          id="ai.temperature"
          min={0}
          max={2}
          step={0.1}
          value={[parseFloat(settings['ai.temperature'] || '0.7')]}
          onValueChange={(value) => onUpdate('ai.temperature', value[0].toString())}
        />
        <p className="text-xs text-muted-foreground">
          越低越稳定，越高越有创意。推荐 0.7-1.0
        </p>
      </div>

      {/* Max Tokens */}
      <div className="space-y-2">
        <Label htmlFor="ai.maxTokens">单次最大输出 Token</Label>
        <Input
          id="ai.maxTokens"
          type="number"
          placeholder="8192"
          value={settings['ai.maxTokens'] || ''}
          onChange={(e) => onUpdate('ai.maxTokens', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          控制 AI 单次回复的长度上限
        </p>
      </div>

      {/* Context Max Tokens */}
      <div className="space-y-2">
        <Label htmlFor="ai.contextMaxTokens">上下文窗口上限 (Token)</Label>
        <Input
          id="ai.contextMaxTokens"
          type="number"
          placeholder="100000"
          value={settings['ai.contextMaxTokens'] || ''}
          onChange={(e) => onUpdate('ai.contextMaxTokens', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          控制每次 AI 请求携带的上下文总长度上限
        </p>
      </div>
    </div>
  )
}
