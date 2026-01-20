import { useAIStore } from '@/lib/store/ai-store'

/**
 * AI 生成 Hook
 * 用于章节生成和续写功能
 */
export function useAIGeneration() {
  const { isGeneratingChapter, isContinuing, generateChapter, continueWriting, cancelGeneration } = useAIStore()

  return {
    isGeneratingChapter,
    isContinuing,
    generateChapter,
    continueWriting,
    cancelGeneration,
  }
}
