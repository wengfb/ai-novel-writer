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

interface SettingsFormProjectProps {
  settings: Record<string, string>
  onUpdate: (key: string, value: string) => void
}

const GENRE_OPTIONS = [
  '修仙', '都市', '科幻', '玄幻', '言情', '武侠', '历史',
  '悬疑', '恐怖', '军事', '竞技', '轻小说', '其他',
]

export function SettingsFormProject({ settings, onUpdate }: SettingsFormProjectProps) {
  return (
    <div className="space-y-6">
      {/* Default Genre */}
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
            {GENRE_OPTIONS.map((genre) => (
              <SelectItem key={genre} value={genre}>
                {genre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          新建项目时的默认小说类型
        </p>
      </div>

      {/* Default Chapter Words */}
      <div className="space-y-2">
        <Label htmlFor="project.defaultWords">默认章节字数目标</Label>
        <Input
          id="project.defaultWords"
          type="number"
          placeholder="3000"
          value={settings['project.defaultWords'] || '3000'}
          onChange={(e) => onUpdate('project.defaultWords', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          AI 生成章节时的默认字数目标
        </p>
      </div>
    </div>
  )
}
