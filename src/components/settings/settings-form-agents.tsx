'use client'

/**
 * Agent 配置面板
 * 设置页「Agent 配置」Tab：管理每个 Agent 的运行参数与提示词
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { agentsApi } from '@/lib/api/endpoints/agents'
import type { AgentCatalogItem, AgentCategory, ResolvedPromptSlot } from '@/lib/ai/agents'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useModelList } from '@/hooks/use-model-list'
import { useModelTest } from '@/hooks/use-model-test'
import {
  AgentRuntimeSection,
  type AgentRuntimeDraft,
} from './agent-runtime-section'
import { AgentPromptEditor } from './agent-prompt-editor'

const CATEGORY_LABELS: Record<AgentCategory, string> = {
  chat: '对话',
  onboarding: '项目引导',
  chapter: '章节',
  outline: '大纲',
  character: '角色',
  world: '世界观',
  rewrite: '改写',
  ideas: '创意',
  utility: '工具',
}

const EMPTY_RUNTIME: AgentRuntimeDraft = {
  model: '',
  temperature: '',
  maxTokens: '',
}

function runtimeDraftFromAgent(agent: AgentCatalogItem): AgentRuntimeDraft {
  return {
    model: agent.runtimeConfig.model || '',
    temperature: agent.runtimeConfig.temperature?.toString() || '',
    maxTokens: agent.runtimeConfig.maxTokens?.toString() || '',
  }
}

function applyAgentSelection(
  agent: AgentCatalogItem | undefined,
  setters: {
    setRuntimeDraft: (draft: AgentRuntimeDraft) => void
    setActiveSlotKey: (key: string) => void
    setDraft: (content: string) => void
  }
) {
  if (!agent) {
    setters.setRuntimeDraft(EMPTY_RUNTIME)
    setters.setActiveSlotKey('')
    setters.setDraft('')
    return
  }
  setters.setRuntimeDraft(runtimeDraftFromAgent(agent))
  const firstSlot = agent.promptSlots[0]
  if (firstSlot) {
    setters.setActiveSlotKey(firstSlot.key)
    setters.setDraft(firstSlot.content)
  } else {
    setters.setActiveSlotKey('')
    setters.setDraft('')
  }
}

export function SettingsFormAgents() {
  const [agents, setAgents] = useState<AgentCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState('')
  const [activeSlotKey, setActiveSlotKey] = useState('')
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [runtimeDraft, setRuntimeDraft] = useState<AgentRuntimeDraft>(EMPTY_RUNTIME)
  const [savingRuntime, setSavingRuntime] = useState(false)

  const { models, isLoading: isLoadingModels, refresh, ensureLoaded } = useModelList()
  const {
    isTesting,
    result: runtimeTestResult,
    test: testRuntime,
    clearResult: clearRuntimeTest,
  } = useModelTest()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await agentsApi.list()
      if (!res.success || !res.data?.agents) return
      const list = res.data.agents
      setAgents(list)
      setSelectedId((current) => {
        if (current && list.some((agent) => agent.id === current)) return current
        const first = list[0]
        if (first) applyAgentSelection(first, { setRuntimeDraft, setActiveSlotKey, setDraft })
        return first?.id ?? ''
      })
    } catch {
      toast.error('加载 Agent 列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const selected = useMemo(
    () => agents.find((agent) => agent.id === selectedId) ?? null,
    [agents, selectedId]
  )

  const activeSlot: ResolvedPromptSlot | null = useMemo(() => {
    if (!selected) return null
    return (
      selected.promptSlots.find((slot) => slot.key === activeSlotKey) ??
      selected.promptSlots[0] ??
      null
    )
  }, [selected, activeSlotKey])

  const dirty = activeSlot ? draft !== activeSlot.content : false

  const replaceAgent = (agent: AgentCatalogItem) => {
    setAgents((prev) => prev.map((item) => (item.id === agent.id ? agent : item)))
  }

  const handleSelectAgent = (id: string) => {
    if (id === selectedId) return
    const agent = agents.find((item) => item.id === id)
    setSelectedId(id)
    clearRuntimeTest()
    applyAgentSelection(agent, { setRuntimeDraft, setActiveSlotKey, setDraft })
  }

  const handleSelectSlot = (key: string) => {
    if (!selected) return
    const slot = selected.promptSlots.find((item) => item.key === key)
    if (!slot) return
    setActiveSlotKey(key)
    setDraft(slot.content)
  }

  const handleSavePrompt = async () => {
    if (!selected || !activeSlot) return
    setSaving(true)
    try {
      const res = await agentsApi.savePrompt(selected.id, {
        slotKey: activeSlot.key,
        content: draft,
      })
      if (!res.success || !res.data?.agent) throw new Error()
      replaceAgent(res.data.agent)
      toast.success('提示词已保存')
    } catch {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleResetPrompt = async () => {
    if (!selected || !activeSlot) return
    setResetting(true)
    try {
      const res = await agentsApi.resetPrompt(selected.id, activeSlot.key)
      if (!res.success || !res.data?.agent) throw new Error()
      replaceAgent(res.data.agent)
      const next = res.data.agent.promptSlots.find((slot) => slot.key === activeSlot.key)
      if (next) setDraft(next.content)
      toast.success('已恢复默认提示词')
    } catch {
      toast.error('重置失败')
    } finally {
      setResetting(false)
    }
  }

  const handleSaveRuntime = async () => {
    if (!selected) return
    const temperature =
      runtimeDraft.temperature === '' ? null : Number(runtimeDraft.temperature)
    const maxTokens = runtimeDraft.maxTokens === '' ? null : Number(runtimeDraft.maxTokens)
    if (
      (temperature !== null &&
        (!Number.isFinite(temperature) || temperature < 0 || temperature > 2)) ||
      (maxTokens !== null && (!Number.isInteger(maxTokens) || maxTokens <= 0))
    ) {
      toast.error('请填写有效的温度和最大输出 Token')
      return
    }

    setSavingRuntime(true)
    try {
      const res = await agentsApi.saveRuntimeConfig(selected.id, {
        model: runtimeDraft.model.trim(),
        temperature,
        maxTokens,
      })
      if (!res.success || !res.data?.agent) throw new Error()
      replaceAgent(res.data.agent)
      setRuntimeDraft(runtimeDraftFromAgent(res.data.agent))
      toast.success('Agent 运行参数已保存')
    } catch {
      toast.error('保存运行参数失败')
    } finally {
      setSavingRuntime(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6">
        暂无已注册 Agent。请确认后端 Agent 目录已加载。
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        每个 AI 功能对应一个 Agent。可分别配置模型、温度与最大输出 Token，也可编辑提示词。
        聊天面板与界面按钮共用同一套定义。使用{' '}
        <code className="text-xs bg-muted px-1 rounded">{`{变量名}`}</code> 作为运行时变量占位符。
      </p>

      <div className="grid gap-4 sm:grid-cols-[240px_1fr]">
        <div className="space-y-2">
          <Label>选择 Agent</Label>
          <Select value={selectedId} onValueChange={handleSelectAgent}>
            <SelectTrigger>
              <SelectValue placeholder="选择 Agent" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  <span className="flex items-center gap-2">
                    <span>{agent.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[agent.category] ?? agent.category}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selected && (
            <div className="rounded-md border p-3 space-y-2 text-sm">
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary">{CATEGORY_LABELS[selected.category]}</Badge>
                {selected.chatCompatible && <Badge variant="outline">可对话</Badge>}
                <Badge variant="outline" className="font-mono text-[10px]">
                  {selected.id}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {selected.description}
              </p>

              <AgentRuntimeSection
                draft={runtimeDraft}
                models={models}
                isLoadingModels={isLoadingModels}
                isTesting={isTesting}
                isSaving={savingRuntime}
                testResult={runtimeTestResult}
                onDraftChange={(patch) => {
                  if (patch.model !== undefined) clearRuntimeTest()
                  setRuntimeDraft((current) => ({ ...current, ...patch }))
                }}
                onEnsureModels={() => void ensureLoaded()}
                onRefreshModels={() => void refresh({ force: true, toastOnSuccess: true })}
                onTest={() =>
                  void testRuntime({
                    agentId: selected.id,
                    model: runtimeDraft.model || undefined,
                    label: `${selected.name}（${runtimeDraft.model.trim() || '全局默认模型'}）`,
                  })
                }
                onSave={() => void handleSaveRuntime()}
              />

              <div className="space-y-1 pt-1">
                <Label className="text-xs">提示词槽位</Label>
                <div className="flex flex-col gap-1">
                  {selected.promptSlots.map((slot) => (
                    <Button
                      key={slot.key}
                      type="button"
                      size="sm"
                      variant={slot.key === activeSlot?.key ? 'default' : 'ghost'}
                      className="justify-start h-8"
                      onClick={() => handleSelectSlot(slot.key)}
                    >
                      <span className="truncate">{slot.name}</span>
                      {slot.isCustom && (
                        <Badge variant="secondary" className="ml-auto text-[10px]">
                          已改
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {activeSlot ? (
          <AgentPromptEditor
            slot={activeSlot}
            draft={draft}
            dirty={dirty}
            saving={saving}
            resetting={resetting}
            onDraftChange={setDraft}
            onSave={() => void handleSavePrompt()}
            onReset={() => void handleResetPrompt()}
          />
        ) : (
          <p className="text-sm text-muted-foreground">该 Agent 暂无提示词槽位</p>
        )}
      </div>
    </div>
  )
}
