import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, ApiErrors, withErrorHandler } from '@/lib/api/response'

/**
 * 将创意转为项目所需数据
 * 返回 bootstrap 管线所需的 StoryIdeaCard 信息
 * 实际项目创建仍由 onboarding/bootstrap 或 onboarding/finalize 端点完成
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id } = await params

    const idea = await prisma.idea.findUnique({ where: { id } })
    if (!idea) {
      return ApiErrors.notFound('创意')
    }

    // 构建 StoryIdeaCard 格式的响应数据
    const ideaCard = {
      id: idea.id,
      title: idea.title,
      genre: idea.genre,
      worldBuilding: idea.worldBuilding,
      protagonist: idea.protagonist,
      coreConflict: idea.coreConflict,
      mainGoal: idea.mainGoal,
      highConcept: idea.highConcept,
      sublimation: idea.sublimation,
      openingHook: idea.openingHook,
    }

    return apiSuccess({
      idea: ideaCard,
      projectTitle: idea.title,
      source: idea.source ? JSON.parse(idea.source) : null,
    })
  })
}
