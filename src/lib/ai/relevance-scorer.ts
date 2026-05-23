import type { Chapter, Character, Foreshadowing } from '@/types'

/**
 * 计算角色名称在章节中的衰减加权提及次数
 * 当前章节权重 1.0，每往前一章衰减 0.2，最低 0.2
 */
export function recencyWeightedMentions(
  name: string,
  chapters: Chapter[],
  currentIndex: number
): number {
  let score = 0
  const nameLower = name.toLowerCase()

  for (let i = currentIndex - 1; i >= 0; i--) {
    const chapter = chapters[i]
    if (!chapter?.content) continue

    const distance = currentIndex - 1 - i
    const weight = Math.max(1.0 - distance * 0.2, 0.2)

    const mentions = (chapter.content.toLowerCase().match(
      new RegExp(nameLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    ) || []).length

    score += mentions * weight
  }

  return score
}

/**
 * 角色重要性倍率
 */
export function roleMultiplier(role: string): number {
  switch (role) {
    case 'protagonist': return 3.0
    case 'antagonist': return 2.5
    case 'supporting': return 1.0
    case 'minor': return 0.5
    default: return 1.0
  }
}

/**
 * 关系密度分数
 * 解析 relationships JSON，关系越多的角色越中心
 */
export function relationshipDensity(
  character: Character,
  allCharacters: Character[]
): number {
  if (!character.relationships) return 0

  try {
    const rels = JSON.parse(character.relationships)
    if (typeof rels !== 'object' || !rels) return 0

    const relCount = Object.keys(rels).length

    // 同时检查其他角色是否与此角色有关联
    let referencedByOthers = 0
    for (const other of allCharacters) {
      if (other.id === character.id || !other.relationships) continue
      try {
        const otherRels = JSON.parse(other.relationships)
        if (otherRels && typeof otherRels === 'object' && otherRels[character.name]) {
          referencedByOthers++
        }
      } catch { /* ignore malformed JSON */ }
    }

    return Math.min(relCount * 1.5 + referencedByOthers * 1.0, 15)
  } catch {
    return 0
  }
}

/**
 * 对角色列表按相关性+重要性排序
 */
export function scoreCharacters(
  characters: Character[],
  allChapters: Chapter[],
  currentIndex: number
): Character[] {
  if (!allChapters[currentIndex - 1]?.content) {
    return characters.sort((a, b) => (b.importance || 5) - (a.importance || 5))
  }

  const scored = characters.map((character) => {
    const importance = character.importance || 5
    const mentions = recencyWeightedMentions(character.name, allChapters, currentIndex)
    const density = relationshipDensity(character, characters)
    const multiplier = roleMultiplier(character.role)

    const score = (importance * 4 + mentions * 6) * multiplier + density

    return { character, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored.map(s => s.character)
}

/**
 * 对世界观元素列表按相关性+重要性排序
 */
export function scoreWorldElements(
  elements: import('@/types').WorldElement[],
  allChapters: Chapter[],
  currentIndex: number
): import('@/types').WorldElement[] {
  const currentChapter = allChapters[currentIndex - 1]

  if (!currentChapter?.content) {
    return elements.sort((a, b) => {
      const scopeWeight = { global: 3, regional: 2, local: 1 }
      const scoreA = (a.importance || 5) * 10 + (scopeWeight[a.scope as keyof typeof scopeWeight] || 1)
      const scoreB = (b.importance || 5) * 10 + (scopeWeight[b.scope as keyof typeof scopeWeight] || 1)
      return scoreB - scoreA
    })
  }

  const content = currentChapter.content.toLowerCase()
  const scored = elements.map((element) => {
    const importance = element.importance || 5
    const scopeWeight = { global: 20, regional: 10, local: 5 }
    const categoryWeight = { core_rule: 20, detail: 10, background: 5 }

    // 全局元素保底分
    const globalFloor = element.scope === 'global' ? 25 : 0

    // 核心规则加成
    const coreRuleBonus = element.category === 'core_rule' ? 10 : 0

    // 衰减提及次数
    const mentions = recencyWeightedMentions(element.name, allChapters, currentIndex)

    const score = globalFloor
      + importance * 3
      + (scopeWeight[element.scope as keyof typeof scopeWeight] || 5)
      + (categoryWeight[element.category as keyof typeof categoryWeight] || 10)
      + mentions * 3
      + coreRuleBonus

    return { element, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored.map(s => s.element)
}

/**
 * 对伏笔列表排序（用于上下文筛选）
 */
export function scoreForeshadowings(
  foreshadowings: Foreshadowing[],
  currentChapterNumber: number
): Foreshadowing[] {
  const active = foreshadowings.filter(
    f => f.status === 'planted' || f.status === 'planned'
  )

  const scored = active.map((f) => {
    const importance = f.importance || 5

    // 预期章节接近当前章节的伏笔得分更高（即将回收）
    let proximityScore = 0
    if (f.expectedChapterNumber) {
      const distance = Math.abs(f.expectedChapterNumber - currentChapterNumber)
      proximityScore = Math.max(10 - distance, 0)
    }

    // 有 reminder 的伏笔加分
    const reminderBonus = f.reminderChapterNumber
      && f.reminderChapterNumber <= currentChapterNumber ? 5 : 0

    return { foreshadowing: f, score: importance * 2 + proximityScore + reminderBonus }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored.map(s => s.foreshadowing)
}
