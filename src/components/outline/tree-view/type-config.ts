import { BookOpen, FileText, Clapperboard } from 'lucide-react'

export const typeConfig = {
  volume: {
    icon: BookOpen,
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500',
  },
  chapter: {
    icon: FileText,
    textColor: 'text-green-600',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500',
  },
  scene: {
    icon: Clapperboard,
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500',
  },
}
