'use client'

/**
 * 模型选择器：支持直接输入模型 ID，也可从已获取列表中搜索选择。
 * 打开下拉时通过 onOpen 触发列表加载，避免页面挂载时重复请求。
 */

import { useId, useRef, useState } from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { ModelOption } from '@/lib/ai/model-list'

interface ModelPickerProps {
  id?: string
  value: string
  models: ModelOption[]
  onChange: (value: string) => void
  /** 下拉打开时回调（用于懒加载模型列表） */
  onOpen?: () => void
  placeholder?: string
  disabled?: boolean
  isLoading?: boolean
  className?: string
  size?: 'default' | 'sm'
  /** 允许清空为「继承全局」 */
  allowEmpty?: boolean
  emptyLabel?: string
}

export function ModelPicker({
  id,
  value,
  models,
  onChange,
  onOpen,
  placeholder = '输入或选择模型 ID',
  disabled = false,
  isLoading = false,
  className,
  size = 'default',
  allowEmpty = false,
  emptyLabel = '继承全局默认模型',
}: ModelPickerProps) {
  const [open, setOpen] = useState(false)
  const listId = useId()
  const openedOnceRef = useRef(false)
  const selected = models.find((model) => model.id === value)
  const triggerHeight = size === 'sm' ? 'h-8' : 'h-9'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next && !openedOnceRef.current) {
      openedOnceRef.current = true
      onOpen?.()
    } else if (next && models.length === 0 && !isLoading) {
      // 缓存被清空或首次失败后允许再拉
      onOpen?.()
    }
  }

  const pick = (next: string) => {
    onChange(next)
    // 延后关闭，确保受控 value 先提交
    requestAnimationFrame(() => setOpen(false))
  }

  return (
    <div className={cn('flex gap-2', className)}>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={cn('min-w-0 flex-1', triggerHeight, textSize)}
        autoComplete="off"
      />
      <Popover open={open} onOpenChange={handleOpenChange} modal>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn('shrink-0 px-2.5', triggerHeight)}
            aria-label="打开模型列表"
            aria-expanded={open}
            aria-controls={listId}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronsUpDown className="h-4 w-4 opacity-70" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          id={listId}
          className="z-[200] w-[min(420px,calc(100vw-2rem))] p-0"
          align="end"
          sideOffset={6}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onWheel={(event) => event.stopPropagation()}
        >
          <Command shouldFilter>
            <CommandInput placeholder="搜索模型名称或 ID..." />
            <CommandList className="max-h-64">
              <CommandEmpty>
                {isLoading
                  ? '正在加载模型…'
                  : models.length > 0
                    ? '未找到匹配模型'
                    : '暂无模型，请点击「获取列表」'}
              </CommandEmpty>
              <CommandGroup heading={models.length > 0 ? `可用模型（${models.length}）` : '模型列表'}>
                {allowEmpty && (
                  <ModelOptionItem
                    selected={value === ''}
                    label={emptyLabel}
                    muted
                    searchValue="__inherit_global__"
                    onPick={() => pick('')}
                  />
                )}
                {value && !selected && (
                  <ModelOptionItem
                    selected
                    label="当前输入"
                    description={value}
                    searchValue={`current-input ${value}`}
                    onPick={() => pick(value)}
                  />
                )}
                {models.map((model) => (
                  <ModelOptionItem
                    key={model.id}
                    selected={value === model.id}
                    label={model.name}
                    description={model.name !== model.id ? model.id : undefined}
                    searchValue={`${model.name} ${model.id}`}
                    onPick={() => pick(model.id)}
                  />
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function ModelOptionItem({
  selected,
  label,
  description,
  muted,
  searchValue,
  onPick,
}: {
  selected: boolean
  label: string
  description?: string
  muted?: boolean
  searchValue: string
  onPick: () => void
}) {
  return (
    <CommandItem
      value={searchValue}
      // pointerdown 在 cmdk/form 嵌套场景更可靠；同时保留 onSelect 给键盘
      onSelect={onPick}
      onPointerDown={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onPick()
      }}
    >
      <Check className={cn('mr-2 h-4 w-4 shrink-0', selected ? 'opacity-100' : 'opacity-0')} />
      <div className="min-w-0">
        <p className={cn('truncate text-sm', muted && 'text-muted-foreground')}>{label}</p>
        {description && (
          <p className="truncate font-mono text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </CommandItem>
  )
}

export type { ModelOption }
