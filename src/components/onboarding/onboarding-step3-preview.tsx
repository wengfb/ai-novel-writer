'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Loader2, CheckCircle2, BookOpen, Users, Globe, Eye, Sparkles,
  ChevronDown, Gauge, Target, ChevronRight, SkipForward, AlertTriangle,
  FileText, XCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StoryIdeaCard } from '@/types'

// ============ 类型 ============

interface UserPreferences {
  audience?: string
  genre?: string
  tone?: string
}

interface OnboardingStep3PreviewProps {
  idea: StoryIdeaCard
  userPreferences?: UserPreferences
  onComplete: (projectId: string) => void
  onBack?: () => void
  onGeneratingChange?: (generating: boolean) => void
  onPhaseChange?: (phase: 'config' | 'review' | 'complete') => void
  /** 续建模式：已有项目 ID + 已保存的进度 */
  resumeProgress?: { projectId: string; doneSteps: StepKey[] }
}

type StepKey = 'architecture' | 'characters' | 'world' | 'volume' | 'foreshadowings' | 'styleAnchor'
type StepStatus = 'pending' | 'loading' | 'done' | 'skipped'

interface StepState {
  key: StepKey
  status: StepStatus
  data: Record<string, unknown> | null
  error: string | null
}

const STEP_DEFS: { key: StepKey; label: string; icon: React.ReactNode; apiPath: string }[] = [
  { key: 'architecture', label: '故事架构', icon: <BookOpen className="h-4 w-4" />, apiPath: '/api/ai/generate/architecture' },
  { key: 'characters', label: '角色群像', icon: <Users className="h-4 w-4" />, apiPath: '/api/ai/generate/characters' },
  { key: 'world', label: '世界观', icon: <Globe className="h-4 w-4" />, apiPath: '/api/ai/generate/world-plan' },
  { key: 'volume', label: '分卷大纲', icon: <FileText className="h-4 w-4" />, apiPath: '/api/ai/generate/volume-plan' },
  { key: 'foreshadowings', label: '伏笔网络', icon: <Eye className="h-4 w-4" />, apiPath: '/api/ai/generate/foreshadowings' },
  { key: 'styleAnchor', label: '风格锚点', icon: <Sparkles className="h-4 w-4" />, apiPath: '/api/ai/generate/style-anchor' },
]

const PACE_OPTIONS = [
  { value: 'fast' as const, label: '快节奏', desc: '短章快更，情节紧凑' },
  { value: 'medium' as const, label: '中等', desc: '标准篇幅，张弛有度' },
  { value: 'slow' as const, label: '慢节奏', desc: '长章慢展，细节丰富' },
]

const WORD_PRESETS = [
  { value: 500000, label: '50万' },
  { value: 1000000, label: '100万' },
  { value: 2000000, label: '200万' },
  { value: 3000000, label: '300万' },
  { value: 5000000, label: '500万' },
  { value: 10000000, label: '1000万' },
]

// ============ 主组件 ============

export function OnboardingStep3Preview({
  idea,
  userPreferences,
  onComplete,
  onBack,
  onGeneratingChange,
  onPhaseChange,
  resumeProgress,
}: OnboardingStep3PreviewProps) {
  const defaultTitle = idea.title || `${idea.genre || '新'}小说`
  const [projectTitle, setProjectTitle] = useState(defaultTitle)
  const [targetWords, setTargetWords] = useState(1000000)
  const [pace, setPace] = useState<'fast' | 'medium' | 'slow'>('medium')

  // 续建模式：恢复进度，直接进入审核流程
  const doneSteps = resumeProgress?.doneSteps || []
  const firstPending = STEP_DEFS.find(d => !doneSteps.includes(d.key))?.key || 'architecture'

  const [phase, setPhase] = useState<'config' | 'review' | 'complete'>(
    resumeProgress ? 'review' : 'config'
  )
  const [activeStep, setActiveStep] = useState<StepKey>(firstPending)

  // 通知父组件 phase 变化（用于调整模态框宽度）
  useEffect(() => {
    onPhaseChange?.(phase)
  }, [phase, onPhaseChange])
  const [steps, setSteps] = useState<StepState[]>(
    STEP_DEFS.map(d => ({
      key: d.key,
      status: doneSteps.includes(d.key) ? 'done' as StepStatus : 'pending' as StepStatus,
      data: null,
      error: null,
    }))
  )
  const [feedback, setFeedback] = useState('')
  const [projectId, setProjectId] = useState<string | null>(null)

  const feedbackRef = useRef<HTMLInputElement>(null)

  // 获取当前步骤状态
  const getStep = useCallback((key: StepKey) => steps.find(s => s.key === key)!, [steps])
  const currentStep = getStep(activeStep)

  // 更新步骤
  const updateStep = useCallback((key: StepKey, update: Partial<StepState>) => {
    setSteps(prev => prev.map(s => s.key === key ? { ...s, ...update } : s))
  }, [])

  // 自动触发当前步骤的生成
  useEffect(() => {
    if (phase !== 'review') return
    const step = getStep(activeStep)
    if (step.status !== 'pending') return
    generateStep(activeStep)
  }, [phase, activeStep])

  // 获取生成所需的上下文
  const getRequestContext = useCallback((stepKey: StepKey) => {
    const arch = getStep('architecture')
    const chars = getStep('characters')
    const world = getStep('world')
    const vol = getStep('volume')

    const base = {
      idea,
      targetWords,
      pace,
      audience: userPreferences?.audience,
      tone: userPreferences?.tone,
    }

    switch (stepKey) {
      case 'architecture':
        return { ...base }

      case 'characters':
        return { ...base, architecture: (arch.data as any)?.architecture || arch.data }

      case 'world': {
        const archData = (arch.data as any)?.architecture || arch.data
        const charList = extractArray((chars.data as any)?.characters)
        return {
          ...base,
          architecture: { storySummary: archData?.storySummary, mainConflict: archData?.mainConflict },
          characters: charList.map((c: any) => ({ name: c.name, description: c.description })),
        }
      }

      case 'volume': {
        const archData = (arch.data as any)?.architecture || arch.data
        const charList = extractArray((chars.data as any)?.characters)
        const worldList = extractArray((world.data as any)?.worldSettings)
        return {
          ...base,
          architecture: archData,
          characters: charList.map((c: any) => ({ name: c.name, role: c.role })),
          worldSettings: worldList.map((w: any) => ({ name: w.name, type: w.type })),
        }
      }

      case 'foreshadowings':
        const chData = vol.data as any
        const fCharList = extractArray((chars.data as any)?.characters)
        const fWorldList = extractArray((world.data as any)?.worldSettings)
        const chList = extractArray(chData?.chapters)
        return {
          chapters: chList.map((c: any) => ({
            chapterNumber: c.chapterNumber, title: c.title, summary: c.summary || '',
          })),
          characters: fCharList.map((c: any) => ({ name: c.name })),
          worldSettings: fWorldList.map((w: any) => ({ name: w.name })),
        }

      case 'styleAnchor':
        return { idea, tone: userPreferences?.tone }

      default:
        return base
    }
  }, [idea, targetWords, pace, userPreferences, steps])

  // 生成
  const generateStep = async (stepKey: StepKey, prevData?: Record<string, unknown>, fb?: string) => {
    updateStep(stepKey, { status: 'loading', error: null })
    onGeneratingChange?.(true)

    try {
      const def = STEP_DEFS.find(d => d.key === stepKey)!
      const context = getRequestContext(stepKey)

      // style-anchor 用已有端点
      if (stepKey === 'styleAnchor') {
        const res = await fetch('/api/ai/generate/style-anchor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: `${idea.genre}小说《${projectTitle}》，${idea.highConcept}`,
            genre: idea.genre,
            hint: userPreferences?.tone,
          }),
        })
        const json = await res.json()
        if (json.success) {
          updateStep(stepKey, { status: 'done', data: { content: json.data.content, wordCount: json.data.wordCount } })
        } else throw new Error(json.error?.message)
        return
      }

      // 构建请求
      const body: Record<string, unknown> = { ...context }
      if (prevData && fb) {
        body.previousOutput = prevData
        body.feedback = fb
      }

      const res = await fetch(def.apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        updateStep(stepKey, { status: 'done', data: json.data })
      } else {
        throw new Error(json.error?.message || '生成失败')
      }
    } catch (e) {
      updateStep(stepKey, { status: 'pending', error: (e as Error).message })
    } finally {
      onGeneratingChange?.(false)
    }
  }

  // 反馈迭代
  const handleFeedback = async () => {
    if (!feedback.trim()) return
    const step = getStep(activeStep)
    const fb = feedback
    setFeedback('')
    await generateStep(activeStep, step.data || {}, fb)
  }

  // 跳过当前步骤
  const skipCurrent = () => {
    updateStep(activeStep, { status: 'skipped' })
    goNext()
  }

  // 跳过后续全部
  const skipAll = async () => {
    // 标记所有未完成步骤为跳过
    setSteps(prev => prev.map(s =>
      s.status === 'pending' || s.status === 'loading' ? { ...s, status: 'skipped' as StepStatus } : s
    ))
    await finalize()
  }

  // 下一步
  const goNext = () => {
    const idx = STEP_DEFS.findIndex(d => d.key === activeStep)
    const next = STEP_DEFS[idx + 1]
    if (next) {
      setActiveStep(next.key)
    } else {
      // 全部完成 → 写库
      finalize()
    }
  }

  // 切换到已完成步骤
  const switchToStep = (key: StepKey) => {
    const step = getStep(key)
    if (step.status === 'done' || step.status === 'loading') {
      setActiveStep(key)
    }
  }

  // 写入数据库
  const finalize = async () => {
    onGeneratingChange?.(true)
    try {
      const results: Record<string, unknown> = {}
      const completedSteps: StepKey[] = []
      steps.forEach(s => {
        if (s.status === 'done' && s.data) {
          completedSteps.push(s.key)
          results[s.key === 'volume' ? 'chapters' : s.key] = s.data
          if (s.key === 'architecture') results.architecture = (s.data as any)?.architecture || s.data
          if (s.key === 'volume') results.chapters = (s.data as any)?.chapters || s.data
        }
      })

      const styleAnchorData = getStep('styleAnchor')
      if (styleAnchorData.status === 'done' && styleAnchorData.data) {
        results.styleAnchor = styleAnchorData.data
      }

      // 续建模式：更新已有项目
      const existingProjectId = resumeProgress?.projectId
      const endpoint = existingProjectId
        ? `/api/projects/${existingProjectId}/init`
        : '/api/onboarding/finalize'
      const body = existingProjectId
        ? { results }
        : { projectTitle, idea, results }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        const pid = existingProjectId || json.data.projectId
        // 保存进度到 localStorage
        localStorage.setItem(`init-progress-${pid}`, JSON.stringify(completedSteps))
        setProjectId(pid)
        setPhase('complete')
        setTimeout(() => onComplete(pid), 1200)
      }
    } catch (e) {
      console.error('Finalize failed:', e)
    } finally {
      onGeneratingChange?.(false)
    }
  }

  // ======== 配置阶段 ========
  if (phase === 'config') {
    return (
      <div className="flex flex-col h-full overflow-auto px-8 py-6">
        <div className="w-full max-w-lg mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">准备创建你的小说项目</h2>
            <p className="text-muted-foreground">AI 将分步生成故事架构、角色、世界观、分卷大纲</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">项目名称</Label>
            <Input id="title" value={projectTitle} onChange={e => setProjectTitle(e.target.value)} className="text-lg" />
          </div>

          {(userPreferences?.audience || userPreferences?.genre || userPreferences?.tone) && (
            <div className="flex gap-2 flex-wrap">
              {userPreferences.audience && <Badge variant="secondary">{userPreferences.audience}</Badge>}
              {userPreferences.genre && <Badge variant="secondary">{userPreferences.genre}</Badge>}
              {userPreferences.tone && <Badge variant="secondary">{userPreferences.tone}</Badge>}
            </div>
          )}

          <div className="space-y-3 p-4 bg-muted/40 rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2"><Target className="h-4 w-4" />目标总字数</Label>
              <span className="text-lg font-semibold">{(targetWords / 10000).toFixed(0)}万字</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {WORD_PRESETS.map(p => (
                <Button key={p.value} variant={targetWords === p.value ? 'default' : 'outline'} size="sm" onClick={() => setTargetWords(p.value)}>
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3 p-4 bg-muted/40 rounded-lg">
            <Label className="flex items-center gap-2"><Gauge className="h-4 w-4" />叙事节奏</Label>
            <div className="grid grid-cols-3 gap-3">
              {PACE_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setPace(opt.value)}
                  className={cn('p-3 rounded-lg border-2 text-left transition-colors',
                    pace === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30')}>
                  <span className="text-sm font-semibold">{opt.label}</span>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            {onBack && <Button variant="outline" onClick={onBack}>返回修改</Button>}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={skipAll}>
                <SkipForward className="mr-2 h-4 w-4" />跳过全部，直接创建项目
              </Button>
              <Button onClick={() => setPhase('review')} size="lg" className="px-8">
                <Sparkles className="mr-2 h-4 w-4" />开始创作
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ======== 完成阶段 ========
  if (phase === 'complete') {
    const doneCount = steps.filter(s => s.status === 'done').length
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-8 py-12 space-y-6 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <h2 className="text-2xl font-bold">项目创建成功！</h2>
        <p className="text-muted-foreground">
          已生成 {doneCount}/{STEP_DEFS.length} 个模块，正在跳转到编辑器...
        </p>
        <div className="flex gap-2 flex-wrap">
          {steps.filter(s => s.status === 'skipped').map(s => (
            <Badge key={s.key} variant="outline" className="text-xs">
              {STEP_DEFS.find(d => d.key === s.key)?.label} 已跳过
            </Badge>
          ))}
        </div>
      </div>
    )
  }

  // ======== 审核阶段 ========
  const step = currentStep
  const def = STEP_DEFS.find(d => d.key === activeStep)!
  const stepIdx = STEP_DEFS.findIndex(d => d.key === activeStep)

  return (
    <div className="flex h-full overflow-hidden">
      {/* 左侧步骤指示器 */}
      <div className="w-44 shrink-0 border-r bg-muted/20 p-4 space-y-1">
        {STEP_DEFS.map((d, i) => {
          const s = getStep(d.key)
          const isActive = d.key === activeStep
          return (
            <button
              key={d.key}
              type="button"
              disabled={s.status === 'pending'}
              onClick={() => switchToStep(d.key)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-2 rounded text-left text-sm transition-colors',
                isActive && 'bg-primary/10 ring-1 ring-primary/30',
                s.status === 'done' && !isActive && 'hover:bg-muted cursor-pointer',
                s.status === 'pending' && !isActive && 'text-muted-foreground',
                s.status === 'skipped' && 'text-muted-foreground line-through',
              )}
            >
              <span className="shrink-0">
                {s.status === 'loading' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                 s.status === 'done' ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> :
                 s.status === 'skipped' ? <XCircle className="h-3.5 w-3.5 text-muted-foreground" /> :
                 <span className="block h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30" />}
              </span>
              <span className="truncate">{d.label}</span>
              {isActive && <ChevronRight className="h-3 w-3 ml-auto" />}
            </button>
          )
        })}
      </div>

      {/* 右侧内容区 */}
      <div className="flex-1 flex flex-col px-6 py-6 min-h-0 overflow-hidden">
        {/* 步骤标题 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-full">{def.icon}</div>
          <div>
            <h3 className="text-lg font-semibold">{def.label}</h3>
            <p className="text-sm text-muted-foreground">
              第 {stepIdx + 1}/{STEP_DEFS.length} 步
            </p>
          </div>
        </div>

        {/* 加载态 */}
        {step.status === 'loading' && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-4 min-h-0">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">AI 正在生成{def.label}...</p>
          </div>
        )}

        {/* 生成失败 */}
        {step.error && step.status !== 'loading' && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-destructive font-medium">生成失败</p>
            <p className="text-sm text-muted-foreground">{step.error}</p>
            <Button onClick={() => generateStep(activeStep)}>重新生成</Button>
          </div>
        )}

        {/* 已完成 */}
        {step.status === 'done' && step.data && (
          <div className="space-y-4" style={{ flex: '1 1 0', minHeight: 0, overflowY: 'auto' }}>
            <StepResultPreview stepKey={activeStep} data={step.data} idea={idea} />
          </div>
        )}

        {/* 已跳过 */}
        {step.status === 'skipped' && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-3 text-center">
            <SkipForward className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">{def.label}已跳过</p>
            <p className="text-xs text-muted-foreground max-w-xs">项目创建后可在对应页面补充此模块</p>
            <Button variant="outline" size="sm" onClick={() => { updateStep(activeStep, { status: 'pending' }); generateStep(activeStep) }}>
              重新生成
            </Button>
          </div>
        )}

        {/* 底部操作栏 */}
        {(step.status === 'done' || step.status === 'skipped') && (
          <div className="space-y-3 pt-4 border-t mt-4">
            {/* 反馈输入 */}
            {step.status === 'done' && (
              <div className="flex gap-2">
                <Input
                  ref={feedbackRef}
                  placeholder="提出修改意见，AI 将基于反馈调整..."
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFeedback()}
                  className="text-sm"
                />
                <Button variant="outline" onClick={handleFeedback} disabled={!feedback.trim()}>
                  发送
                </Button>
              </div>
            )}

            {/* 导航按钮 */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={skipCurrent}>
                  跳过此步
                </Button>
                <Button variant="ghost" size="sm" onClick={skipAll} className="text-muted-foreground">
                  <SkipForward className="mr-1 h-3.5 w-3.5" />跳过后续全部
                </Button>
              </div>
              <Button onClick={goNext} size="sm" className="px-6">
                {stepIdx < STEP_DEFS.length - 1 ? '保留并继续 →' : '完成，创建项目'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============ 各步骤的结果预览 ============

/** 从 API 响应数据中提取数组——兼容 { items: [...] } 双层嵌套 */
function extractArray(data: any): any[] {
  if (!data) return []
  // 直接是数组
  if (Array.isArray(data)) return data
  // 对象，尝试取第一个值是数组的 key
  for (const key of Object.keys(data)) {
    if (Array.isArray(data[key])) return data[key]
  }
  return []
}

function StepResultPreview({ stepKey, data, idea }: { stepKey: StepKey; data: Record<string, unknown>; idea: StoryIdeaCard }) {
  switch (stepKey) {
    case 'architecture': {
      const arch = data.architecture as any || data
      return (
        <div className="space-y-3 text-sm">
          <CollapsibleSection title="故事梗概" defaultOpen>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{arch.storySummary}</p>
          </CollapsibleSection>
          {arch.mainConflict && (
            <CollapsibleSection title="核心冲突">
              <p className="text-muted-foreground">{arch.mainConflict}</p>
            </CollapsibleSection>
          )}
          {arch.volumePlan && (
            <CollapsibleSection title={`分卷方案（${arch.volumePlan.length}卷）`}>
              <div className="space-y-2">
                {(arch.volumePlan as any[]).map((v: any) => (
                  <div key={v.volumeNumber} className="p-2 bg-muted/40 rounded">
                    <span className="font-medium">第{v.volumeNumber}卷：{v.title}</span>
                    <span className="text-xs text-muted-foreground ml-2">第{v.chapterRange?.[0]}-{v.chapterRange?.[1]}章</span>
                    {v.description && <p className="text-xs text-muted-foreground mt-1">{v.description}</p>}
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}
          {data.chapterCalculation && (
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>计划章节：{(data.chapterCalculation as any).chapterCount}章</span>
              <span>分卷数：{(data.chapterCalculation as any).volumeCount}卷</span>
              <span>每章均字：{(data.chapterCalculation as any).avgChapterWords}字</span>
            </div>
          )}
        </div>
      )
    }

    case 'characters': {
      const chars = extractArray((data.characters as any)?.characters || data.characters)
      return (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">共 {Array.isArray(chars) ? chars.length : 0} 个角色</p>
          {Array.isArray(chars) && chars.map((c: any) => (
            <CollapsibleSection key={c.name} title={`${c.name}（${c.role || '未知'}）`}>
              <div className="space-y-1 text-xs">
                {c.description && <p className="text-muted-foreground">{c.description}</p>}
                {c.personality && <p>性格：{Array.isArray(c.personality) ? c.personality.join('、') : c.personality}</p>}
                {c.goal && <p>目标：{c.goal}</p>}
                {c.characterArc && <p>弧光：{c.characterArc}</p>}
                {c.dialogueStyle && <p>对话：{c.dialogueStyle}</p>}
                {c.relationships?.length > 0 && (
                  <p>关系：{c.relationships.map((r: any) => `${r.targetName}(${r.relation})`).join('、')}</p>
                )}
              </div>
            </CollapsibleSection>
          ))}
        </div>
      )
    }

    case 'world': {
      const ws = extractArray((data.worldSettings as any)?.worldSettings || data.worldSettings)
      return (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">共 {Array.isArray(ws) ? ws.length : 0} 个世界元素</p>
          {Array.isArray(ws) && ws.map((w: any) => (
            <CollapsibleSection key={w.name} title={`${w.name}（${w.type || '其他'} · ${w.scope || 'global'} · 重要度${w.importance || 5}）`}>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{w.description}</p>
            </CollapsibleSection>
          ))}
        </div>
      )
    }

    case 'volume': {
      const chs = extractArray((data.chapters as any)?.chapters || data.chapters)
      const arch = data as any
      return (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            共 {Array.isArray(chs) ? chs.length : 0} 章
            {arch.tensionArcSummary && <span className="block text-xs mt-1 italic">张力曲线：{arch.tensionArcSummary}</span>}
          </p>
          <div className="max-h-[400px] overflow-auto space-y-1">
            {Array.isArray(chs) && chs.slice(0, 30).map((c: any) => (
              <div key={c.chapterNumber} className="flex items-start gap-2 py-1 border-b border-muted text-xs">
                <span className="shrink-0 text-muted-foreground w-8">第{c.chapterNumber}章</span>
                <span className="font-medium shrink-0 w-24 truncate">{c.title}</span>
                <span className="text-muted-foreground line-clamp-1 flex-1">{c.summary}</span>
                <Badge variant="outline" className="text-[10px] shrink-0">{c.plotFunction}·{c.tensionLevel}</Badge>
              </div>
            ))}
            {Array.isArray(chs) && chs.length > 30 && (
              <p className="text-xs text-muted-foreground text-center py-2">... 还有 {chs.length - 30} 章</p>
            )}
          </div>
        </div>
      )
    }

    case 'foreshadowings': {
      const fs = extractArray((data.foreshadowings as any)?.foreshadowings || data.foreshadowings)
      return (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">共 {Array.isArray(fs) ? fs.length : 0} 个伏笔</p>
          {Array.isArray(fs) && fs.map((f: any) => (
            <div key={f.title} className="p-2 bg-muted/40 rounded text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{f.title}</span>
                <Badge variant="secondary" className="text-[10px]">{f.type}</Badge>
                <span className="text-muted-foreground">重要度{f.importance}</span>
                <span className="text-muted-foreground">→第{f.expectedChapterNumber}章</span>
              </div>
              <p className="text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      )
    }

    case 'styleAnchor': {
      const content = (data as any).content || ''
      return (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            风格锚点已生成（{(data as any).wordCount || content.length} 字）
          </p>
          <div className="p-4 bg-muted/40 rounded text-xs leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-auto">
            {String(content).slice(0, 500)}
            {String(content).length > 500 && <span className="text-muted-foreground">...</span>}
          </div>
        </div>
      )
    }

    default:
      return null
  }
}

// ============ 可折叠区域 ============

function CollapsibleSection({ title, children, defaultOpen = false }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground w-full text-left py-1">
          <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />
          {title}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-4 pt-1">{children}</CollapsibleContent>
    </Collapsible>
  )
}
