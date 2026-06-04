import { OutlinePlotFunctionValues } from '@/lib/api/schemas'
import type { ChapterCalculation } from '@/lib/ai/onboarding/types'

// ============ 题材/角色/世界观 规范化映射 ============

const SUPPORTED_PROJECT_GENRES = ['玄幻', '科幻', '都市', '言情', '武侠', '历史', '其他'] as const

const CHARACTER_ROLE_MAP: Record<string, 'protagonist' | 'antagonist' | 'supporting' | 'minor'> = {
  主角: 'protagonist',
  反派: 'antagonist',
  配角: 'supporting',
  次要角色: 'minor',
  其他: 'supporting',
}

const WORLD_TYPE_MAP: Record<string, 'location' | 'history' | 'magic' | 'organization' | 'item' | 'other'> = {
  地理: 'location',
  历史: 'history',
  魔法: 'magic',
  修仙: 'magic',
  组织: 'organization',
  宗门: 'organization',
  物品: 'item',
  机制: 'other',
  其他: 'other',
}

const GENRE_MAP: Record<string, string> = {
  修仙: '玄幻',
  仙侠: '玄幻',
  异能: '都市',
  末世: '科幻',
  游戏: '科幻',
  军事: '历史',
}

export function normalizeProjectGenre(genre: string): (typeof SUPPORTED_PROJECT_GENRES)[number] {
  const primaryGenre = genre.split('|')[0].trim()
  const mappedGenre = GENRE_MAP[primaryGenre] || primaryGenre
  return SUPPORTED_PROJECT_GENRES.includes(mappedGenre as (typeof SUPPORTED_PROJECT_GENRES)[number])
    ? (mappedGenre as (typeof SUPPORTED_PROJECT_GENRES)[number])
    : '其他'
}

export function normalizeCharacterRole(role?: string): 'protagonist' | 'antagonist' | 'supporting' | 'minor' {
  if (!role) return 'supporting'
  if (CHARACTER_ROLE_MAP[role]) return CHARACTER_ROLE_MAP[role]
  return ['protagonist', 'antagonist', 'supporting', 'minor'].includes(role)
    ? (role as 'protagonist' | 'antagonist' | 'supporting' | 'minor')
    : 'supporting'
}

export function normalizeWorldElementType(type?: string): 'location' | 'history' | 'magic' | 'organization' | 'item' | 'other' {
  if (!type) return 'other'
  const normalized = type.includes('/') ? type.split('/')[0].trim() : type.trim()
  if (WORLD_TYPE_MAP[normalized]) return WORLD_TYPE_MAP[normalized]
  return ['location', 'history', 'magic', 'organization', 'item', 'other'].includes(normalized)
    ? (normalized as 'location' | 'history' | 'magic' | 'organization' | 'item' | 'other')
    : 'other'
}

export function normalizePlotFunction(plotFunction?: string): (typeof OutlinePlotFunctionValues)[number] {
  return OutlinePlotFunctionValues.includes(plotFunction as (typeof OutlinePlotFunctionValues)[number])
    ? (plotFunction as (typeof OutlinePlotFunctionValues)[number])
    : '推进'
}

export function normalizeTensionLevel(tensionLevel?: number): number {
  if (typeof tensionLevel !== 'number') return 5
  if (tensionLevel < 1) return 1
  if (tensionLevel > 10) return 10
  return Math.round(tensionLevel)
}

// ============ 动态章节/分卷计算 ============

const PACE_CONFIG = {
  fast: { avgWordsPerChapter: 5000, chaptersPerVolume: 25 },
  medium: { avgWordsPerChapter: 3500, chaptersPerVolume: 20 },
  slow: { avgWordsPerChapter: 2500, chaptersPerVolume: 15 },
} as const

/**
 * 根据目标字数和节奏计算章节数、分卷数
 */
export function calculateChapterCount(
  targetWords: number,
  pace: 'fast' | 'medium' | 'slow' = 'medium'
): ChapterCalculation {
  const config = PACE_CONFIG[pace]
  const chapterCount = Math.max(8, Math.ceil(targetWords / config.avgWordsPerChapter))
  const volumeCount = Math.max(1, Math.ceil(targetWords / (config.chaptersPerVolume * config.avgWordsPerChapter)))
  const chaptersPerVolume = Math.ceil(chapterCount / volumeCount)
  const avgChapterWords = Math.round(targetWords / chapterCount)

  return { chapterCount, volumeCount, chaptersPerVolume, avgChapterWords }
}

/**
 * 计算分卷的章节范围
 */
export function calculateVolumeSplit(
  chapterCount: number,
  volumeCount: number
): { volumeNumber: number; chapterStart: number; chapterEnd: number }[] {
  const baseSize = Math.floor(chapterCount / volumeCount)
  const remainder = chapterCount % volumeCount
  const volumes: { volumeNumber: number; chapterStart: number; chapterEnd: number }[] = []

  let currentChapter = 1
  for (let v = 1; v <= volumeCount; v++) {
    // 前 remainder 卷多分一章
    const size = baseSize + (v <= remainder ? 1 : 0)
    volumes.push({
      volumeNumber: v,
      chapterStart: currentChapter,
      chapterEnd: currentChapter + size - 1,
    })
    currentChapter += size
  }

  return volumes
}
