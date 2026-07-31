'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SettingsFormAI } from './settings-form-ai'
import { SettingsFormUI } from './settings-form-ui'
import { SettingsFormProject } from './settings-form-project'
import { SettingsFormAgents } from './settings-form-agents'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useSettingsStore } from '@/lib/store/settings-store'

interface SettingsPanelProps {
  onClose?: () => void
}

type SettingsTab = 'ai' | 'agents' | 'editor' | 'project'

/** 系统设置 — 中间区工作页（非模态盖层） */
export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const {
    settings,
    isLoading,
    isSaving,
    loadSettings,
    saveSettings,
    updateSetting,
  } = useSettingsStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>('ai')

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleSave = async () => {
    try {
      await saveSettings(settings)
      toast.success('设置已保存')
    } catch {
      toast.error('保存失败，请重试')
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {onClose && (
            <Button variant="ghost" size="sm" className="shrink-0 gap-1.5" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
              返回
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-semibold">系统设置</h1>
            <p className="truncate text-sm text-muted-foreground">
              AI 模型、Agent 参数与提示词、编辑器与项目默认值
            </p>
          </div>
        </div>
        <Button
          type="submit"
          form="system-settings-form"
          disabled={isSaving || isLoading}
          className="shrink-0"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            '保存设置'
          )}
        </Button>
      </div>

      <form
        id="system-settings-form"
        className="flex-1 overflow-y-auto p-4 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault()
          void handleSave()
        }}
      >
        <div className="mx-auto max-w-4xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as SettingsTab)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="ai">AI 配置</TabsTrigger>
                <TabsTrigger value="agents">Agent 配置</TabsTrigger>
                <TabsTrigger value="editor">编辑器</TabsTrigger>
                <TabsTrigger value="project">项目默认值</TabsTrigger>
              </TabsList>

              {/* 只挂载当前 Tab，避免未激活面板预拉数据 */}
              {activeTab === 'ai' && (
                <TabsContent value="ai" className="mt-4 space-y-4" forceMount>
                  <SettingsFormAI settings={settings} onUpdate={updateSetting} />
                </TabsContent>
              )}
              {activeTab === 'agents' && (
                <TabsContent value="agents" className="mt-4 space-y-4" forceMount>
                  <SettingsFormAgents />
                </TabsContent>
              )}
              {activeTab === 'editor' && (
                <TabsContent value="editor" className="mt-4 space-y-4" forceMount>
                  <SettingsFormUI settings={settings} onUpdate={updateSetting} />
                </TabsContent>
              )}
              {activeTab === 'project' && (
                <TabsContent value="project" className="mt-4 space-y-4" forceMount>
                  <SettingsFormProject settings={settings} onUpdate={updateSetting} />
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      </form>
    </div>
  )
}
