'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import type { OutlineFormData } from './types'

interface OutlineIntentFieldsProps {
  formData: OutlineFormData
  setFormData: React.Dispatch<React.SetStateAction<OutlineFormData>>
}

/** 结构化创作意图字段（不含分区标题，由 DetailSection 提供） */
export function OutlineIntentFields({ formData, setFormData }: OutlineIntentFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="outline-emotional-goal">情感目标</Label>
        <Textarea
          id="outline-emotional-goal"
          value={formData.emotionalGoal}
          onChange={(e) => setFormData({ ...formData, emotionalGoal: e.target.value })}
          placeholder="例如：让读者为角色的命运感到揪心、营造温暖治愈的氛围..."
          rows={3}
          className="min-h-[80px] resize-y"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="outline-plot-function">情节功能</Label>
          <Select
            value={formData.plotFunction}
            onValueChange={(value: OutlineFormData['plotFunction']) =>
              setFormData({ ...formData, plotFunction: value })
            }
          >
            <SelectTrigger id="outline-plot-function">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="推进">推进 - 推动主线剧情向前发展</SelectItem>
              <SelectItem value="转折">转折 - 形成剧情拐点或意外发展</SelectItem>
              <SelectItem value="铺垫">铺垫 - 为后续关键剧情做伏笔铺垫</SelectItem>
              <SelectItem value="高潮">高潮 - 营造紧张激烈的剧情高潮</SelectItem>
              <SelectItem value="过渡">过渡 - 衔接上下文，节奏缓冲</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="outline-tension">张力等级</Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {formData.tensionLevel[0]} ·{' '}
              {formData.tensionLevel[0] <= 3
                ? '舒缓'
                : formData.tensionLevel[0] <= 5
                  ? '适中'
                  : formData.tensionLevel[0] <= 7
                    ? '紧张'
                    : '极高'}
            </span>
          </div>
          <Slider
            id="outline-tension"
            min={1}
            max={10}
            step={1}
            value={formData.tensionLevel}
            onValueChange={(value) => setFormData({ ...formData, tensionLevel: value })}
            className="w-full pt-2"
          />
        </div>
      </div>
    </>
  )
}
