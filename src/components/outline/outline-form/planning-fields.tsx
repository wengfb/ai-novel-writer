'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import type { OutlineFormData } from './types'

interface OutlinePlanningFieldsProps {
  formData: OutlineFormData
  setFormData: React.Dispatch<React.SetStateAction<OutlineFormData>>
}

/** 渐进式规划选项字段（不含分区标题，由 DetailSection 提供） */
export function OutlinePlanningFields({ formData, setFormData }: OutlinePlanningFieldsProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="outline-planning-mode">规划模式</Label>
          <Select
            value={formData.planningMode}
            onValueChange={(value: OutlineFormData['planningMode']) =>
              setFormData({ ...formData, planningMode: value })
            }
          >
            <SelectTrigger id="outline-planning-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">完整规划</SelectItem>
              <SelectItem value="progressive">渐进式规划</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="outline-confidence">置信度</Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {formData.confidence[0]} ·{' '}
              {formData.confidence[0] <= 3 ? '低' : formData.confidence[0] <= 7 ? '中' : '高'}
            </span>
          </div>
          <Slider
            id="outline-confidence"
            min={1}
            max={10}
            step={1}
            value={formData.confidence}
            onValueChange={(value) => setFormData({ ...formData, confidence: value })}
            className="w-full pt-2"
          />
        </div>
      </div>

      {formData.planningMode === 'progressive' && (
        <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="outline-planning-range">规划范围（章节数）</Label>
            <Input
              id="outline-planning-range"
              type="number"
              min="1"
              value={formData.planningRange}
              onChange={(e) => setFormData({ ...formData, planningRange: e.target.value })}
              placeholder="例如：5"
            />
          </div>

          <div className="flex items-center justify-between gap-4 sm:pt-6">
            <div className="space-y-0.5">
              <Label htmlFor="outline-flexible">灵活调整</Label>
              <p className="text-xs text-muted-foreground">
                允许根据实际写作情况调整规划
              </p>
            </div>
            <Switch
              id="outline-flexible"
              checked={formData.isFlexible}
              onCheckedChange={(checked) => setFormData({ ...formData, isFlexible: checked })}
            />
          </div>
        </div>
      )}
    </>
  )
}
