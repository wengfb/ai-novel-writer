'use client'

import { useCharacters } from '@/hooks/use-characters'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Plus, User, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { type Character } from '@/lib/store/character-store'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/lib/store/ui-store'

interface CharacterListProps {
  projectId: string
  onCreateCharacter?: () => void
  onSelectCharacter?: (character: Character) => void
  onDeleteCharacter?: (character: Character) => void
  selectedId?: string | null
}

export function CharacterList({
  projectId,
  onCreateCharacter,
  onSelectCharacter,
  onDeleteCharacter,
  selectedId,
}: CharacterListProps) {
  const { characters, isLoading } = useCharacters(projectId)
  const characterEditPayload = useUIStore((s) => s.characterEditPayload)
  const activeId = selectedId ?? characterEditPayload?.character?.id ?? null

  if (isLoading) {
    return <CharacterListSkeleton />
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-3 py-2">
        <Button variant="outline" size="sm" className="w-full" onClick={onCreateCharacter}>
          <Plus className="mr-2 h-4 w-4" />
          新建角色
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {characters.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">暂无角色</div>
          ) : (
            characters.map((character) => {
              const active = activeId === character.id
              return (
                <div
                  key={character.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectCharacter?.(character)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectCharacter?.(character)
                    }
                  }}
                  className={cn(
                    'group flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 transition-colors',
                    active
                      ? 'border-primary/40 bg-primary/10'
                      : 'bg-card hover:bg-accent'
                  )}
                >
                  <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-sm font-medium">{character.name}</span>
                      <Badge
                        variant="secondary"
                        className="shrink-0 px-1 py-0 text-[10px]"
                      >
                        {character.role === 'protagonist'
                          ? '主'
                          : character.role === 'antagonist'
                            ? '反'
                            : character.role === 'supporting'
                              ? '配'
                              : '次'}
                      </Badge>
                    </div>
                  </div>
                  {onDeleteCharacter && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteCharacter(character)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function CharacterListSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}
