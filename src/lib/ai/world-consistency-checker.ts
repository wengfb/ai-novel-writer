import type { Chapter, WorldElement } from '@/types'

/**
 * 世界观冲突类型
 */
export interface WorldConflict {
  type: 'contradiction' | 'inconsistency' | 'missing_reference'
  severity: 'high' | 'medium' | 'low'
  elementId: string
  elementName: string
  chapterId: string
  chapterNumber: number
  description: string
  suggestion?: string
  conflictingContent?: string
  originalSetting?: string
}

/**
 * 世界观一致性检查器
 * 负责检测章节内容与世界观设定的冲突
 */
export class WorldConsistencyChecker {
  /**
   * 检查章节与世界观设定的一致性
   */
  async checkChapter(
    chapter: Chapter,
    worldElements: WorldElement[]
  ): Promise<WorldConflict[]> {
    const conflicts: WorldConflict[] = []

    // 1. 检查核心规则冲突
    const ruleConflicts = await this.checkCoreRules(chapter, worldElements)
    conflicts.push(...ruleConflicts)

    // 2. 检查设定前后矛盾
    const contradictions = await this.checkContradictions(chapter, worldElements)
    conflicts.push(...contradictions)

    // 3. 检查缺失引用
    const missingRefs = await this.checkMissingReferences(chapter, worldElements)
    conflicts.push(...missingRefs)

    return conflicts
  }

  /**
   * 检查核心规则冲突
   */
  private async checkCoreRules(
    chapter: Chapter,
    worldElements: WorldElement[]
  ): Promise<WorldConflict[]> {
    const conflicts: WorldConflict[] = []
    const content = chapter.content.toLowerCase()

    // 筛选核心规则类型的世界观元素
    const coreRules = worldElements.filter(e => e.category === 'core_rule')

    for (const rule of coreRules) {
      // 检查章节中是否提到该规则
      if (!content.includes(rule.name.toLowerCase())) {
        continue
      }

      // 解析约束条件
      const constraints = this.parseConstraints(rule.constraints)

      // 检查是否违反约束
      for (const constraint of constraints) {
        if (this.violatesConstraint(chapter.content, constraint)) {
          conflicts.push({
            type: 'contradiction',
            severity: 'high',
            elementId: rule.id,
            elementName: rule.name,
            chapterId: chapter.id,
            chapterNumber: chapter.chapterNumber,
            description: `章节内容可能违反了核心规则"${rule.name}"的约束条件`,
            suggestion: `请检查是否符合设定：${constraint.description}`,
            originalSetting: rule.description,
          })
        }
      }
    }

    return conflicts
  }

  /**
   * 检查设定前后矛盾
   */
  private async checkContradictions(
    chapter: Chapter,
    worldElements: WorldElement[]
  ): Promise<WorldConflict[]> {
    const conflicts: WorldConflict[] = []
    const content = chapter.content

    for (const element of worldElements) {
      // 检查该元素是否在章节中被提及
      if (!content.toLowerCase().includes(element.name.toLowerCase())) {
        continue
      }

      // 解析历史引用
      const references = this.parseReferences(element.references)

      // 检查当前章节的描述是否与历史引用一致
      for (const ref of references) {
        if (ref.chapterId === chapter.id) continue // 跳过当前章节

        const similarity = this.checkDescriptionSimilarity(
          content,
          ref.context,
          element.name
        )

        if (similarity < 0.5) { // 相似度低于50%可能存在矛盾
          conflicts.push({
            type: 'inconsistency',
            severity: 'medium',
            elementId: element.id,
            elementName: element.name,
            chapterId: chapter.id,
            chapterNumber: chapter.chapterNumber,
            description: `"${element.name}"的描述可能与之前章节不一致`,
            suggestion: `请对比第${ref.chapterNumber || '?'}章的描述`,
            conflictingContent: this.extractContext(content, element.name),
            originalSetting: ref.context,
          })
        }
      }
    }

    return conflicts
  }

  /**
   * 检查缺失引用
   */
  private async checkMissingReferences(
    chapter: Chapter,
    worldElements: WorldElement[]
  ): Promise<WorldConflict[]> {
    const conflicts: WorldConflict[] = []

    // 检查重要的全局设定是否被忽略
    const globalElements = worldElements.filter(
      e => e.scope === 'global' && e.importance >= 8
    )

    for (const element of globalElements) {
      const references = this.parseReferences(element.references)
      const lastUsed = references[references.length - 1]

      // 如果重要的全局设定超过10章未被提及，发出提醒
      if (lastUsed && chapter.chapterNumber - (lastUsed.chapterNumber || 0) > 10) {
        conflicts.push({
          type: 'missing_reference',
          severity: 'low',
          elementId: element.id,
          elementName: element.name,
          chapterId: chapter.id,
          chapterNumber: chapter.chapterNumber,
          description: `重要的全局设定"${element.name}"已超过10章未被提及`,
          suggestion: '如果该设定仍然重要，建议适当提及以保持读者记忆',
        })
      }
    }

    return conflicts
  }

  /**
   * 解析约束条件
   */
  private parseConstraints(constraintsJson?: string | null): Array<{ description: string; rule: string }> {
    if (!constraintsJson) return []

    try {
      const parsed = JSON.parse(constraintsJson)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  /**
   * 解析引用记录
   */
  private parseReferences(referencesJson?: string | null): Array<{ chapterId: string; chapterNumber?: number; context: string }> {
    if (!referencesJson) return []

    try {
      const parsed = JSON.parse(referencesJson)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  /**
   * 检查是否违反约束
   */
  private violatesConstraint(content: string, constraint: { description: string; rule: string }): boolean {
    // 这里可以使用更复杂的逻辑或AI来判断
    // 简单实现：检查关键词
    const keywords = constraint.rule.toLowerCase().split(/[,，、]/)
    const contentLower = content.toLowerCase()

    // 如果约束规则中的关键词在内容中出现，但描述不符，则可能违反
    return keywords.some(keyword => contentLower.includes(keyword.trim()))
  }

  /**
   * 检查描述相似度
   */
  private checkDescriptionSimilarity(
    currentContent: string,
    previousContext: string,
    elementName: string
  ): number {
    // 提取当前内容中关于该元素的描述
    const currentDesc = this.extractContext(currentContent, elementName)

    if (!currentDesc || !previousContext) return 1 // 无法比较时假设一致

    // 简单的相似度计算：共同词汇占比
    const currentWords = new Set(currentDesc.toLowerCase().split(/\s+/))
    const previousWords = new Set(previousContext.toLowerCase().split(/\s+/))

    const intersection = new Set([...currentWords].filter(w => previousWords.has(w)))
    const union = new Set([...currentWords, ...previousWords])

    return intersection.size / union.size
  }

  /**
   * 提取上下文
   */
  private extractContext(content: string, keyword: string, contextLength: number = 200): string {
    const index = content.toLowerCase().indexOf(keyword.toLowerCase())
    if (index === -1) return ''

    const start = Math.max(0, index - contextLength / 2)
    const end = Math.min(content.length, index + keyword.length + contextLength / 2)

    return content.slice(start, end)
  }

  /**
   * 批量检查多个章节
   */
  async checkMultipleChapters(
    chapters: Chapter[],
    worldElements: WorldElement[]
  ): Promise<Map<string, WorldConflict[]>> {
    const results = new Map<string, WorldConflict[]>()

    for (const chapter of chapters) {
      const conflicts = await this.checkChapter(chapter, worldElements)
      if (conflicts.length > 0) {
        results.set(chapter.id, conflicts)
      }
    }

    return results
  }

  /**
   * 生成一致性报告
   */
  generateReport(conflictsMap: Map<string, WorldConflict[]>): string {
    let report = '# 世界观一致性检查报告\n\n'

    if (conflictsMap.size === 0) {
      report += '✅ 未发现明显的世界观冲突\n'
      return report
    }

    report += `⚠️ 发现 ${conflictsMap.size} 个章节存在潜在问题\n\n`

    for (const [chapterId, conflicts] of conflictsMap) {
      const highSeverity = conflicts.filter(c => c.severity === 'high').length
      const mediumSeverity = conflicts.filter(c => c.severity === 'medium').length
      const lowSeverity = conflicts.filter(c => c.severity === 'low').length

      report += `## 章节 ${conflicts[0]?.chapterNumber || '?'}\n\n`
      report += `- 🔴 高优先级: ${highSeverity}\n`
      report += `- 🟡 中优先级: ${mediumSeverity}\n`
      report += `- 🟢 低优先级: ${lowSeverity}\n\n`

      for (const conflict of conflicts) {
        const icon = conflict.severity === 'high' ? '🔴' : conflict.severity === 'medium' ? '🟡' : '🟢'
        report += `### ${icon} ${conflict.elementName}\n\n`
        report += `**问题**: ${conflict.description}\n\n`
        if (conflict.suggestion) {
          report += `**建议**: ${conflict.suggestion}\n\n`
        }
      }
    }

    return report
  }
}

// 导出单例
let checker: WorldConsistencyChecker | null = null

export function getWorldConsistencyChecker(): WorldConsistencyChecker {
  if (!checker) {
    checker = new WorldConsistencyChecker()
  }
  return checker
}
