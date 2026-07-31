'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Gauge, Target, SkipForward, PenLine, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserPreferences } from './types'
import { PACE_OPTIONS, WORD_PRESETS } from './constants'

interface ConfigPhaseProps {
  projectTitle: string
  setProjectTitle: (v: string) => void
  targetWords: number
  setTargetWords: (v: number) => void
  pace: 'fast' | 'medium' | 'slow'
  setPace: (v: 'fast' | 'medium' | 'slow') => void
  pov: 'first_person' | 'third_person' | 'multiple_pov'
  setPov: (v: 'first_person' | 'third_person' | 'multiple_pov') => void
  userPreferences?: UserPreferences
  onBack?: () => void
  onSkipAll: () => void
  onStart: () => void
  isBusy?: boolean
  error?: string | null
}

export function ConfigPhase({
  projectTitle,
  setProjectTitle,
  targetWords,
  setTargetWords,
  pace,
  setPace,
  pov,
  setPov,
  userPreferences,
  onBack,
  onSkipAll,
  onStart,
  isBusy = false,
  error = null,
}: ConfigPhaseProps) {
  return (
    <div className="flex flex-col h-full overflow-auto px-8 py-6">
      <div className="w-full max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">准备创建你的小说项目</h2>
          <p className="text-muted-foreground">
            确认后会先创建项目，再分步生成架构、角色、世界观与大纲；中途退出可稍后继续。
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">项目名称</Label>
          <Input
            id="title"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="text-lg"
          />
        </div>

        {(userPreferences?.audience ||
          userPreferences?.genre ||
          userPreferences?.tone ||
          userPreferences?.pov) && (
          <div className="flex gap-2 flex-wrap">
            {userPreferences.audience && (
              <Badge variant="secondary">{userPreferences.audience}</Badge>
            )}
            {userPreferences.genre && <Badge variant="secondary">{userPreferences.genre}</Badge>}
            {userPreferences.tone && <Badge variant="secondary">{userPreferences.tone}</Badge>}
            {userPreferences.pov && (
              <Badge variant="secondary">
                {userPreferences.pov === 'first_person'
                  ? '第一人称'
                  : userPreferences.pov === 'third_person'
                    ? '第三人称'
                    : '多视角'}
              </Badge>
            )}
          </div>
        )}

        <div className="space-y-3 p-4 bg-muted/40 rounded-lg">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              目标总字数
            </Label>
            <span className="text-lg font-semibold">{(targetWords / 10000).toFixed(0)}万字</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {WORD_PRESETS.map((p) => (
              <Button
                key={p.value}
                variant={targetWords === p.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTargetWords(p.value)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3 p-4 bg-muted/40 rounded-lg">
          <Label className="flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            叙事节奏
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {PACE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPace(opt.value)}
                className={cn(
                  'p-3 rounded-lg border-2 text-left transition-colors',
                  pace === opt.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                )}
              >
                <span className="text-sm font-semibold">{opt.label}</span>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <Label className="flex items-center gap-2">
              <PenLine className="h-4 w-4" />
              叙事人称
            </Label>
            <div className="flex gap-2 flex-wrap">
              {(
                [
                  { value: 'third_person' as const, label: '第三人称', desc: '他/她视角，叙述灵活' },
                  { value: 'first_person' as const, label: '第一人称', desc: '我视角，代入感强' },
                  { value: 'multiple_pov' as const, label: '多视角', desc: '切换多人物视角' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPov(opt.value)}
                  className={cn(
                    'p-3 rounded-lg border-2 text-left transition-colors flex-1 min-w-[120px]',
                    pov === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  )}
                >
                  <span className="text-sm font-semibold">{opt.label}</span>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        ) : null}

        <div className="flex justify-between pt-4">
          {onBack && (
            <Button variant="outline" onClick={onBack} disabled={isBusy}>
              返回修改
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onSkipAll} disabled={isBusy || !projectTitle.trim()}>
              <SkipForward className="mr-2 h-4 w-4" />
              跳过全部，直接创建项目
            </Button>
            <Button
              onClick={onStart}
              size="lg"
              className="px-8"
              disabled={isBusy || !projectTitle.trim()}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isBusy ? '创建项目中…' : '开始创作'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
