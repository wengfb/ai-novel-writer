'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GENRES } from './constants'

interface OutlineGenerateConfigFormProps {
  genre: string
  setGenre: (v: string) => void
  coreIdea: string
  setCoreIdea: (v: string) => void
  chapterCount: number
  setChapterCount: (v: number) => void
  targetWords: number
  setTargetWords: (v: number) => void
}

/** 大纲生成配置表单 */
export function OutlineGenerateConfigForm({
  genre,
  setGenre,
  coreIdea,
  setCoreIdea,
  chapterCount,
  setChapterCount,
  targetWords,
  setTargetWords,
}: OutlineGenerateConfigFormProps) {
  return (
    <div className="space-y-5 py-2">
      <div className="space-y-2">
        <Label>故事类型</Label>
        <Select value={genre} onValueChange={setGenre}>
          <SelectTrigger>
            <SelectValue placeholder="选择类型" />
          </SelectTrigger>
          <SelectContent>
            {GENRES.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>核心创意</Label>
        <Textarea
          placeholder="描述你的故事核心创意，例如：'一个被家族遗弃的少年，偶然得到神秘玉石，从此踏上修仙之路...'"
          value={coreIdea}
          onChange={(e) => setCoreIdea(e.target.value)}
          rows={5}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">至少10个字符，越详细生成效果越好</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>章节数量</Label>
          <span className="text-sm font-mono text-muted-foreground">{chapterCount} 章</span>
        </div>
        <Slider
          value={[chapterCount]}
          onValueChange={([v]) => setChapterCount(v)}
          min={5}
          max={100}
          step={1}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>每章目标字数</Label>
          <span className="text-sm font-mono text-muted-foreground">
            {targetWords.toLocaleString()} 字
          </span>
        </div>
        <Slider
          value={[targetWords]}
          onValueChange={([v]) => setTargetWords(v)}
          min={500}
          max={10000}
          step={500}
        />
      </div>
    </div>
  )
}
