'use client'

import { useEffect } from 'react'
import { useIdeaStore } from '@/lib/store/idea-store'

export function useIdeas(query?: Record<string, string>) {
  const {
    ideas, total, page, isLoading, error,
    currentIdea, currentIdeaComments,
    isGenerating, generatedCards,
    hasExamples, positiveExampleCount, negativeExampleCount,
    fetchIdeas, fetchIdea, saveIdea, updateIdea, deleteIdea,
    rateIdea, fetchComments, addComment,
    generateIdeas, clearGeneratedCards,
    setCurrentIdea, clearError,
  } = useIdeaStore()

  useEffect(() => {
    fetchIdeas(query)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ideas, total, page, isLoading, error,
    currentIdea, currentIdeaComments,
    isGenerating, generatedCards,
    hasExamples, positiveExampleCount, negativeExampleCount,
    refetch: () => fetchIdeas(query ?? {}),
    fetchIdea, saveIdea, updateIdea, deleteIdea,
    rateIdea, fetchComments, addComment,
    generateIdeas, clearGeneratedCards,
    setCurrentIdea, clearError,
  }
}
