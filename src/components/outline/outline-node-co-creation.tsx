'use client'

import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DraftCoCreationShell,
  DraftField,
  DraftPanelFrame,
} from '@/components/ai/draft-co-creation-shell'
import { UnifiedChat } from '@/components/chat/unified-chat'
import type { OutlineFormData } from './outline-form/types'

interface OutlineNodeCoCreationProps {
  projectId: string
  draft: OutlineFormData
  onDraftToolCall: (toolName: string, result: unknown) => void
  onExit: () => void
}

/**
 * 新建大纲节点的局部共创工作台。
 * 仅更新父组件持有的表单草稿，不直接写入数据库。
 */
export function OutlineNodeCoCreation({
  projectId,
  draft,
  onDraftToolCall,
  onExit,
}: OutlineNodeCoCreationProps) {
  const typeLabel = getOutlineTypeLabel(draft.type)
  const contextAppend = buildDraftContext(draft, typeLabel)

  return (
    <DraftCoCreationShell
      leftRail={
        <aside className="w-40 shrink-0 border-r bg-muted/20 p-3">
          <p className="px-2 text-xs font-medium text-muted-foreground">当前节点</p>
          <div className="mt-2 rounded bg-primary/10 px-2 py-2 ring-1 ring-primary/30">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI 协作创建
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{typeLabel} · 未保存</p>
          </div>
          <p className="mt-4 px-2 text-xs leading-5 text-muted-foreground">
            AI 会在信息足够时自动更新右侧草稿。
          </p>
        </aside>
      }
      chatHeader={
        <header className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
          <div className="rounded-full bg-primary/10 p-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold">和故事策划一起设计节点</h1>
            <p className="text-xs text-muted-foreground">{typeLabel} · 专家对话</p>
          </div>
          <Button type="button" variant="ghost" size="sm" className="shrink-0 text-xs" onClick={onExit}>
            返回表单
          </Button>
        </header>
      }
      chat={
        <UnifiedChat
          projectId={projectId}
          agentId="outline"
          scopeType="outline"
          draftTarget="outline"
          sessionKey="new-outline-draft"
          contextAppend={contextAppend}
          showSettings={false}
          welcomeTitle="从一句剧情想法开始"
          welcomeSubtitle="我会帮你补齐标题、事件、情感目标和节奏。"
          onToolCallComplete={onDraftToolCall}
          className="h-full min-h-0 overflow-hidden"
        />
      }
      draftPanel={
        <DraftPanelFrame
          title="节点草稿"
          description="AI 回复后会自动同步；此时不会写入项目。"
          footer={
            <Button type="button" size="sm" className="w-full" onClick={onExit}>
              继续手动编辑
            </Button>
          }
        >
          <DraftField label="类型" value={typeLabel} />
          <DraftField label="标题" value={draft.title} />
          <DraftField label="简介" value={draft.description} multiline />
          <DraftField label="情节功能" value={draft.plotFunction} />
          <DraftField label="情感目标" value={draft.emotionalGoal} multiline />
          <DraftField label="张力" value={`${draft.tensionLevel[0]} / 10`} />
          <DraftField label="目标字数" value={draft.targetWords ? `${draft.targetWords} 字` : ''} />
        </DraftPanelFrame>
      }
    />
  )
}

function getOutlineTypeLabel(type: OutlineFormData['type']) {
  return type === 'volume' ? '卷' : type === 'scene' ? '场景' : '章'
}

function buildDraftContext(draft: OutlineFormData, typeLabel: string) {
  const parent = draft.parentId === '__none__' ? '无' : draft.parentId
  return `\n当前正在创建一个本地大纲节点，尚未保存。\n节点类型：${typeLabel}\n父级：${parent}\n已有草稿：标题「${draft.title || '未填写'}」、简介「${draft.description || '未填写'}」。\n请通过简短对话帮助作者补齐当前节点。信息足够时调用 updateOutlineDraft 更新表单；不要创建或更新数据库记录，不要要求作者点击整理或应用。`
}
