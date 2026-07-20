import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withErrorHandler } from '@/lib/api/response'
import { parseJsonBody, validateRequest } from '@/lib/api/validators'
import { BootstrapOnboardingSchema } from '@/lib/api/schemas'
import {
  normalizeProjectGenre,
  normalizeCharacterRole,
  normalizeWorldElementType,
  normalizePlotFunction,
  normalizeTensionLevel,
} from '@/lib/ai/onboarding/normalize'
import { runBootstrapPipeline } from '@/lib/ai/onboarding/pipeline'
import type { PipelineResult } from '@/lib/ai/onboarding/types'

/**
 * POST /api/onboarding/bootstrap
 * 基于创意卡初始化项目 — 6 步管线，SSE 流式进度
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const body = await parseJsonBody<unknown>(request)
    const data = validateRequest(BootstrapOnboardingSchema, body)

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const emit = (event: Record<string, unknown>) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          )
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const emitProgress = (event: any) => emit(event as Record<string, unknown>)

        let pipelineResult: PipelineResult

        try {
          // 运行 6 步管线
          pipelineResult = await runBootstrapPipeline(
            {
              projectTitle: data.projectTitle,
              idea: data.idea,
              targetWords: data.targetWords,
              pace: data.pace,
              audience: data.audience,
              tone: data.tone,
              model: data.model,
            },
            (event) => emitProgress(event)
          )

          // 写入数据库
          emit({
            type: 'writing',
            step: 'writing',
            progress: 99,
            message: '正在写入数据库...',
          })

          const projectGenre = normalizeProjectGenre(data.idea.genre)
          const arch = pipelineResult.architecture
          const chars = pipelineResult.characters.characters
          const worldSettings = pipelineResult.worldSettings.worldSettings
          const chapters = pipelineResult.chapters.chapters
          const foreshadowings = pipelineResult.foreshadowings.foreshadowings

          const created = await prisma.$transaction(async (tx) => {
            // 1. 创建项目
            const project = await tx.project.create({
              data: {
                title: data.projectTitle,
                description: arch.storySummary || data.idea.highConcept || data.idea.coreConflict,
                genre: projectGenre,
                status: 'draft',
                totalWords: 0,
                chapterCount: 0,
              },
            })

            // 2. 创建角色（关系网作为 JSON 字符串存储）
            const charactersToCreate = chars
              .filter(c => c.name)
              .map(c => ({
                projectId: project.id,
                name: c.name,
                role: normalizeCharacterRole(c.role),
                backstory: c.description || '',
                personality: Array.isArray(c.personality)
                  ? c.personality.join('、')
                  : c.personality || '',
                motivation: c.goal || '',
                dialogueStyle: c.dialogueStyle || '',
                characterArc: c.characterArc || '',
                relationships: c.relationships?.length
                  ? JSON.stringify(
                      c.relationships.reduce((acc, r) => {
                        acc[r.targetName] = r.description || r.relation
                        return acc
                      }, {} as Record<string, string>)
                    )
                  : '',
              }))

            if (charactersToCreate.length > 0) {
              await tx.character.createMany({ data: charactersToCreate })
            }

            // 3. 创建世界观元素
            const worldElementsToCreate = worldSettings
              .filter(w => w.name)
              .map(w => ({
                projectId: project.id,
                name: w.name,
                type: normalizeWorldElementType(w.type),
                description: w.description || '待补充设定描述',
                importance: w.importance || 5,
                scope: w.scope || 'global',
                category: w.category || 'detail',
                isEvolvable: w.isEvolvable || false,
                constraints: w.constraints?.length
                  ? JSON.stringify(w.constraints)
                  : null,
                exceptions: w.exceptions?.length
                  ? JSON.stringify(w.exceptions)
                  : null,
                evolutionSpace: w.evolutionSpace || null,
                relatedTo: w.relatedTo?.length
                  ? JSON.stringify(w.relatedTo)
                  : null,
              }))

            if (worldElementsToCreate.length > 0) {
              await tx.worldElement.createMany({ data: worldElementsToCreate })
            }

            // 4. 创建伏笔
            const foreshadowingsToCreate = foreshadowings.map(f => ({
              projectId: project.id,
              title: f.title,
              description: f.description,
              type: f.type,
              importance: f.importance || 5,
              expectedChapterNumber: f.expectedChapterNumber,
              status: 'planned' as const,
              relatedCharacters: f.relatedCharacters?.length
                ? JSON.stringify(f.relatedCharacters)
                : null,
              relatedElements: f.relatedElements?.length
                ? JSON.stringify(f.relatedElements)
                : null,
            }))

            if (foreshadowingsToCreate.length > 0) {
              await tx.foreshadowing.createMany({ data: foreshadowingsToCreate })
            }

            // 5. 创建分卷和章节大纲
            const volumes = arch.volumePlan.length > 0
              ? arch.volumePlan
              : [{ volumeNumber: 1, title: '第一卷', description: '', chapterRange: [1, chapters.length] as [number, number] }]

            // 先创建卷级节点
            const createdVolumes: { id: string; volumeNumber: number; chapterStart: number; chapterEnd: number }[] = []
            for (const vol of volumes) {
              const createdVol = await tx.outline.create({
                data: {
                  projectId: project.id,
                  type: 'volume',
                  order: vol.volumeNumber,
                  title: vol.title,
                  description: vol.description || '',
                  planningMode: 'full',
                  isFlexible: false,
                  confidence: 8,
                  status: 'planned',
                },
              })
              createdVolumes.push({
                id: createdVol.id,
                volumeNumber: vol.volumeNumber,
                chapterStart: vol.chapterRange[0],
                chapterEnd: vol.chapterRange[1],
              })
            }

            // 再创建章节节点，归属到对应卷
            const chapterOutlinesToCreate = chapters.map(ch => {
              const parentVol = createdVolumes.find(
                v => ch.chapterNumber >= v.chapterStart && ch.chapterNumber <= v.chapterEnd
              )
              return {
                projectId: project.id,
                type: 'chapter' as const,
                parentId: parentVol?.id || createdVolumes[0]?.id,
                order: ch.chapterNumber,
                title: ch.title || `第${ch.chapterNumber}章`,
                description: ch.summary || '',
                targetWords: ch.estimatedWords,
                planningMode: 'full' as const,
                isFlexible: false,
                confidence: 7,
                status: 'planned' as const,
                emotionalGoal: ch.emotionalGoal || '',
                plotFunction: normalizePlotFunction(ch.plotFunction),
                tensionLevel: normalizeTensionLevel(ch.tensionLevel),
                // v2 新增：戏剧结构与因果链
                act: ch.act || null,
                causalFrom: ch.causalFrom || null,
                causalTo: ch.causalTo || null,
              }
            })

            if (chapterOutlinesToCreate.length > 0) {
              await tx.outline.createMany({ data: chapterOutlinesToCreate })
            }

            // 6. 存储风格锚点
            await tx.systemSetting.upsert({
              where: { key: `project.${project.id}.styleAnchor` },
              create: {
                key: `project.${project.id}.styleAnchor`,
                value: pipelineResult.styleAnchor.content,
                category: 'project',
                description: `项目《${data.projectTitle}》的 AI 生成风格锚点`,
              },
              update: {
                value: pipelineResult.styleAnchor.content,
              },
            })

            return project
          })

          // 完成
          emit({
            type: 'done',
            step: 'done',
            progress: 100,
            data: {
              projectId: created.id,
              summary: {
                title: created.title,
                genre: created.genre,
                characters: chars.length,
                worldElements: worldSettings.length,
                chapters: chapters.length,
                foreshadowings: foreshadowings.length,
                styleAnchorWords: pipelineResult.styleAnchor.wordCount,
              },
            },
          })

          controller.close()
        } catch (error) {
          console.error('Bootstrap pipeline error:', error)
          emit({
            type: 'step_error',
            step: 'done',
            progress: 0,
            error: error instanceof Error ? error.message : '初始化失败',
          })
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  })
}
