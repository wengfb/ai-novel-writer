/** 上下文权重配置 */
export interface ContextRatios {
  world: number
  character: number
  chapter: number
  summary: number
  foreshadowing: number
}

const DEFAULT_MAX_TOKENS = 100000

/** 读取上下文 Token 上限（环境变量可覆盖） */
export function getMaxTokens(override?: number): number {
  if (override && override > 0) return override
  const envValue = process.env.AI_CONTEXT_MAX_TOKENS
  if (envValue) {
    const parsed = parseInt(envValue, 10)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  return DEFAULT_MAX_TOKENS
}

/** 根据小说类型获取上下文权重配置 */
export function getContextRatios(genre: string): ContextRatios {
  const ratiosMap: Record<string, ContextRatios> = {
    修仙: { world: 0.30, character: 0.15, chapter: 0.35, summary: 0.15, foreshadowing: 0.05 },
    玄幻: { world: 0.28, character: 0.17, chapter: 0.35, summary: 0.15, foreshadowing: 0.05 },
    仙侠: { world: 0.30, character: 0.15, chapter: 0.35, summary: 0.15, foreshadowing: 0.05 },
    科幻: { world: 0.28, character: 0.17, chapter: 0.35, summary: 0.15, foreshadowing: 0.05 },
    奇幻: { world: 0.26, character: 0.19, chapter: 0.35, summary: 0.15, foreshadowing: 0.05 },
    武侠: { world: 0.22, character: 0.23, chapter: 0.35, summary: 0.15, foreshadowing: 0.05 },
    都市: { world: 0.10, character: 0.30, chapter: 0.40, summary: 0.15, foreshadowing: 0.05 },
    言情: { world: 0.08, character: 0.32, chapter: 0.40, summary: 0.15, foreshadowing: 0.05 },
    现代: { world: 0.10, character: 0.30, chapter: 0.40, summary: 0.15, foreshadowing: 0.05 },
    历史: { world: 0.20, character: 0.25, chapter: 0.35, summary: 0.15, foreshadowing: 0.05 },
    军事: { world: 0.22, character: 0.23, chapter: 0.35, summary: 0.15, foreshadowing: 0.05 },
    游戏: { world: 0.25, character: 0.20, chapter: 0.35, summary: 0.15, foreshadowing: 0.05 },
  }

  return ratiosMap[genre] || { world: 0.20, character: 0.20, chapter: 0.40, summary: 0.15, foreshadowing: 0.05 }
}

/**
 * 估算 Token 数量
 * 中文字符：1 token ≈ 2-3 个字符；英文单词：1 token ≈ 0.75 个单词
 */
export function estimateTokens(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
  const otherChars = text.length - chineseChars - englishWords * 6
  return Math.ceil(chineseChars / 2 + englishWords * 0.75 + otherChars / 4)
}
