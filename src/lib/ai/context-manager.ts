import type { Chapter, Character, WorldElement, ContextPackage } from '@/types'

/**
 * 上下文权重配置
 */
interface ContextRatios {
  world: number        // 世界观元素权重
  character: number    // 角色权重
  chapter: number      // 完整章节权重
  summary: number      // 章节摘要权重
  foreshadowing: number // 伏笔权重
}

/**
 * 上下文管理器
 * 负责管理长文本生成的上下文，使用滑动窗口+摘要策略
 * 支持根据小说类型动态调整上下文权重
 */
export class ContextManager {
  private readonly MAX_TOKENS = 100000 // Gemini 2.5 有1M tokens，我们预留100K

  /**
   * 根据小说类型获取上下文权重配置
   */
  private getContextRatios(genre: string): ContextRatios {
    const ratiosMap: Record<string, ContextRatios> = {
      '修仙': { world: 0.30, character: 0.15, chapter: 0.35, summary: 0.15, foreshadowing: 0.05 },
      '玄幻': { world: 0.28, character: 0.17, chapter: 0.35, summary: 0.15, foreshadowing: 0.05 },
      '仙侠': { world: 0.30, character: 0.15, chapter: 0.35, summary: 0.15, foreshadowing: 0.05 },
      '科幻': { world: 0.28, character: 0.17, chapter: 0.35, summary: 0.15, foreshadowing: 0.05 },
      '奇幻': { world: 0.26, character: 0.19, chapter: 0.35, summary: 0.15, foreshadowing: 0.05 },
      '武侠': { world: 0.22, character: 0.23, chapter: 0.35, summary: 0.15, foreshadowing: 0.05 },
      '都市': { world: 0.10, character: 0.30, chapter: 0.40, summary: 0.15, foreshadowing: 0.05 },
      '言情': { world: 0.08, character: 0.32, chapter: 0.40, summary: 0.15, foreshadowing: 0.05 },
      '现代': { world: 0.10, character: 0.30, chapter: 0.40, summary: 0.15, foreshadowing: 0.05 },
      '历史': { world: 0.20, character: 0.25, chapter: 0.35, summary: 0.15, foreshadowing: 0.05 },
      '军事': { world: 0.22, character: 0.23, chapter: 0.35, summary: 0.15, foreshadowing: 0.05 },
      '游戏': { world: 0.25, character: 0.20, chapter: 0.35, summary: 0.15, foreshadowing: 0.05 },
    }

    // 默认配置（中等世界观权重）
    return ratiosMap[genre] || { world: 0.20, character: 0.20, chapter: 0.40, summary: 0.15, foreshadowing: 0.05 }
  }

  /**
   * 构建上下文包
   */
  buildContext(params: {
    currentChapter: number
    allChapters: Chapter[]
    characters: Character[]
    worldElements: WorldElement[]
    genre: string
    style?: string
  }): ContextPackage {
    const { currentChapter, allChapters, characters, worldElements, genre, style } = params

    // 获取该类型小说的上下文权重配置
    const ratios = this.getContextRatios(genre)

    // 1. 获取最近N章的完整内容
    const fullChapters = this.getRecentFullChapters(
      allChapters,
      currentChapter,
      Math.floor(this.MAX_TOKENS * ratios.chapter)
    )

    // 2. 获取更早章节的摘要
    const chapterSummaries = this.getChapterSummaries(
      allChapters,
      currentChapter,
      fullChapters.length
    )

    // 3. 获取相关角色（按相关性和重要性排序）
    const relevantCharacters = this.getRelevantCharacters(
      characters,
      allChapters[currentChapter - 1]
    )

    // 4. 获取相关世界观元素
    const relevantWorld = this.getRelevantWorldElements(
      worldElements,
      allChapters[currentChapter - 1]
    )

    return {
      fullChapters,
      chapterSummaries,
      characters: relevantCharacters,
      worldElements: relevantWorld,
      metadata: {
        totalChapters: allChapters.length,
        currentChapter,
        genre,
        style,
      },
    }
  }

  /**
   * 获取最近的N章完整内容
   */
  private getRecentFullChapters(
    chapters: Chapter[],
    currentIndex: number,
    maxTokens: number
  ): Chapter[] {
    const result: Chapter[] = []
    let usedTokens = 0

    // 从当前章节往前遍历
    for (let i = currentIndex - 1; i >= 0; i--) {
      const chapter = chapters[i]
      if (!chapter || !chapter.content) continue

      const chapterTokens = this.estimateTokens(chapter.content)

      if (usedTokens + chapterTokens > maxTokens) {
        // 如果加上这一章会超出限制，检查是否至少能有一章
        if (result.length === 0 && chapterTokens <= maxTokens) {
          result.unshift(chapter)
        }
        break
      }

      result.unshift(chapter)
      usedTokens += chapterTokens
    }

    return result
  }

  /**
   * 获取章节摘要
   */
  private getChapterSummaries(
    chapters: Chapter[],
    currentIndex: number,
    excludeCount: number
  ): { chapterNumber: number; summary: string }[] {
    const result: { chapterNumber: number; summary: string }[] = []

    // 从更早的章节获取摘要
    for (let i = 0; i < currentIndex - excludeCount; i++) {
      const chapter = chapters[i]
      if (chapter && chapter.summary) {
        result.push({
          chapterNumber: chapter.chapterNumber,
          summary: chapter.summary,
        })
      }
    }

    return result
  }

  /**
   * 获取相关角色（按重要性和相关性排序）
   */
  private getRelevantCharacters(
    characters: Character[],
    currentChapter?: Chapter
  ): Character[] {
    if (!currentChapter || !currentChapter.content) {
      // 如果没有当前章节内容，按重要性排序返回
      return characters.sort((a, b) => (b.importance || 5) - (a.importance || 5))
    }

    const content = currentChapter.content.toLowerCase()
    const scored: Array<{ character: Character; score: number }> = []

    for (const character of characters) {
      let score = 0

      // 1. 基础重要性分数（权重40%）
      score += (character.importance || 5) * 4

      // 2. 名称出现次数（权重60%）
      const nameMatches = (content.match(new RegExp(character.name.toLowerCase(), 'g')) || []).length
      score += nameMatches * 6

      // 3. 主角/反派额外加分
      if (character.role === 'protagonist') score += 20
      if (character.role === 'antagonist') score += 15

      scored.push({ character, score })
    }

    // 按分数降序排序
    scored.sort((a, b) => b.score - a.score)

    return scored.map(s => s.character)
  }

  /**
   * 获取相关世界观元素（按重要性、范围和相关性排序）
   */
  private getRelevantWorldElements(
    worldElements: WorldElement[],
    currentChapter?: Chapter
  ): WorldElement[] {
    if (!currentChapter || !currentChapter.content) {
      // 按重要性和范围排序
      return worldElements.sort((a, b) => {
        const scopeWeight = { global: 3, regional: 2, local: 1 }
        const scoreA = (a.importance || 5) * 10 + (scopeWeight[a.scope as keyof typeof scopeWeight] || 1)
        const scoreB = (b.importance || 5) * 10 + (scopeWeight[b.scope as keyof typeof scopeWeight] || 1)
        return scoreB - scoreA
      })
    }

    const content = currentChapter.content.toLowerCase()
    const scored: Array<{ element: WorldElement; score: number }> = []

    for (const element of worldElements) {
      let score = 0

      // 1. 基础重要性分数（权重30%）
      score += (element.importance || 5) * 3

      // 2. 范围权重（权重20%）
      const scopeWeight = { global: 20, regional: 10, local: 5 }
      score += scopeWeight[element.scope as keyof typeof scopeWeight] || 5

      // 3. 分类权重（权重20%）
      const categoryWeight = { core_rule: 20, detail: 10, background: 5 }
      score += categoryWeight[element.category as keyof typeof categoryWeight] || 10

      // 4. 名称出现次数（权重30%）
      const nameMatches = (content.match(new RegExp(element.name.toLowerCase(), 'g')) || []).length
      score += nameMatches * 3

      scored.push({ element, score })
    }

    // 按分数降序排序
    scored.sort((a, b) => b.score - a.score)

    return scored.map(s => s.element)
  }

  /**
   * 估算Token数量
   * 中文字符：1 token ≈ 2-3 个字符
   * 英文单词：1 token ≈ 0.75 个单词
   */
  estimateTokens(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    const otherChars = text.length - chineseChars - englishWords * 6 // 假设英文单词平均6个字符

    return Math.ceil(chineseChars / 2 + englishWords * 0.75 + otherChars / 4)
  }

  /**
   * 生成章节摘要（用于上下文优化）
   */
  async generateChapterSummary(chapterContent: string): Promise<string> {
    // 这里可以调用AI生成摘要
    // 为节省API调用，先使用简单的提取方法
    const paragraphs = chapterContent.split('\n\n').filter(p => p.trim().length > 0)

    // 取第一段和最后一段作为摘要
    if (paragraphs.length <= 2) {
      return chapterContent.slice(0, 500) // 最多500字
    }

    const first = paragraphs[0]
    const last = paragraphs[paragraphs.length - 1]

    return `${first}\n...\n${last}`
  }

  /**
   * 格式化上下文为提示词
   */
  formatContextForPrompt(context: ContextPackage): string {
    const parts: string[] = []

    // 1. 元数据
    parts.push(`## 故事信息\n`)
    parts.push(`- 类型：${context.metadata.genre}`)
    if (context.metadata.style) {
      parts.push(`- 风格：${context.metadata.style}`)
    }
    parts.push(`- 总章节数：${context.metadata.totalChapters}`)
    parts.push(`- 当前章节：第${context.metadata.currentChapter}章\n`)

    // 2. 前文摘要
    if (context.fullChapters.length > 0 || context.chapterSummaries.length > 0) {
      parts.push(`## 前文内容\n`)

      // 完整章节
      for (const chapter of context.fullChapters) {
        parts.push(`### 第${chapter.chapterNumber}章 ${chapter.title}`)
        parts.push(chapter.content)
        parts.push('\n')
      }

      // 章节摘要
      if (context.chapterSummaries.length > 0) {
        parts.push(`### 更早章节摘要\n`)
        for (const summary of context.chapterSummaries) {
          parts.push(`- 第${summary.chapterNumber}章：${summary.summary}`)
        }
        parts.push('\n')
      }
    }

    // 3. 角色信息
    if (context.characters.length > 0) {
      parts.push(`## 角色信息\n`)
      for (const char of context.characters) {
        parts.push(`### ${char.name}`)
        if (char.nickname) parts.push(`昵称：${char.nickname}`)
        if (char.age !== undefined) parts.push(`年龄：${char.age}`)
        if (char.gender) parts.push(`性别：${char.gender}`)
        if (char.personality) parts.push(`性格：${char.personality}`)
        if (char.dialogueStyle) parts.push(`对话风格：${char.dialogueStyle}`)
        parts.push('\n')
      }
    }

    // 4. 世界观设定
    if (context.worldElements.length > 0) {
      parts.push(`## 世界观设定\n`)
      for (const element of context.worldElements) {
        parts.push(`### ${element.name}（${element.type}）`)
        parts.push(element.description)
        parts.push('\n')
      }
    }

    return parts.join('\n')
  }
}

// 导出单例
let contextManager: ContextManager | null = null

export function getContextManager(): ContextManager {
  if (!contextManager) {
    contextManager = new ContextManager()
  }
  return contextManager
}
