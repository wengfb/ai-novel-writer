import { prisma } from '@/lib/db/prisma'

export type ImpactCandidate = {
  resourceType: 'character' | 'outline' | 'chapter' | 'foreshadowing'
  resourceId: string
  resourceTitle: string
  impactKind: 'relationship' | 'wording' | 'causal_chain' | 'foreshadowing'
  evidence: string
  confidence: 'high' | 'medium'
}

function includesName(text: string | null | undefined, name: string) {
  return Boolean(text && name.trim() && text.includes(name.trim()))
}

/** 基于明确关联和文本命中的可解释扫描，不承诺穷尽语义影响。 */
export async function scanCharacterImpacts(projectId: string, characterId: string): Promise<ImpactCandidate[]> {
  const character = await prisma.character.findFirst({ where: { id: characterId, projectId } })
  if (!character) throw new Error('未找到当前角色')

  const [characters, outlines, chapters, foreshadowings] = await Promise.all([
    prisma.character.findMany({ where: { projectId, NOT: { id: characterId } } }),
    prisma.outline.findMany({ where: { projectId } }),
    prisma.chapter.findMany({ where: { projectId } }),
    prisma.foreshadowing.findMany({ where: { projectId } }),
  ])
  const result: ImpactCandidate[] = []

  for (const item of characters) {
    const related = includesName(item.relationships, character.name) || includesName(character.relationships, item.name)
    if (related) result.push({ resourceType: 'character', resourceId: item.id, resourceTitle: item.name, impactKind: 'relationship', evidence: `角色关系字段中存在与“${character.name}”或“${item.name}”的关联。`, confidence: 'high' })
  }
  for (const item of outlines) {
    const text = `${item.title}\n${item.description || ''}\n${item.causalFrom || ''}\n${item.causalTo || ''}`
    if (includesName(text, character.name)) result.push({ resourceType: 'outline', resourceId: item.id, resourceTitle: item.title, impactKind: 'causal_chain', evidence: `大纲文本或因果链命中角色名“${character.name}”。`, confidence: 'medium' })
  }
  for (const item of chapters) {
    if (includesName(`${item.summary || ''}\n${item.notes || ''}`, character.name)) result.push({ resourceType: 'chapter', resourceId: item.id, resourceTitle: `第 ${item.chapterNumber} 章·${item.title}`, impactKind: 'wording', evidence: `章节摘要或作者笔记命中角色名“${character.name}”。`, confidence: 'medium' })
  }
  for (const item of foreshadowings) {
    let relatedIds: string[] = []
    try { relatedIds = JSON.parse(item.relatedCharacters || '[]') } catch { /* 保持空数组 */ }
    if (relatedIds.includes(character.id) || includesName(`${item.title}\n${item.description}`, character.name)) result.push({ resourceType: 'foreshadowing', resourceId: item.id, resourceTitle: item.title, impactKind: 'foreshadowing', evidence: relatedIds.includes(character.id) ? '伏笔关联角色列表包含该角色。' : `伏笔文本命中角色名“${character.name}”。`, confidence: relatedIds.includes(character.id) ? 'high' : 'medium' })
  }
  return result
}
