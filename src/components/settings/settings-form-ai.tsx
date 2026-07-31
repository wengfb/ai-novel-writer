'use client'

import { Info, Loader2, RefreshCw, TestTube2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
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
import { cn } from '@/lib/utils'
import { useModelList } from '@/hooks/use-model-list'
import { useModelTest } from '@/hooks/use-model-test'
import { ModelPicker } from './model-picker'
import { ModelTestResult } from './model-test-result'

interface SettingsFormAIProps {
  settings: Record<string, string>
  onUpdate: (key: string, value: string) => void
}

export function SettingsFormAI({ settings, onUpdate }: SettingsFormAIProps) {
  const { models, isLoading: isLoadingModels, refresh, ensureLoaded } = useModelList()
  const { isTesting, result: testResult, test, clearResult } = useModelTest()
  const selectedModel = settings['ai.model'] || ''

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          AI 配置保存在数据库，优先于环境变量。模型列表与测试会使用当前已保存的服务商、地址和密钥。
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="ai.provider">AI 服务商</Label>
        <Select
          value={settings['ai.provider'] || ''}
          onValueChange={(value) => onUpdate('ai.provider', value)}
        >
          <SelectTrigger id="ai.provider" className="w-full">
            <SelectValue placeholder="使用环境变量默认值" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai-compatible">OpenAI 兼容接口</SelectItem>
            <SelectItem value="gemini">Google Gemini</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">保存服务商和地址后，再刷新模型列表。</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ai.apiKey">API Key</Label>
        <Input
          id="ai.apiKey"
          type="password"
          autoComplete="off"
          placeholder="留空使用环境变量中的 Key"
          value={settings['ai.apiKey'] || ''}
          onChange={(event) => onUpdate('ai.apiKey', event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ai.baseUrl">API 地址</Label>
        <Input
          id="ai.baseUrl"
          placeholder="留空使用默认地址或环境变量"
          value={settings['ai.baseUrl'] || ''}
          onChange={(event) => onUpdate('ai.baseUrl', event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="ai.model">默认模型</Label>
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void refresh({ force: true, toastOnSuccess: true })}
              disabled={isLoadingModels}
            >
              <RefreshCw className={cn('mr-1 h-3.5 w-3.5', isLoadingModels && 'animate-spin')} />
              获取列表
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isTesting}
              onClick={() =>
                void test({
                  model: selectedModel || undefined,
                  label: selectedModel || '默认模型',
                })
              }
            >
              {isTesting ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <TestTube2 className="mr-1 h-3.5 w-3.5" />
              )}
              测试
            </Button>
          </div>
        </div>
        <ModelPicker
          id="ai.model"
          value={selectedModel}
          models={models}
          isLoading={isLoadingModels}
          onOpen={() => void ensureLoaded()}
          onChange={(value) => {
            clearResult()
            onUpdate('ai.model', value)
          }}
        />
        <ModelTestResult result={testResult} />
        <p className="text-xs text-muted-foreground">
          打开下拉时会自动拉取一次列表（有缓存则复用）；也可直接输入模型 ID。
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ai.temperature">全局默认温度：{settings['ai.temperature'] || '0.7'}</Label>
        <Slider
          id="ai.temperature"
          min={0}
          max={2}
          step={0.1}
          value={[parseFloat(settings['ai.temperature'] || '0.7')]}
          onValueChange={(value) => onUpdate('ai.temperature', value[0].toString())}
        />
        <p className="text-xs text-muted-foreground">未在 Agent 中单独配置时使用。</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ai.maxTokens">全局最大输出 Token</Label>
        <Input
          id="ai.maxTokens"
          type="number"
          min={1}
          max={200000}
          placeholder="8192"
          value={settings['ai.maxTokens'] || ''}
          onChange={(event) => onUpdate('ai.maxTokens', event.target.value)}
        />
        <p className="text-xs text-muted-foreground">上限 200,000，防止单次生成失控。</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ai.contextMaxTokens">上下文窗口上限 (Token)</Label>
        <Input
          id="ai.contextMaxTokens"
          type="number"
          min={1}
          max={2000000}
          placeholder="100000"
          value={settings['ai.contextMaxTokens'] || ''}
          onChange={(event) => onUpdate('ai.contextMaxTokens', event.target.value)}
        />
        <p className="text-xs text-muted-foreground">上限 2,000,000，过大值保存时会被拒绝。</p>
      </div>
    </div>
  )
}
