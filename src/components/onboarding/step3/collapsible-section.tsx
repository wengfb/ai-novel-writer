'use client'

import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground w-full text-left py-1">
          <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />
          {title}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-4 pt-1">{children}</CollapsibleContent>
    </Collapsible>
  )
}
