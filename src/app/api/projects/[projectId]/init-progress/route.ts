import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler, ApiErrors } from '@/lib/api/response'
import { parseJsonBody } from '@/lib/api/validators'
import { z } from 'zod'

const STEP_KEYS = ['architecture', 'characters', 'world', 'volume', 'foreshadowings', 'styleAnchor'] as const
type StepKey = (typeof STEP_KEYS)[number]

const PutSchema = z.object({
  doneSteps: z.array(z.enum(STEP_KEYS)),
})

function progressKey(projectId: string) {
  return `project.${projectId}.initProgress`
}

/**
 * GET /api/projects/[projectId]/init-progress
 * 获取项目初始化进度（已完成步骤列表）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  return withErrorHandler(async () => {
    const { projectId } = await params

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return ApiErrors.projectNotFound()

    const setting = await prisma.systemSetting.findUnique({
      where: { key: progressKey(projectId) },
    })

    if (!setting) {
      return apiSuccess({ doneSteps: [] })
    }

    try {
      const doneSteps = JSON.parse(setting.value) as StepKey[]
      return apiSuccess({ doneSteps })
    } catch {
      return apiSuccess({ doneSteps: [] })
    }
  })
}

/**
 * PUT /api/projects/[projectId]/init-progress
 * 保存项目初始化进度（已完成步骤列表）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  return withErrorHandler(async () => {
    const { projectId } = await params
    const body = await parseJsonBody<unknown>(request)
    const data = PutSchema.parse(body)

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return ApiErrors.projectNotFound()

    await prisma.systemSetting.upsert({
      where: { key: progressKey(projectId) },
      create: {
        key: progressKey(projectId),
        value: JSON.stringify(data.doneSteps),
        category: 'project',
        description: `项目 ${projectId} 初始化进度`,
      },
      update: {
        value: JSON.stringify(data.doneSteps),
      },
    })

    return apiSuccess({ doneSteps: data.doneSteps })
  })
}
