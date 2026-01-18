'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

interface SettingsFormUIProps {
  settings: Record<string, string>
  onUpdate: (key: string, value: string) => void
}

export function SettingsFormUI({ settings, onUpdate }: SettingsFormUIProps) {
  return (
    <div className="space-y-6">
      {/* 主题 */}
      <div className="space-y-2">
        <Label htmlFor="ui.theme">主题</Label>
        <Select
          value={settings['ui.theme'] || 'system'}
          onValueChange={(value) => onUpdate('ui.theme', value)}
        >
          <SelectTrigger id="ui.theme">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">浅色</SelectItem>
            <SelectItem value="dark">深色</SelectItem>
            <SelectItem value="system">跟随系统</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 字体大小 */}
      <div className="space-y-2">
        <Label htmlFor="ui.fontSize">编辑器字体大小</Label>
        <Select
          value={settings['ui.fontSize'] || 'medium'}
          onValueChange={(value) => onUpdate('ui.fontSize', value)}
        >
          <SelectTrigger id="ui.fontSize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">小 (14px)</SelectItem>
            <SelectItem value="medium">中 (16px)</SelectItem>
            <SelectItem value="large">大 (18px)</SelectItem>
            <SelectItem value="xlarge">特大 (20px)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 编辑器宽度 */}
      <div className="space-y-2">
        <Label htmlFor="ui.editorWidth">编辑器宽度</Label>
        <Select
          value={settings['ui.editorWidth'] || 'normal'}
          onValueChange={(value) => onUpdate('ui.editorWidth', value)}
        >
          <SelectTrigger id="ui.editorWidth">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="narrow">窄 (600px)</SelectItem>
            <SelectItem value="normal">正常 (800px)</SelectItem>
            <SelectItem value="wide">宽 (1000px)</SelectItem>
            <SelectItem value="full">全宽</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
