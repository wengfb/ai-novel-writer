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

/** 结构化创作意图字段 */
export function OutlineIntentFields({ formData, setFormData }: OutlineIntentFieldsProps) {
  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="text-sm font-medium">结构化创作意图</h3>
      <p className="text-xs text-muted-foreground">
        这些设置将作为 AI 生成章节时的 prompt 约束
      </p>

      <div className="space-y-2">
        <Label htmlFor="emotionalGoal">情感目标</Label>
        <Textarea
          id="emotionalGoal"
          value={formData.emotionalGoal}
          onChange={(e) => setFormData({ ...formData, emotionalGoal: e.target.value })}
          placeholder="例如：让读者为角色的命运感到揪心、营造温暖治愈的氛围..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="plotFunction">情节功能</Label>
        <Select
          value={formData.plotFunction}
          onValueChange={(value: any) => setFormData({ ...formData, plotFunction: value })}
        >
          <SelectTrigger>
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
        <div className="flex items-center justify-between">
          <Label htmlFor="tensionLevel">张力等级: {formData.tensionLevel[0]}</Label>
          <span className="text-xs text-muted-foreground">
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
          id="tensionLevel"
          min={1}
          max={10}
          step={1}
          value={formData.tensionLevel}
          onValueChange={(value) => setFormData({ ...formData, tensionLevel: value })}
          className="w-full"
        />
      </div>
    </div>
  )
}
