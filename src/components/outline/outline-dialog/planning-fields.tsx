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

/** 渐进式规划选项字段 */
export function OutlinePlanningFields({ formData, setFormData }: OutlinePlanningFieldsProps) {
  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="text-sm font-medium">渐进式规划选项</h3>

      <div className="space-y-2">
        <Label htmlFor="planningMode">规划模式</Label>
        <Select
          value={formData.planningMode}
          onValueChange={(value: any) => setFormData({ ...formData, planningMode: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">完整规划</SelectItem>
            <SelectItem value="progressive">渐进式规划</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.planningMode === 'progressive' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="planningRange">规划范围（章节数）</Label>
            <Input
              id="planningRange"
              type="number"
              min="1"
              value={formData.planningRange}
              onChange={(e) => setFormData({ ...formData, planningRange: e.target.value })}
              placeholder="例如：5"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isFlexible">灵活调整</Label>
              <p className="text-xs text-muted-foreground">
                允许根据实际写作情况调整规划
              </p>
            </div>
            <Switch
              id="isFlexible"
              checked={formData.isFlexible}
              onCheckedChange={(checked) => setFormData({ ...formData, isFlexible: checked })}
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="confidence">置信度: {formData.confidence[0]}</Label>
          <span className="text-xs text-muted-foreground">
            {formData.confidence[0] <= 3 ? '低' : formData.confidence[0] <= 7 ? '中' : '高'}
          </span>
        </div>
        <Slider
          id="confidence"
          min={1}
          max={10}
          step={1}
          value={formData.confidence}
          onValueChange={(value) => setFormData({ ...formData, confidence: value })}
          className="w-full"
        />
      </div>
    </div>
  )
}
