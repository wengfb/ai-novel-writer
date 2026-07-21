import { prisma } from '@/lib/db/prisma'
import { countWords } from '@/lib/utils/word-count'

export { countWords }

export function normalizeArrayLike(value?: string | string[] | null): string | null {
  if (!value) return null
  return Array.isArray(value) ? value.join('、') : value
}

export function normalizeJsonValue(value?: unknown): string | null {
  if (value === undefined || value === null) return null
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

/** 根据章节聚合结果刷新项目字数与章节数 */
export async function updateProjectStats(projectId: string) {
  const [totalWords, chapterCount] = await Promise.all([
    prisma.chapter.aggregate({
      where: { projectId },
      _sum: { wordCount: true },
    }),
    prisma.chapter.count({ where: { projectId } }),
  ])

  await prisma.project.update({
    where: { id: projectId },
    data: {
      totalWords: totalWords._sum.wordCount || 0,
      chapterCount,
    },
  })
}
