'use client'

/**
 * Agent 提示词编辑区：槽位内容、变量说明、保存/恢复
 */

import { Loader2, RotateCcw, Save } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import type { ResolvedPromptSlot } from '@/lib/ai/agents'

interface AgentPromptEditorProps {
  slot: ResolvedPromptSlot
  draft: string
  dirty: boolean
  saving: boolean
  resetting: boolean
  onDraftChange: (value: string) => void
  onSave: () => void
  onReset: () => void
}

export function AgentPromptEditor({
  slot,
  draft,
  dirty,
  saving,
  resetting,
  onDraftChange,
  onSave,
  onReset,
}: AgentPromptEditorProps) {
  return (
    <div className="space-y-3 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-medium text-sm">{slot.name}</h4>
          {slot.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{slot.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {slot.isCustom && <Badge>自定义 v{slot.version}</Badge>}
          {dirty && <Badge variant="outline">未保存</Badge>}
        </div>
      </div>

      {slot.variables && slot.variables.length > 0 && (
        <div className="text-xs text-muted-foreground space-y-1">
          <span className="font-medium text-foreground">可用变量：</span>
          <ul className="list-disc list-inside space-y-0.5">
            {slot.variables.map((variable) => (
              <li key={variable.name}>
                <code className="bg-muted px-1 rounded">{`{${variable.name}}`}</code>
                {' — '}
                {variable.description}
                {variable.required ? '（必填）' : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ScrollArea className="h-[320px] rounded-md border">
        <Textarea
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          className="min-h-[320px] border-0 rounded-none font-mono text-xs leading-relaxed resize-none focus-visible:ring-0"
          spellCheck={false}
        />
      </ScrollArea>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={resetting || saving || (!slot.isCustom && !dirty)}
        >
          {resetting ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
          )}
          恢复默认
        </Button>
        <Button type="button" size="sm" onClick={onSave} disabled={saving || !dirty}>
          {saving ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="mr-1 h-3.5 w-3.5" />
          )}
          保存提示词
        </Button>
      </div>
    </div>
  )
}
