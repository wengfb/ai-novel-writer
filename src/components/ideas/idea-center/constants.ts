import type { IdeaItem } from '@/types'

export const statusBadgeMap: Record<string, { label: string; className: string } | null> = {
  draft: null,
  favorited: { label: '收藏', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  converted: { label: '已用', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
  archived: { label: '归档', className: 'bg-muted text-muted-foreground' },
}

export type IdeaFilters = {
  search: string
  statusFilter: string
  genreFilter: string
}

export function filterIdeas(ideas: IdeaItem[], filters: IdeaFilters): IdeaItem[] {
  return ideas.filter((idea) => {
    if (filters.search && !idea.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    if (filters.statusFilter !== 'all' && idea.status !== filters.statusFilter) return false
    if (filters.genreFilter !== 'all' && idea.genre !== filters.genreFilter) return false
    return true
  })
}
