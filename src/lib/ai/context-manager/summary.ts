import { getAIProviderAsync } from '@/lib/ai/providers'
import { getPromptTemplateManager } from '@/lib/ai/prompts/template-manager'

/**
 * 生成章节摘要（使用 AI）
 * 失败时回退到首尾段提取
 */
export async function generateChapterSummary(
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

  const paragraphs = chapterContent.split('\n\n').filter((p) => p.trim().length > 0)
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
export async function summarizeProjectChapters(projectId: string): Promise<number> {
  const { prisma } = await import('@/lib/db/prisma')

  const chapters = await prisma.chapter.findMany({
    where: { projectId },
    orderBy: { chapterNumber: 'asc' },
    select: { id: true, title: true, content: true, chapterNumber: true },
  })

  let updatedCount = 0

  for (const chapter of chapters) {
    if (!chapter.content || chapter.content.trim().length < 500) continue

    const summary = await generateChapterSummary(chapter.content, chapter.title)

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
