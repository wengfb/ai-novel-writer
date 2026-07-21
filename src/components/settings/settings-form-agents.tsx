'use client'

/**
 * Agent 提示词编辑面板
 * 设置页「Agent 提示词」Tab：查看/编辑/重置各 Agent 的 prompt slots
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { agentsApi } from '@/lib/api/endpoints/agents'
import type { AgentCatalogItem, AgentCategory, ResolvedPromptSlot } from '@/lib/ai/agents'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, RotateCcw, Save } from 'lucide-react'
import { toast } from 'sonner'

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

export function SettingsFormAgents() {
  const [agents, setAgents] = useState<AgentCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string>('')
  const [activeSlotKey, setActiveSlotKey] = useState<string>('')
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await agentsApi.list()
      if (res.success && res.data?.agents) {
        setAgents(res.data.agents)
        if (!selectedId && res.data.agents.length > 0) {
          const first = res.data.agents[0]
          setSelectedId(first.id)
          const firstSlot = first.promptSlots[0]
          if (firstSlot) {
            setActiveSlotKey(firstSlot.key)
            setDraft(firstSlot.content)
          }
        }
      }
    } catch {
      toast.error('加载 Agent 列表失败')
    } finally {
      setLoading(false)
    }
  }, [selectedId])

  useEffect(() => {
    void load()
    // 仅挂载时加载
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selected = useMemo(
    () => agents.find((a) => a.id === selectedId) ?? null,
    [agents, selectedId]
  )

  const activeSlot: ResolvedPromptSlot | null = useMemo(() => {
    if (!selected) return null
    return selected.promptSlots.find((s) => s.key === activeSlotKey) ?? selected.promptSlots[0] ?? null
  }, [selected, activeSlotKey])

  const dirty = activeSlot ? draft !== activeSlot.content : false

  const handleSelectAgent = (id: string) => {
    setSelectedId(id)
    const agent = agents.find((a) => a.id === id)
    const slot = agent?.promptSlots[0]
    if (slot) {
      setActiveSlotKey(slot.key)
      setDraft(slot.content)
    } else {
      setActiveSlotKey('')
      setDraft('')
    }
  }

  const handleSelectSlot = (key: string) => {
    if (!selected) return
    const slot = selected.promptSlots.find((s) => s.key === key)
    if (!slot) return
    setActiveSlotKey(key)
    setDraft(slot.content)
  }

  const handleSave = async () => {
    if (!selected || !activeSlot) return
    setSaving(true)
    try {
      const res = await agentsApi.savePrompt(selected.id, {
        slotKey: activeSlot.key,
        content: draft,
      })
      if (res.success && res.data?.agent) {
        setAgents((prev) =>
          prev.map((a) => (a.id === res.data!.agent.id ? res.data!.agent : a))
        )
        toast.success('提示词已保存')
      } else {
        toast.error('保存失败')
      }
    } catch {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!selected || !activeSlot) return
    setResetting(true)
    try {
      const res = await agentsApi.resetPrompt(selected.id, activeSlot.key)
      if (res.success && res.data?.agent) {
        setAgents((prev) =>
          prev.map((a) => (a.id === res.data!.agent.id ? res.data!.agent : a))
        )
        const next = res.data.agent.promptSlots.find((s) => s.key === activeSlot.key)
        if (next) setDraft(next.content)
        toast.success('已恢复默认提示词')
      } else {
        toast.error('重置失败')
      }
    } catch {
      toast.error('重置失败')
    } finally {
      setResetting(false)
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
        每个 AI 功能对应一个 Agent。提示词在此可见可编辑；聊天面板与界面按钮共用同一套定义。
        使用 <code className="text-xs bg-muted px-1 rounded">{`{变量名}`}</code> 作为运行时变量占位符。
      </p>

      <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
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

        <div className="space-y-3 min-w-0">
          {activeSlot ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium text-sm">{activeSlot.name}</h4>
                  {activeSlot.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activeSlot.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {activeSlot.isCustom && <Badge>自定义 v{activeSlot.version}</Badge>}
                  {dirty && <Badge variant="outline">未保存</Badge>}
                </div>
              </div>

              {activeSlot.variables && activeSlot.variables.length > 0 && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <span className="font-medium text-foreground">可用变量：</span>
                  <ul className="list-disc list-inside space-y-0.5">
                    {activeSlot.variables.map((v) => (
                      <li key={v.name}>
                        <code className="bg-muted px-1 rounded">{`{${v.name}}`}</code>
                        {' — '}
                        {v.description}
                        {v.required ? '（必填）' : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <ScrollArea className="h-[320px] rounded-md border">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="min-h-[320px] border-0 rounded-none font-mono text-xs leading-relaxed resize-none focus-visible:ring-0"
                  spellCheck={false}
                />
              </ScrollArea>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={resetting || saving || (!activeSlot.isCustom && !dirty)}
                >
                  {resetting ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  )}
                  恢复默认
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || !dirty}
                >
                  {saving ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="mr-1 h-3.5 w-3.5" />
                  )}
                  保存提示词
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">该 Agent 暂无提示词槽位</p>
          )}
        </div>
      </div>
    </div>
  )
}
