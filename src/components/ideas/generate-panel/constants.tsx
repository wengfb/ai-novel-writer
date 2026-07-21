import { Globe, User, Target, Flag, Lightbulb, TrendingUp, Play } from 'lucide-react'

export const AUDIENCE_OPTIONS = [
  { value: '', label: '不限' },
  { value: '男频', label: '男频' },
  { value: '女频', label: '女频' },
]

export const GENRE_OPTIONS = [
  { value: '', label: '不限' },
  { value: '玄幻修仙', label: '玄幻修仙' },
  { value: '都市', label: '都市' },
  { value: '科幻', label: '科幻' },
  { value: '悬疑灵异', label: '悬疑灵异' },
  { value: '历史', label: '历史' },
  { value: '游戏异界', label: '游戏异界' },
  { value: '末世', label: '末世' },
]

export const TONE_OPTIONS = [
  { value: '', label: '不限' },
  { value: '热血爽文', label: '热血爽文' },
  { value: '轻松搞笑', label: '轻松搞笑' },
  { value: '正剧严肃', label: '正剧严肃' },
  { value: '悬疑惊悚', label: '悬疑惊悚' },
  { value: '温馨治愈', label: '温馨治愈' },
]

export const FIELD_ICONS: Record<string, React.ReactNode> = {
  genre: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 flex-shrink-0"
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  ),
  worldBuilding: <Globe className="h-3.5 w-3.5 flex-shrink-0" />,
  protagonist: <User className="h-3.5 w-3.5 flex-shrink-0" />,
  coreConflict: <Target className="h-3.5 w-3.5 flex-shrink-0" />,
  mainGoal: <Flag className="h-3.5 w-3.5 flex-shrink-0" />,
  highConcept: <Lightbulb className="h-3.5 w-3.5 flex-shrink-0" />,
  sublimation: <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />,
  openingHook: <Play className="h-3.5 w-3.5 flex-shrink-0" />,
}

export const FIELD_LABELS: Record<string, string> = {
  genre: '题材',
  worldBuilding: '世界观',
  protagonist: '主角',
  coreConflict: '核心冲突',
  mainGoal: '主线目标',
  highConcept: '高概念梗概',
  sublimation: '内容升华',
  openingHook: '开篇切入点',
}

export const FIELD_ORDER = [
  'genre',
  'worldBuilding',
  'protagonist',
  'coreConflict',
  'mainGoal',
  'highConcept',
  'sublimation',
  'openingHook',
]
