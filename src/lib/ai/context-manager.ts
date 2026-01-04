import type { Chapter, Character, WorldElement, ContextPackage } from '@/types'

/**
 * 上下文管理器
 * 负责管理长文本生成的上下文，使用滑动窗口+摘要策略
 */
export class ContextManager {
  private readonly MAX_TOKENS = 100000 // Gemini 2.5 有1M tokens，我们预留100K
  private readonly FULL_CHAPTER_RATIO = 0.4 // 40%用于完整章节
  private readonly SUMMARY_RATIO = 0.2 // 20%用于摘要

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

    // 1. 获取最近N章的完整内容
    const fullChapters = this.getRecentFullChapters(
      allChapters,
      currentChapter,
      Math.floor(this.MAX_TOKENS * this.FULL_CHAPTER_RATIO)
    )

    // 2. 获取更早章节的摘要
    const chapterSummaries = this.getChapterSummaries(
      allChapters,
      currentChapter,
      fullChapters.length
    )

    // 3. 获取相关角色（按相关性排序）
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
   * 获取相关角色
   */
  private getRelevantCharacters(
    characters: Character[],
    currentChapter?: Chapter
  ): Character[] {
    if (!currentChapter || !currentChapter.content) {
      // 如果没有当前章节内容，返回所有角色
      return characters
    }

    // 简单策略：检查角色名称是否在章节内容中出现
    const relevant: Character[] = []
    const content = currentChapter.content.toLowerCase()

    for (const character of characters) {
      if (content.includes(character.name.toLowerCase())) {
        relevant.push(character)
      }
    }

    // 如果没有找到相关角色，返回所有角色（避免空上下文）
    return relevant.length > 0 ? relevant : characters
  }

  /**
   * 获取相关世界观元素
   */
  private getRelevantWorldElements(
    worldElements: WorldElement[],
    currentChapter?: Chapter
  ): WorldElement[] {
    if (!currentChapter || !currentChapter.content) {
      return worldElements
    }

    const relevant: WorldElement[] = []
    const content = currentChapter.content.toLowerCase()

    for (const element of worldElements) {
      if (content.includes(element.name.toLowerCase())) {
        relevant.push(element)
      }
    }

    return relevant.length > 0 ? relevant : worldElements
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
