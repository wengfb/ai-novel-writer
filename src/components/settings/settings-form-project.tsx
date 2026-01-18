'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

interface SettingsFormProjectProps {
  settings: Record<string, string>
  onUpdate: (key: string, value: string) => void
}

export function SettingsFormProject({ settings, onUpdate }: SettingsFormProjectProps) {
  return (
    <div className="space-y-6">
      {/* 默认小说类型 */}
      <div className="space-y-2">
        <Label htmlFor="project.defaultGenre">默认小说类型</Label>
        <Select
          value={settings['project.defaultGenre'] || '修仙'}
          onValueChange={(value) => onUpdate('project.defaultGenre', value)}
        >
          <SelectTrigger id="project.defaultGenre">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="修仙">修仙</SelectItem>
            <SelectItem value="都市">都市</SelectItem>
            <SelectItem value="科幻">科幻</SelectItem>
            <SelectItem value="玄幻">玄幻</SelectItem>
            <SelectItem value="言情">言情</SelectItem>
            <SelectItem value="武侠">武侠</SelectItem>
            <SelectItem value="历史">历史</SelectItem>
            <SelectItem value="其他">其他</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 默认章节字数 */}
      <div className="space-y-2">
        <Label htmlFor="project.defaultChapterWords">默认章节字数</Label>
        <Input
          id="project.defaultChapterWords"
          type="number"
          placeholder="3000"
          value={settings['project.defaultChapterWords'] || '3000'}
          onChange={(e) => onUpdate('project.defaultChapterWords', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          新建章节时的默认字数目标
        </p>
      </div>

      {/* 自动保存间隔 */}
      <div className="space-y-2">
        <Label htmlFor="project.autoSaveInterval">自动保存间隔（秒）</Label>
        <Input
          id="project.autoSaveInterval"
          type="number"
          placeholder="60"
          value={settings['project.autoSaveInterval'] || '60'}
          onChange={(e) => onUpdate('project.autoSaveInterval', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          设置为 0 禁用自动保存
        </p>
      </div>
    </div>
  )
}
