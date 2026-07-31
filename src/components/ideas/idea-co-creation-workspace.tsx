'use client'

import * as React from 'react'
import { Lightbulb, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  DraftCoCreationShell,
  DraftPanelFrame,
  pickDraftToolPayload,
} from '@/components/ai/draft-co-creation-shell'
import { UnifiedChat } from '@/components/chat/unified-chat'
import { ideasApi } from '@/lib/api/endpoints/ideas'
import type { IdeaItem, StoryIdeaCard } from '@/types'

type IdeaDraft = Omit<StoryIdeaCard, 'id'> & { id?: string }
type IdeaDraftField = Exclude<keyof IdeaDraft, 'id'>

interface IdeaCoCreationWorkspaceProps {
  /** 已有创意进入时，将其作为本轮打磨的参考资料。聊天记录不会伪造为可恢复状态。 */
  initialIdea?: IdeaItem | StoryIdeaCard | null
  onSaved: (idea: IdeaItem) => void
  onCancel?: () => void
  onSwitchToManual?: () => void
  confirmLabel?: string
}

interface IdeaFieldDefinition {
  key: IdeaDraftField
  label: string
  multiline?: boolean
}

const IDEA_FIELDS: IdeaFieldDefinition[] = [
  { key: 'title', label: '书名' },
  { key: 'genre', label: '题材' },
  { key: 'highConcept', label: '高概念', multiline: true },
  { key: 'worldBuilding', label: '世界观', multiline: true },
  { key: 'protagonist', label: '主角', multiline: true },
  { key: 'coreConflict', label: '核心冲突', multiline: true },
  { key: 'mainGoal', label: '主线目标', multiline: true },
  { key: 'sublimation', label: '主题表达', multiline: true },
  { key: 'openingHook', label: '开篇钩子', multiline: true },
]

function toIdeaDraft(idea: IdeaItem | StoryIdeaCard): IdeaDraft {
  return {
    id: idea.id,
    title: idea.title,
    genre: idea.genre,
    highConcept: idea.highConcept,
    worldBuilding: idea.worldBuilding,
    protagonist: idea.protagonist,
    coreConflict: idea.coreConflict,
    mainGoal: idea.mainGoal,
    sublimation: idea.sublimation,
    openingHook: idea.openingHook,
  }
}

function formatIdeaContext(idea: IdeaDraft) {
  return IDEA_FIELDS.map(({ key, label }) => `${label}：${idea[key] || '未填写'}`).join('\n')
}

/**
 * 创意共创工作台：布局与大纲/Onboarding 草稿共创一致（左说明 + 中对话 + 右草稿）。
 */
export function IdeaCoCreationWorkspace({
  initialIdea,
  onSaved,
  onCancel,
  onSwitchToManual,
  confirmLabel = '保存创意卡',
}: IdeaCoCreationWorkspaceProps) {
  const initialDraft = initialIdea ? toIdeaDraft(initialIdea) : null
  const [draft, setDraft] = React.useState<IdeaDraft | null>(initialDraft)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const existingContext = initialDraft
    ? `\n\n当前已有创意卡如下，请和作者一起打磨它；不要把其中未确认的内容视为不可修改的事实：\n${formatIdeaContext(initialDraft)}`
    : ''
  const openingMessage = initialDraft
    ? `我想继续打磨《${initialDraft.title}》这张创意卡。请先指出最值得补强的 1—2 个部分，并和我逐步确认。`
    : '我想和你一起打磨一个可以正式开书的小说创意。请先问我最关键的问题，必要时给我少量备选方向。'

  const handleDraftToolCall = React.useCallback((toolName: string, result: unknown) => {
    const payload = pickDraftToolPayload(toolName, 'updateIdeaDraft', result, 'draft')
    if (!payload) return
    setDraft({ ...payload, id: draft?.id } as IdeaDraft)
    setError(null)
  }, [draft?.id])

  const saveIdea = async () => {
    if (!draft) return

    setIsSaving(true)
    setError(null)
    try {
      const { id, ...content } = draft
      const response = id
        ? await ideasApi.update(id, { ...content, aiGenerated: false })
        : await ideasApi.create({
            ...content,
            source: JSON.stringify({ origin: 'idea_co_creation', confirmedAt: new Date().toISOString() }),
            status: 'draft',
            aiGenerated: true,
          })
      const savedIdea = response.data?.idea
      if (!savedIdea) throw new Error('创意保存失败')
      onSaved(savedIdea)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '创意未保存，请重试。')
    } finally {
      setIsSaving(false)
    }
  }

  const statusLabel = initialDraft ? '打磨中 · 未保存' : '新建 · 未保存'

  return (
    <DraftCoCreationShell
      leftRail={
        <aside className="w-40 shrink-0 border-r bg-muted/20 p-3">
          <p className="px-2 text-xs font-medium text-muted-foreground">当前任务</p>
          <div className="mt-2 rounded bg-primary/10 px-2 py-2 ring-1 ring-primary/30">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-3.5 w-3.5 text-primary" />
              创意共创
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{statusLabel}</p>
          </div>
          <p className="mt-4 px-2 text-xs leading-5 text-muted-foreground">
            信息足够时会自动更新右侧创意卡；只有点保存才会写入创意中心。
          </p>
          {onSwitchToManual ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-4 h-auto w-full justify-start px-2 text-xs text-muted-foreground"
              onClick={onSwitchToManual}
            >
              直接创建项目
            </Button>
          ) : null}
        </aside>
      }
      chatHeader={
        <header className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
          <div className="rounded-full bg-primary/10 p-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold">和创意编辑一起共创</h1>
            <p className="text-xs text-muted-foreground">
              {initialDraft ? `打磨《${initialDraft.title}》` : '从题材、人物或场景开始'} · 专家对话
            </p>
          </div>
          {onCancel ? (
            <Button type="button" variant="ghost" size="sm" className="shrink-0 text-xs" onClick={onCancel}>
              返回
            </Button>
          ) : null}
        </header>
      }
      chat={
        <UnifiedChat
          agentId="story-idea"
          systemSlot="system.co-create"
          sessionKey={`idea-co-create:${initialDraft?.id ?? 'new'}`}
          showSettings={false}
          contextAppend={`你正在协助作者共创一个小说创意。先讨论，不要假设任何设定已经确认。${existingContext}`}
          autoSendMessage={openingMessage}
          welcomeTitle="和创意编辑一起共创"
          welcomeSubtitle="从题材、人物或一个场景开始都可以。"
          draftTarget="idea"
          onToolCallComplete={handleDraftToolCall}
          className="h-full min-h-0 overflow-hidden"
        />
      }
      draftPanel={
        <DraftPanelFrame
          title="创意卡"
          description="AI 回复后会自动同步；此时不会写入创意中心。"
          empty={
            !draft ? (
              <div className="space-y-2 py-6 text-center text-xs text-muted-foreground">
                <p>开始和 AI 讨论后，这里会自动生成并持续更新创意卡。</p>
              </div>
            ) : undefined
          }
          footer={
            <>
              {error ? (
                <p className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">{error}</p>
              ) : null}
              <Button
                type="button"
                size="sm"
                className="w-full"
                onClick={() => void saveIdea()}
                disabled={!draft || isSaving}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {isSaving ? '保存中…' : confirmLabel}
              </Button>
            </>
          }
        >
          {draft
            ? IDEA_FIELDS.map(({ key, label, multiline }) => (
                <label key={key} className="block text-xs font-medium">
                  {label}
                  {multiline ? (
                    <Textarea
                      value={draft[key] ?? ''}
                      onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                      className="mt-1 min-h-16 text-sm"
                    />
                  ) : (
                    <Input
                      value={draft[key] ?? ''}
                      onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                      className="mt-1 text-sm"
                    />
                  )}
                </label>
              ))
            : null}
        </DraftPanelFrame>
      }
    />
  )
}
