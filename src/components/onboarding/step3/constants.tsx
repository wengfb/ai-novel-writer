import { BookOpen, Users, Globe, Eye, Sparkles, FileText } from 'lucide-react'
import type { StepKey } from './types'

export const STEP_DEFS: { key: StepKey; label: string; icon: React.ReactNode; apiPath: string }[] = [
  { key: 'architecture', label: '故事架构', icon: <BookOpen className="h-4 w-4" />, apiPath: '/api/ai/generate/architecture' },
  { key: 'characters', label: '角色群像', icon: <Users className="h-4 w-4" />, apiPath: '/api/ai/generate/characters' },
  { key: 'world', label: '世界观', icon: <Globe className="h-4 w-4" />, apiPath: '/api/ai/generate/world-plan' },
  { key: 'volume', label: '分卷大纲', icon: <FileText className="h-4 w-4" />, apiPath: '/api/ai/generate/volume-plan' },
  { key: 'foreshadowings', label: '伏笔网络', icon: <Eye className="h-4 w-4" />, apiPath: '/api/ai/generate/foreshadowings' },
  { key: 'styleAnchor', label: '风格锚点', icon: <Sparkles className="h-4 w-4" />, apiPath: '/api/ai/generate/style-anchor' },
]

export const PACE_OPTIONS = [
  { value: 'fast' as const, label: '快节奏', desc: '短章快更，情节紧凑' },
  { value: 'medium' as const, label: '中等', desc: '标准篇幅，张弛有度' },
  { value: 'slow' as const, label: '慢节奏', desc: '长章慢展，细节丰富' },
]

export const WORD_PRESETS = [
  { value: 500000, label: '50万' },
  { value: 1000000, label: '100万' },
  { value: 2000000, label: '200万' },
  { value: 3000000, label: '300万' },
  { value: 5000000, label: '500万' },
  { value: 10000000, label: '1000万' },
]

export const WORD_COUNT_DEVIATION_WARNING_THRESHOLD = 20
