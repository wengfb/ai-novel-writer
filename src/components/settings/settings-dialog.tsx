'use client'

import { useEffect } from 'react'
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
import { useSettingsStore } from '@/lib/store/settings-store'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const {
    settings,
    isLoading,
    isSaving,
    loadSettings,
    saveSettings,
    updateSetting,
  } = useSettingsStore()

  useEffect(() => {
    if (open) {
      loadSettings()
    }
  }, [open, loadSettings])

  const handleSave = async () => {
    try {
      await saveSettings(settings)
      toast.success('设置已保存')
      onOpenChange(false)
    } catch {
      toast.error('保存失败，请重试')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>系统设置</DialogTitle>
          <DialogDescription>
            配置 AI 模型、编辑器偏好和项目默认值。留空的字段将使用环境变量中的默认值。
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
              <TabsTrigger value="editor">编辑器</TabsTrigger>
              <TabsTrigger value="project">项目默认值</TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="space-y-4 mt-4">
              <SettingsFormAI settings={settings} onUpdate={updateSetting} />
            </TabsContent>

            <TabsContent value="editor" className="space-y-4 mt-4">
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
