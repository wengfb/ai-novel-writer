'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

interface SettingsFormAIProps {
  settings: Record<string, string>
  onUpdate: (key: string, value: string) => void
}

export function SettingsFormAI({ settings, onUpdate }: SettingsFormAIProps) {
  return (
    <div className="space-y-6">
      {/* API Key */}
      <div className="space-y-2">
        <Label htmlFor="ai.apiKey">Gemini API Key *</Label>
        <Input
          id="ai.apiKey"
          type="password"
          placeholder="输入你的 Gemini API Key"
          value={settings['ai.apiKey'] || ''}
          onChange={(e) => onUpdate('ai.apiKey', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          从 <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a> 获取 API Key
        </p>
      </div>

      {/* 默认模型 */}
      <div className="space-y-2">
        <Label htmlFor="ai.model">默认模型</Label>
        <Select
          value={settings['ai.model'] || 'gemini-2.0-flash-exp'}
          onValueChange={(value) => onUpdate('ai.model', value)}
        >
          <SelectTrigger id="ai.model">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash (推荐)</SelectItem>
            <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
            <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Flash 模型速度快、成本低，适合日常创作
        </p>
      </div>

      {/* API 端点 */}
      <div className="space-y-2">
        <Label htmlFor="ai.endpoint">API 端点（可选）</Label>
        <Input
          id="ai.endpoint"
          placeholder="https://generativelanguage.googleapis.com"
          value={settings['ai.endpoint'] || ''}
          onChange={(e) => onUpdate('ai.endpoint', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          留空使用默认端点，可配置代理地址
        </p>
      </div>

      {/* 生成温度 */}
      <div className="space-y-2">
        <Label htmlFor="ai.temperature">
          生成温度：{settings['ai.temperature'] || '0.7'}
        </Label>
        <Slider
          id="ai.temperature"
          min={0}
          max={1}
          step={0.1}
          value={[parseFloat(settings['ai.temperature'] || '0.7')]}
          onValueChange={(value) => onUpdate('ai.temperature', value[0].toString())}
        />
        <p className="text-xs text-muted-foreground">
          较低的温度生成更稳定的内容，较高的温度更有创意
        </p>
      </div>

      {/* 最大 Token 数 */}
      <div className="space-y-2">
        <Label htmlFor="ai.maxTokens">最大 Token 数</Label>
        <Input
          id="ai.maxTokens"
          type="number"
          placeholder="8192"
          value={settings['ai.maxTokens'] || '8192'}
          onChange={(e) => onUpdate('ai.maxTokens', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          单次生成的最大 Token 数量（建议 4096-8192）
        </p>
      </div>
    </div>
  )
}
