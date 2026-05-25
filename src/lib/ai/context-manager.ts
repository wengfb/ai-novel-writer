import type { Chapter, Character, WorldElement, Foreshadowing, ContextPackage } from '@/types'
import { getAIProviderAsync } from '@/lib/ai/providers'
import { getPromptTemplateManager } from '@/lib/ai/prompts/template-manager'
import {
  scoreCharacters,
  scoreWorldElements,
  scoreForeshadowings,
} from '@/lib/ai/relevance-scorer'

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
  private readonly DEFAULT_MAX_TOKENS = 100000

  private getMaxTokens(override?: number): number {
    if (override && override > 0) return override
    const envValue = process.env.AI_CONTEXT_MAX_TOKENS
    if (envValue) {
      const parsed = parseInt(envValue, 10)
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
    return this.DEFAULT_MAX_TOKENS
  }

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
    foreshadowings?: Foreshadowing[]
    outlines?: { order: number; title: string; description?: string | null; status: string }[]
    genre: string
    style?: string
    contextMaxTokens?: number
  }): ContextPackage {
    const { currentChapter, allChapters, characters, worldElements, foreshadowings, outlines, genre, style, contextMaxTokens } = params

    const maxTokens = this.getMaxTokens(contextMaxTokens)

    // 获取该类型小说的上下文权重配置
    const ratios = this.getContextRatios(genre)

    // 1. 获取最近N章的完整内容
    const fullChapters = this.getRecentFullChapters(
      allChapters,
      currentChapter,
      Math.floor(maxTokens * ratios.chapter)
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
      allChapters,
      currentChapter
    )

    // 4. 获取相关世界观元素
    const relevantWorld = this.getRelevantWorldElements(
      worldElements,
      allChapters,
      currentChapter
    )

    const relevantForeshadowings = foreshadowings
      ? this.getRelevantForeshadowings(foreshadowings, currentChapter)
      : undefined

    return {
      fullChapters,
      chapterSummaries,
      characters: relevantCharacters,
      worldElements: relevantWorld,
      foreshadowings: relevantForeshadowings,
      outlines,
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
   * 获取相关角色（使用衰减加权 + 角色倍率 + 关系密度评分）
   */
  private getRelevantCharacters(
    characters: Character[],
    allChapters: Chapter[],
    currentChapterIndex: number
  ): Character[] {
    return scoreCharacters(characters, allChapters, currentChapterIndex)
  }

  /**
   * 获取相关世界观元素（使用衰减加权 + 全局保底 + 核心规则加成）
   */
  private getRelevantWorldElements(
    worldElements: WorldElement[],
    allChapters: Chapter[],
    currentChapterIndex: number
  ): WorldElement[] {
    return scoreWorldElements(worldElements, allChapters, currentChapterIndex)
  }

  /**
   * 获取相关伏笔（仅未回收的伏笔，按重要性和预期章节接近度排序）
   */
  private getRelevantForeshadowings(
    foreshadowings: Foreshadowing[],
    currentChapterNumber: number
  ): Foreshadowing[] {
    return scoreForeshadowings(foreshadowings, currentChapterNumber)
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
   * 生成章节摘要（使用 AI）
   * 失败时回退到首尾段提取
   */
  async generateChapterSummary(
    chapterContent: string,
    chapterTitle?: string,
    characterNames?: string[]
  ): Promise<string> {
    if (!chapterContent || chapterContent.trim().length < 500) {
      return chapterContent.slice(0, 500)
    }

    try {
      const ai = await getAIProviderAsync()
      const promptManager = getPromptTemplateManager()

      const prompt = promptManager.render('chapter-summary', {
        chapterTitle: chapterTitle || '未知章节',
        chapterContent: chapterContent.slice(0, 12000),
        characters: characterNames?.join('、') || '未知',
      })

      const result = await ai.generate({
        type: 'chapter',
        prompt,
        temperature: 0.3,
        maxTokens: 512,
      })

      const summary = result.output.trim()
      if (summary && summary.length > 10) {
        return summary
      }
    } catch (error) {
      console.warn('AI chapter summary generation failed, falling back to heuristic:', error)
    }

    // 回退：首段 + 尾段
    const paragraphs = chapterContent.split('\n\n').filter(p => p.trim().length > 0)
    if (paragraphs.length <= 2) {
      return chapterContent.slice(0, 500)
    }
    const first = paragraphs[0].slice(0, 300)
    const last = paragraphs[paragraphs.length - 1].slice(0, 200)
    return `${first}\n...\n${last}`
  }

  /**
   * 批量补充项目章节摘要
   * 为缺少摘要（或摘要质量差）的章节生成 AI 摘要
   */
  async summarizeProjectChapters(projectId: string): Promise<number> {
    const { prisma } = await import('@/lib/db/prisma')

    const chapters = await prisma.chapter.findMany({
      where: { projectId },
      orderBy: { chapterNumber: 'asc' },
      select: { id: true, title: true, content: true, chapterNumber: true },
    })

    let updatedCount = 0

    for (const chapter of chapters) {
      if (!chapter.content || chapter.content.trim().length < 500) continue

      const summary = await this.generateChapterSummary(
        chapter.content,
        chapter.title
      )

      if (summary) {
        await prisma.chapter.update({
          where: { id: chapter.id },
          data: { summary },
        })
        updatedCount++
      }
    }

    return updatedCount
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

    // 5. 伏笔信息（仅未回收的）
    if (context.foreshadowings && context.foreshadowings.length > 0) {
      parts.push(`## 待回收伏笔\n`)
      for (const f of context.foreshadowings) {
        const statusLabel = f.status === 'planted' ? '已埋下' : '计划中'
        const expectInfo = f.expectedChapterNumber
          ? `（预期第${f.expectedChapterNumber}章回收）`
          : ''
        parts.push(`- [${statusLabel}] ${f.title}：${f.description}${expectInfo}`)
      }
      parts.push('\n')
    }

    // 6. 大纲信息
    if (context.outlines && context.outlines.length > 0) {
      parts.push(`## 章节大纲\n`)
      for (const o of context.outlines) {
        const statusLabel = o.status === 'completed' ? '✓' : o.status === 'writing' ? '...' : '○'
        parts.push(`- ${statusLabel} 第${o.order}章 ${o.title}`)
        if (o.description) {
          parts.push(`  ${o.description}`)
        }
      }
      parts.push('\n')
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
