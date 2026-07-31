'use client'

import * as React from 'react'
import { Bot, ChevronDown, GitPullRequest, SearchCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UnifiedChat } from '@/components/chat/unified-chat'
import { useCurrentProject } from '@/hooks/use-projects'
import { useChapterStore } from '@/lib/store/chapter-store'
import { useUIStore } from '@/lib/store/ui-store'
import {
  getAgentOption,
  getAgentOptions,
  getDefaultAgent,
  getQuickPrompts,
  getScopeKey,
  type AssistantScope,
} from '@/lib/ai/agent-workspace'

function useResolvedScope(): AssistantScope {
  const { currentProject } = useCurrentProject()
  const { currentChapter } = useChapterStore()
  const {
    assistantScope,
    mainView,
    characterEditPayload,
    outlineEditPayload,
    worldEditPayload,
  } = useUIStore()

  if (assistantScope) return assistantScope

  if (mainView === 'characters' && characterEditPayload?.character) {
    const character = characterEditPayload.character
    return {
      type: 'character',
      id: character.id,
      title: character.name,
      subtitle: '角色设定',
      contextAppend: `\n当前正在协作的角色：${character.name}\n角色定位：${character.role}\n角色性格：${character.personality || '未填写'}\n角色背景：${character.backstory || '未填写'}\n请围绕该角色给出建议；涉及写库时必须调用工具并等待用户确认。`,
    }
  }

  if (mainView === 'outline' && outlineEditPayload?.editingOutline) {
    const outline = outlineEditPayload.editingOutline
    return {
      type: 'outline',
      id: outline.id,
      title: outline.title,
      subtitle: '剧情大纲',
      contextAppend: `\n当前正在协作的大纲节点：${outline.title}\n节点描述：${outline.description || '未填写'}\n请围绕这个节点的节奏、因果与伏笔提供建议。`,
    }
  }

  if (mainView === 'world' && worldEditPayload?.element) {
    const element = worldEditPayload.element
    return {
      type: 'world',
      id: element.id,
      title: element.name,
      subtitle: '世界观设定',
      contextAppend: `\n当前正在协作的世界观元素：${element.name}\n元素描述：${element.description}\n请围绕这个设定补充规则并检查一致性。`,
    }
  }

  if (mainView === 'editor' && currentChapter) {
    return {
      type: 'chapter',
      id: currentChapter.id,
      title: `第 ${currentChapter.chapterNumber} 章·${currentChapter.title}`,
      subtitle: '当前章节',
      contextAppend: `\n当前正在协作的章节：第 ${currentChapter.chapterNumber} 章《${currentChapter.title}》。`,
    }
  }

  return {
    type: 'project',
    title: currentProject?.title || '当前项目',
    subtitle: '项目全局资料',
  }
}

/** Studio 右栏的上下文感知 Agent 协作工作区。 */
export function AgentWorkspace() {
  const { currentProject } = useCurrentProject()
  const { currentChapter } = useChapterStore()
  const { activeAssistantAgentId, setActiveAssistantAgent } = useUIStore()
  const scope = useResolvedScope()
  const options = getAgentOptions(scope.type)
  const defaultAgent = getDefaultAgent(scope.type)
  const selectedAgent = options.some((option) => option.id === activeAssistantAgentId)
    ? activeAssistantAgentId!
    : defaultAgent
  const agent = getAgentOption(selectedAgent)
  const [draftPrompt, setDraftPrompt] = React.useState<string>()
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [changeSet, setChangeSet] = React.useState<{ id: string; items: Array<{ id: string; resourceType: string; resourceTitle: string; evidence: string; confidence: string; status: string }> } | null>(null)
  const [handoffMessage, setHandoffMessage] = React.useState<string | null>(null)

  if (!currentProject) {
    return <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">请先选择项目</div>
  }

  const handleAnalyze = async () => {
    if (scope.type !== 'character' || !scope.id) return
    setIsAnalyzing(true)
    setHandoffMessage(null)
    try {
      const response = await fetch(`/api/projects/${currentProject.id}/change-sets/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceAgentId: selectedAgent, characterId: scope.id, requestSummary: `请分析调整“${scope.title}”身份、关系或动机后，可能需要复核的项目资料。` }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error?.message || payload?.error || '影响分析失败')
      setChangeSet(payload.data.changeSet)
    } catch (error) {
      setHandoffMessage(error instanceof Error ? error.message : '影响分析失败，请稍后重试。')
    } finally { setIsAnalyzing(false) }
  }

  const handleHandoff = async () => {
    if (!changeSet) return
    try {
      const response = await fetch(`/api/change-sets/${changeSet.id}/handoffs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toAgentId: 'outline' }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error?.message || payload?.error || '创建交接失败')
      setActiveAssistantAgent('outline')
      setHandoffMessage('已交接给故事策划。下一轮对话将携带候选影响与待决事项；任何写入仍需逐项确认。')
    } catch (error) { setHandoffMessage(error instanceof Error ? error.message : '创建交接失败，请稍后重试。') }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-muted/10">
      <div className="border-b bg-background/70 px-3 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Bot className="h-3.5 w-3.5 text-primary" />
          <span>创作助手 · 在线</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="mt-1 h-auto w-full justify-between px-1 py-1.5 text-left hover:bg-muted">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-foreground">{agent.label}</span>
                <span className="block truncate text-xs font-normal text-muted-foreground">{agent.description}</span>
              </span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[min(22rem,calc(100vw-2rem))]">
            <DropdownMenuRadioGroup value={selectedAgent} onValueChange={setActiveAssistantAgent}>
              {options.map((option) => (
                <DropdownMenuRadioItem key={option.id} value={option.id} className="items-start py-2.5">
                  <span>
                    <span className="block font-medium">{option.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{option.description}</span>
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <p className="mt-1 truncate text-xs text-muted-foreground">正在参考：{scope.title} · {scope.subtitle}</p>
        {scope.type === 'character' ? (
          <Button type="button" variant="outline" size="sm" className="mt-2 h-8 w-full text-xs" onClick={handleAnalyze} disabled={isAnalyzing}>
            <SearchCheck className="mr-1.5 h-3.5 w-3.5 text-primary" />
            {isAnalyzing ? '正在扫描候选影响…' : '分析设定变更影响'}
          </Button>
        ) : null}
        {changeSet ? (
          <div className="mt-2 rounded-md border border-primary/20 bg-primary/5 p-2.5 text-xs">
            <div className="flex items-center justify-between gap-2 font-medium"><span>检测到 {changeSet.items.length} 项候选影响</span><span className="text-muted-foreground">规则扫描</span></div>
            <div className="mt-2 space-y-1.5">
              {changeSet.items.slice(0, 3).map((item) => <p key={item.id} className="line-clamp-2 text-muted-foreground">[{item.resourceType}] {item.resourceTitle}：{item.evidence}</p>)}
              {changeSet.items.length > 3 ? <p className="text-muted-foreground">另有 {changeSet.items.length - 3} 项可在后续方案中复核。</p> : null}
              {changeSet.items.length === 0 ? <p className="text-muted-foreground">未发现可确定的候选影响；这不代表不存在隐式剧情影响。</p> : null}
            </div>
            <Button type="button" variant="secondary" size="sm" className="mt-2 h-7 w-full text-xs" onClick={handleHandoff}>
              <GitPullRequest className="mr-1.5 h-3.5 w-3.5" />交接给故事策划
            </Button>
          </div>
        ) : null}
        {handoffMessage ? <p className="mt-2 text-xs text-muted-foreground">{handoffMessage}</p> : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <UnifiedChat
          projectId={currentProject.id}
          chapterId={scope.type === 'chapter' ? scope.id : currentChapter?.id}
          agentId={selectedAgent}
          scopeType={scope.type}
          scopeId={scope.id}
          contextAppend={scope.contextAppend}
          sessionKey={`${getScopeKey(scope)}:${selectedAgent}`}
          showSettings={false}
          welcomeTitle={`和${agent.label}一起创作`}
          welcomeSubtitle={`正在参考：${scope.title} · ${scope.subtitle}`}
          autoSendMessage={draftPrompt}
        />
      </div>

      <div className="border-t bg-background/60 px-3 py-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {getQuickPrompts(scope.type).map((prompt) => (
            <Button key={prompt} type="button" variant="secondary" size="sm" className="h-7 shrink-0 text-xs" onClick={() => setDraftPrompt(`${prompt}：请结合当前参考资料给出可执行建议。`)}>
              <Sparkles className="mr-1 h-3 w-3 text-primary" />{prompt}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
