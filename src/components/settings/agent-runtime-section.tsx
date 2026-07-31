'use client'

/**
 * Agent 运行参数：模型 / 温度 / Token + 测试与保存
 */

import { Loader2, RefreshCw, TestTube2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { ModelOption } from '@/lib/ai/model-list'
import { ModelPicker } from './model-picker'
import { ModelTestResult, type ModelTestStatus } from './model-test-result'

export interface AgentRuntimeDraft {
  model: string
  temperature: string
  maxTokens: string
}

interface AgentRuntimeSectionProps {
  draft: AgentRuntimeDraft
  models: ModelOption[]
  isLoadingModels: boolean
  isTesting: boolean
  isSaving: boolean
  testResult: ModelTestStatus
  onDraftChange: (patch: Partial<AgentRuntimeDraft>) => void
  onEnsureModels: () => void
  onRefreshModels: () => void
  onTest: () => void
  onSave: () => void
}

export function AgentRuntimeSection({
  draft,
  models,
  isLoadingModels,
  isTesting,
  isSaving,
  testResult,
  onDraftChange,
  onEnsureModels,
  onRefreshModels,
  onTest,
  onSave,
}: AgentRuntimeSectionProps) {
  return (
    <div className="space-y-2 border-t pt-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs">运行参数</Label>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[11px]"
          onClick={onRefreshModels}
          disabled={isLoadingModels}
        >
          <RefreshCw className={cn('mr-1 h-3 w-3', isLoadingModels && 'animate-spin')} />
          获取列表
        </Button>
      </div>

      <ModelPicker
        value={draft.model}
        models={models}
        isLoading={isLoadingModels}
        size="sm"
        allowEmpty
        emptyLabel="继承全局默认模型"
        placeholder="模型（留空继承全局）"
        onOpen={onEnsureModels}
        onChange={(value) => onDraftChange({ model: value })}
      />
      <ModelTestResult result={testResult} />

      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          min="0"
          max="2"
          step="0.1"
          value={draft.temperature}
          onChange={(event) => onDraftChange({ temperature: event.target.value })}
          placeholder="温度（继承）"
          className="h-8 text-xs"
        />
        <Input
          type="number"
          min="1"
          value={draft.maxTokens}
          onChange={(event) => onDraftChange({ maxTokens: event.target.value })}
          placeholder="最大 Token（继承）"
          className="h-8 text-xs"
        />
      </div>

      <div className="flex gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 flex-1 text-xs"
          onClick={onTest}
          disabled={isTesting}
        >
          {isTesting ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <TestTube2 className="mr-1 h-3 w-3" />
          )}
          测试模型
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-8 flex-1 text-xs"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
          保存参数
        </Button>
      </div>
    </div>
  )
}
