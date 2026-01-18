import { useAIStore } from '@/lib/store/ai-store'

/**
 * AI 对话 Hook
 */
export function useAIChat() {
  const { messages, isGenerating, sendMessage, clearMessages } = useAIStore()

  return {
    messages,
    isGenerating,
    sendMessage,
    clearMessages,
  }
}

/**
 * AI 生成 Hook
 */
export function useAIGeneration() {
  const { isGenerating, generateChapter, continueWriting } = useAIStore()

  return {
    isGenerating,
    generateChapter,
    continueWriting,
  }
}
