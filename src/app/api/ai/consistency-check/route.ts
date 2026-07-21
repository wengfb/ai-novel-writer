import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getWorldConsistencyChecker } from '@/lib/ai/world-consistency-checker'
import { apiSuccess, withErrorHandler, ApiErrors } from '@/lib/api/response'
import { parseJsonBody } from '@/lib/api/validators'
import { z } from 'zod'

const CheckRequestSchema = z.object({
  projectId: z.string().min(1),
  chapterId: z.string().optional(),
  /** 是否启用 consistency-checker Agent 深度审查，默认 true */
  useAI: z.boolean().optional(),
  model: z.string().optional(),
})

/**
 * POST /api/ai/consistency-check
 * 检查章节/项目内容与世界观的设定一致性
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const body = await parseJsonBody(request)
    const { projectId, chapterId, useAI, model } = CheckRequestSchema.parse(body)

    // 加载项目数据
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        worldElements: true,
        characters: true,
        chapters: {
          orderBy: { chapterNumber: 'asc' },
        },
      },
    })

    if (!project) {
      return ApiErrors.projectNotFound()
    }

    const checker = getWorldConsistencyChecker()

    // 确定要检查的章节
    const targetChapters = chapterId
      ? project.chapters.filter(c => c.id === chapterId)
      : project.chapters.filter(c => c.content && c.content.length > 0)

    if (targetChapters.length === 0) {
      return apiSuccess({
        report: '# 世界观一致性检查报告\n\n暂无内容可检查。',
        conflicts: [],
        summary: { high: 0, medium: 0, low: 0 },
      })
    }

    // 规则扫描 + consistency-checker Agent（可编辑提示词）
    const conflictsMap = new Map<string, Awaited<ReturnType<typeof checker.checkChapter>>>()
    for (const chapter of targetChapters) {
      const conflicts = await checker.checkChapter(
        chapter as any,
        project.worldElements as any,
        {
          // API 默认启用 Agent 深度审查；传 useAI: false 可仅跑规则扫描
          useAI: useAI !== false,
          characters: project.characters as any,
          model,
        }
      )
      if (conflicts.length > 0) {
        conflictsMap.set(chapter.id, conflicts)
      }
    }

    // 生成报告
    const report = checker.generateReport(conflictsMap)

    // 收集所有冲突
    const allConflicts: any[] = []
    for (const conflicts of conflictsMap.values()) {
      allConflicts.push(...conflicts)
    }

    const summary = {
      high: allConflicts.filter(c => c.severity === 'high').length,
      medium: allConflicts.filter(c => c.severity === 'medium').length,
      low: allConflicts.filter(c => c.severity === 'low').length,
    }

    return apiSuccess({
      report,
      conflicts: allConflicts,
      summary,
    })
  })
}
