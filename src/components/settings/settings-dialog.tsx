'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SettingsFormAI } from './settings-form-ai'
import { SettingsFormUI } from './settings-form-ui'
import { SettingsFormProject } from './settings-form-project'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // 加载设置
  useEffect(() => {
    if (open) {
      fetchSettings()
    }
  }, [open])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/settings')
      if (!response.ok) throw new Error('加载设置失败')

      const data = await response.json()
      const settingsMap: Record<string, string> = {}

      // 将数组转换为键值对
      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          settingsMap[item.key] = item.value
        })
      }

      setSettings(settingsMap)
    } catch (error) {
      toast.error('加载失败：' + (error instanceof Error ? error.message : '请重试'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // 将设置转换为数组格式
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value
      }))

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsArray })
      })

      if (!response.ok) throw new Error('保存失败')

      toast.success('设置已保存')

      onOpenChange(false)
    } catch (error) {
      toast.error('保存失败：' + (error instanceof Error ? error.message : '请重试'))
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>系统设置</DialogTitle>
          <DialogDescription>
            配置 AI 模型、界面主题和项目默认值
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="ai" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ai">AI 配置</TabsTrigger>
              <TabsTrigger value="ui">界面配置</TabsTrigger>
              <TabsTrigger value="project">项目默认值</TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="space-y-4 mt-4">
              <SettingsFormAI settings={settings} onUpdate={updateSetting} />
            </TabsContent>

            <TabsContent value="ui" className="space-y-4 mt-4">
              <SettingsFormUI settings={settings} onUpdate={updateSetting} />
            </TabsContent>

            <TabsContent value="project" className="space-y-4 mt-4">
              <SettingsFormProject settings={settings} onUpdate={updateSetting} />
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              '保存设置'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
