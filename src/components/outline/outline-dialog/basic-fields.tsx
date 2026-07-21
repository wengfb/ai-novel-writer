'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Outline } from '@/lib/store/outline-store'
import type { OutlineFormData } from './types'

interface OutlineBasicFieldsProps {
  formData: OutlineFormData
  setFormData: React.Dispatch<React.SetStateAction<OutlineFormData>>
  availableParents: Outline[]
}

/** 大纲基础字段：类型、排序、标题、父节点、描述、目标字数 */
export function OutlineBasicFields({
  formData,
  setFormData,
  availableParents,
}: OutlineBasicFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">节点类型 *</Label>
          <Select
            value={formData.type}
            onValueChange={(value: any) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="volume">卷</SelectItem>
              <SelectItem value="chapter">章</SelectItem>
              <SelectItem value="scene">场景</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="order">排序</Label>
          <Input
            id="order"
            type="number"
            min="0"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">标题 *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="例如：第一章 - 开始"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="parentId">父节点</Label>
        <Select
          value={formData.parentId}
          onValueChange={(value) => setFormData({ ...formData, parentId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="无父节点（顶级节点）" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">无父节点（顶级节点）</SelectItem>
            {availableParents.map((outline) => (
              <SelectItem key={outline.id} value={outline.id}>
                {outline.type === 'volume' ? '卷' : outline.type === 'chapter' ? '章' : '场景'} - {outline.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">描述</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="描述此大纲节点的内容..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetWords">目标字数</Label>
        <Input
          id="targetWords"
          type="number"
          min="0"
          value={formData.targetWords}
          onChange={(e) => setFormData({ ...formData, targetWords: e.target.value })}
          placeholder="例如：3000"
        />
      </div>
    </>
  )
}
