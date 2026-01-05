import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, ApiErrors, withErrorHandler } from '@/lib/api/response'

/**
 * 统计 API
 * GET /api/projects/[projectId]/stats - 获取项目统计信息
 */

/**
 * GET /api/projects/[projectId]/stats
 * 获取项目统计信息
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  return withErrorHandler(async () => {
    const { projectId } = await params

    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return ApiErrors.projectNotFound()
    }

    // 并行查询所有统计数据
    const [
      totalChapters,
      completedChapters,
      totalCharacters,
      totalWorldElements,
      totalOutlines,
      chaptersByStatus,
      recentGenerations,
      totalTokensUsed,
      totalCost,
    ] = await Promise.all([
      // 章节总数
      prisma.chapter.count({ where: { projectId } }),

      // 已完成章节数
      prisma.chapter.count({
        where: {
          projectId,
          content: { not: '' },
        },
      }),

      // 角色总数
      prisma.character.count({ where: { projectId } }),

      // 世界观元素总数
      prisma.worldElement.count({ where: { projectId } }),

      // 大纲节点总数
      prisma.outline.count({ where: { projectId } }),

      // 按状态统计章节
      prisma.chapter.groupBy({
        by: ['wordCount'],
        where: { projectId },
        _count: true,
      }),

      // 最近的生成记录
      prisma.generation.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          type: true,
          model: true,
          status: true,
          createdAt: true,
          cost: true,
          tokensUsed: true,
        },
      }),

      // Token 使用统计（从 Generation 表）
      prisma.generation.aggregate({
        where: { projectId },
        _sum: {
          cost: true,
        },
      }),

      // 总成本
      prisma.generation.aggregate({
        where: {
          projectId,
          status: 'success',
        },
        _sum: {
          cost: true,
        },
      }),
    ])

    // 计算章节字数分布
    const chaptersWithWordCount = await prisma.chapter.findMany({
      where: { projectId },
      select: { wordCount: true },
    })

    const wordCountDistribution = {
      '0-1000': 0,
      '1000-2000': 0,
      '2000-3000': 0,
      '3000-5000': 0,
      '5000+': 0,
    }

    for (const chapter of chaptersWithWordCount) {
      const wc = chapter.wordCount
      if (wc < 1000) wordCountDistribution['0-1000']++
      else if (wc < 2000) wordCountDistribution['1000-2000']++
      else if (wc < 3000) wordCountDistribution['2000-3000']++
      else if (wc < 5000) wordCountDistribution['3000-5000']++
      else wordCountDistribution['5000+']++
    }

    // 统计 AI 生成类型分布
    const generationTypeStats = await prisma.generation.groupBy({
      by: ['type'],
      where: { projectId },
      _count: true,
      _sum: {
        cost: true,
      },
    })

    const typeDistribution = generationTypeStats.map(stat => ({
      type: stat.type,
      count: stat._count,
      cost: stat._sum.cost || 0,
    }))

    // 统计世界观元素类型分布
    const worldElementTypeStats = await prisma.worldElement.groupBy({
      by: ['type'],
      where: { projectId },
      _count: true,
    })

    const elementTypeDistribution = worldElementTypeStats.map(stat => ({
      type: stat.type,
      count: stat._count,
    }))

    // 获取每日写作统计（最近 30 天）
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailyStats = await prisma.chapter.findMany({
      where: {
        projectId,
        updatedAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        updatedAt: true,
        wordCount: true,
      },
    })

    // 按日期聚合
    const dailyWordCount: Record<string, number> = {}
    for (const chapter of dailyStats) {
      const date = chapter.updatedAt.toISOString().split('T')[0]
      dailyWordCount[date] = (dailyWordCount[date] || 0) + chapter.wordCount
    }

    const chartData = Object.entries(dailyWordCount)
      .map(([date, words]) => ({ date, words }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // 返回统计信息
    return apiSuccess({
      overview: {
        totalChapters,
        completedChapters,
        totalWords: project.totalWords,
        completionRate: 0, // 可以后续添加目标字数功能
        totalCharacters,
        totalWorldElements,
        totalOutlines,
      },
      chapters: {
        wordCountDistribution,
        avgWordsPerChapter: totalChapters > 0
          ? Math.round(project.totalWords / totalChapters)
          : 0,
      },
      aiUsage: {
        totalGenerations: recentGenerations.length,
        totalCost: totalCost._sum.cost || 0,
        typeDistribution,
        recentGenerations: recentGenerations.map(g => ({
          ...g,
          tokensUsed: typeof g.tokensUsed === 'string'
            ? JSON.parse(g.tokensUsed)
            : g.tokensUsed,
        })),
      },
      worldElements: {
        elementTypeDistribution,
      },
      dailyWriting: {
        last30Days: chartData,
      },
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    })
  })
}
