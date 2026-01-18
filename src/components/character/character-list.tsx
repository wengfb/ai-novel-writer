'use client'

import { useCharacters } from '@/hooks/use-characters'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Plus, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface CharacterListProps {
  projectId: string
  onCreateCharacter?: () => void
}

export function CharacterList({ projectId, onCreateCharacter }: CharacterListProps) {
  const { characters, isLoading } = useCharacters(projectId)

  if (isLoading) {
    return <CharacterListSkeleton />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onCreateCharacter}
        >
          <Plus className="mr-2 h-4 w-4" />
          新建角色
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-2">
          {characters.length === 0 ? (
            <div className="text-center text-muted-foreground py-4 text-sm">
              暂无角色
            </div>
          ) : (
            characters.map((character) => (
              <div
                key={character.id}
                className="p-3 rounded-md border bg-card hover:bg-accent cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium text-sm truncate">{character.name}</h4>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {character.role === 'protagonist' ? '主角' :
                         character.role === 'antagonist' ? '反派' :
                         character.role === 'supporting' ? '配角' : '次要'}
                      </Badge>
                    </div>
                    {character.personality && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {character.personality}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
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
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  )
}
