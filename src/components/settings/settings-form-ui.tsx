'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

interface SettingsFormUIProps {
  settings: Record<string, string>
  onUpdate: (key: string, value: string) => void
}

const FONT_SIZE_OPTIONS = [
  { value: 'small', label: '小 (14px)' },
  { value: 'medium', label: '中 (16px)' },
  { value: 'large', label: '大 (18px)' },
  { value: 'xlarge', label: '特大 (20px)' },
]

const EDITOR_WIDTH_OPTIONS = [
  { value: 'narrow', label: '窄 (600px)' },
  { value: 'normal', label: '标准 (800px)' },
  { value: 'wide', label: '宽 (1000px)' },
  { value: 'full', label: '全宽' },
]

export function SettingsFormUI({ settings, onUpdate }: SettingsFormUIProps) {
  return (
    <div className="space-y-6">
      {/* Theme */}
      <div className="space-y-2">
        <Label htmlFor="editor.theme">界面主题</Label>
        <Select
          value={settings['editor.theme'] || 'dark'}
          onValueChange={(value) => onUpdate('editor.theme', value)}
        >
          <SelectTrigger id="editor.theme">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dark">深色</SelectItem>
            <SelectItem value="light">浅色</SelectItem>
            <SelectItem value="system">跟随系统</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          刷新页面后生效
        </p>
      </div>

      {/* Font Size */}
      <div className="space-y-2">
        <Label htmlFor="editor.fontSize">编辑器字体大小</Label>
        <Select
          value={settings['editor.fontSize'] || 'medium'}
          onValueChange={(value) => onUpdate('editor.fontSize', value)}
        >
          <SelectTrigger id="editor.fontSize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Editor Width */}
      <div className="space-y-2">
        <Label htmlFor="editor.width">编辑器宽度</Label>
        <Select
          value={settings['editor.width'] || 'normal'}
          onValueChange={(value) => onUpdate('editor.width', value)}
        >
          <SelectTrigger id="editor.width">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EDITOR_WIDTH_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Auto Save */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="editor.autoSave">自动保存</Label>
          <p className="text-xs text-muted-foreground">
            编辑器内容变更后自动保存
          </p>
        </div>
        <Switch
          id="editor.autoSave"
          checked={settings['editor.autoSave'] !== 'false'}
          onCheckedChange={(checked) =>
            onUpdate('editor.autoSave', checked.toString())
          }
        />
      </div>

      {/* Auto Save Interval */}
      <div className="space-y-2">
        <Label htmlFor="editor.autoSaveInterval">自动保存间隔（秒）</Label>
        <Input
          id="editor.autoSaveInterval"
          type="number"
          placeholder="60"
          value={settings['editor.autoSaveInterval'] || '60'}
          onChange={(e) => onUpdate('editor.autoSaveInterval', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          设置为 0 禁用自动保存
        </p>
      </div>
    </div>
  )
}
