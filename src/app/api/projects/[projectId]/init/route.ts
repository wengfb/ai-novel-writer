import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, withErrorHandler, ApiErrors } from '@/lib/api/response'
import { parseJsonBody } from '@/lib/api/validators'
import {
  normalizeCharacterRole,
  normalizeWorldElementType,
  normalizePlotFunction,
  normalizeTensionLevel,
} from '@/lib/ai/onboarding/normalize'

const InitSchema = z.object({
  results: z.object({
    architecture: z.any().optional(),
    characters: z.any().optional(),
    worldSettings: z.any().optional(),
    chapters: z.any().optional(),
    foreshadowings: z.any().optional(),
    styleAnchor: z.any().optional(),
  }),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  return withErrorHandler(async () => {
    const { projectId } = await params
    const body = await parseJsonBody<unknown>(request)
    const data = InitSchema.parse(body)
    const r = data.results

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return ApiErrors.projectNotFound()

    await prisma.$transaction(async (tx) => {
      // 更新项目描述（如果有架构）
      if (r.architecture?.storySummary) {
        await tx.project.update({
          where: { id: projectId },
          data: { description: r.architecture.storySummary },
        })
      }

      // 角色（追加——不删除已有的）
      if (r.characters?.characters?.length) {
        const chars = r.characters.characters.filter((c: any) => c.name).map((c: any) => ({
          projectId,
          name: c.name,
          role: normalizeCharacterRole(c.role),
          backstory: c.description || '',
          personality: Array.isArray(c.personality) ? c.personality.join('、') : (c.personality || ''),
          motivation: c.goal || '',
          dialogueStyle: c.dialogueStyle || '',
          characterArc: c.characterArc || '',
          relationships: c.relationships?.length
            ? JSON.stringify(c.relationships.reduce((acc: any, r: any) => {
                acc[r.targetName] = r.description || r.relation; return acc
              }, {} as Record<string, string>))
            : '',
        }))
        if (chars.length > 0) await tx.character.createMany({ data: chars })
      }

      // 世界观
      if (r.worldSettings?.worldSettings?.length) {
        const ws = r.worldSettings.worldSettings.filter((w: any) => w.name).map((w: any) => ({
          projectId,
          name: w.name,
          type: normalizeWorldElementType(w.type),
          description: w.description || '',
          importance: w.importance || 5,
          scope: w.scope || 'global',
          category: w.category || 'detail',
          isEvolvable: w.isEvolvable || false,
          constraints: w.constraints?.length ? JSON.stringify(w.constraints) : null,
          exceptions: w.exceptions?.length ? JSON.stringify(w.exceptions) : null,
          evolutionSpace: w.evolutionSpace || null,
          relatedTo: w.relatedTo?.length ? JSON.stringify(w.relatedTo) : null,
        }))
        if (ws.length > 0) await tx.worldElement.createMany({ data: ws })
      }

      // 伏笔
      if (r.foreshadowings?.foreshadowings?.length) {
        const fs = r.foreshadowings.foreshadowings.map((f: any) => ({
          projectId,
          title: f.title,
          description: f.description,
          type: f.type || 'plot',
          importance: f.importance || 5,
          expectedChapterNumber: f.expectedChapterNumber,
          status: 'planned' as const,
          relatedCharacters: f.relatedCharacters?.length ? JSON.stringify(f.relatedCharacters) : null,
          relatedElements: f.relatedElements?.length ? JSON.stringify(f.relatedElements) : null,
        }))
        if (fs.length > 0) await tx.foreshadowing.createMany({ data: fs })
      }

      // 分卷 + 章节
      if (r.chapters?.chapters?.length) {
        const arch = r.architecture || {}
        const volumes = arch.volumePlan?.length
          ? arch.volumePlan
          : [{ volumeNumber: 1, title: '第一卷', description: '', chapterRange: [1, r.chapters.chapters.length] as [number, number] }]

        const createdVolumes: { id: string; volumeNumber: number; chapterStart: number; chapterEnd: number }[] = []
        for (const vol of volumes) {
          const v = await tx.outline.create({
            data: {
              projectId, type: 'volume', order: vol.volumeNumber,
              title: vol.title, description: vol.description || '',
              planningMode: 'full', isFlexible: false, confidence: 8, status: 'planned',
            },
          })
          createdVolumes.push({ id: v.id, volumeNumber: vol.volumeNumber,
            chapterStart: vol.chapterRange[0], chapterEnd: vol.chapterRange[1] })
        }

        const outlines = r.chapters.chapters.map((ch: any) => {
          const parentVol = createdVolumes.find(
            v => ch.chapterNumber >= v.chapterStart && ch.chapterNumber <= v.chapterEnd
          )
          return {
            projectId, type: 'chapter' as const,
            parentId: parentVol?.id || createdVolumes[0]?.id,
            order: ch.chapterNumber,
            title: ch.title || `第${ch.chapterNumber}章`,
            description: ch.summary || '',
            targetWords: ch.estimatedWords,
            planningMode: 'full' as const, isFlexible: false, confidence: 7, status: 'planned' as const,
            emotionalGoal: ch.emotionalGoal || '',
            plotFunction: normalizePlotFunction(ch.plotFunction),
            tensionLevel: normalizeTensionLevel(ch.tensionLevel),
            act: ch.act || null,
            causalFrom: ch.causalFrom || null,
            causalTo: ch.causalTo || null,
          }
        })
        if (outlines.length > 0) {
          // 先删旧章节大纲，再创建新的
          await tx.outline.deleteMany({ where: { projectId, type: 'chapter' } })
          await tx.outline.createMany({ data: outlines })
        }
      }

      // 风格锚点
      if (r.styleAnchor?.content) {
        await tx.systemSetting.upsert({
          where: { key: `project.${projectId}.styleAnchor` },
          create: { key: `project.${projectId}.styleAnchor`, value: r.styleAnchor.content, category: 'project', description: `《${project.title}》风格锚点` },
          update: { value: r.styleAnchor.content },
        })
      }
    })

    return apiSuccess({ projectId, updated: true })
  })
}
