import { getContextManager } from '@/lib/ai/context-manager'
import { getStyleAnchorPrompt } from '@/lib/ai/style-anchor'
import { prisma } from '@/lib/db/prisma'

/**
 * 加载项目完整创作数据并构建 AI 上下文包
 * 生成与续写共用，避免重复映射逻辑
 */
export async function loadProjectContext(projectId: string, currentChapter: number) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      chapters: { orderBy: { chapterNumber: 'asc' } },
      characters: true,
      worldElements: true,
      foreshadowings: true,
      outlines: {
        where: { type: 'chapter' },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!project) {
    throw new Error('Project not found')
  }

  const contextManager = getContextManager()
  const context = contextManager.buildContext({
    currentChapter,
    allChapters: project.chapters.map((ch) => ({
      ...ch,
      summary: ch.summary ?? undefined,
      notes: ch.notes ?? undefined,
    })) as any,
    characters: project.characters.map((ch) => ({
      ...ch,
      nickname: ch.nickname ?? undefined,
      age: ch.age ?? undefined,
      gender: ch.gender ?? undefined,
      appearance: ch.appearance ?? undefined,
      personality: ch.personality ?? undefined,
      backstory: ch.backstory ?? undefined,
      motivation: ch.motivation ?? undefined,
      dialogueStyle: ch.dialogueStyle ?? undefined,
      relationships: ch.relationships ?? undefined,
      characterArc: ch.characterArc ?? undefined,
      avatar: ch.avatar ?? undefined,
    })) as any,
    worldElements: project.worldElements.map((we) => ({
      ...we,
      type: we.type as any,
      attributes: we.attributes ?? undefined,
      relatedTo: we.relatedTo ?? undefined,
      references: we.references ?? undefined,
    })) as any,
    foreshadowings: project.foreshadowings as any,
    outlines: project.outlines.map((o) => ({
      order: o.order,
      title: o.title,
      description: o.description,
      status: o.status,
      emotionalGoal: o.emotionalGoal,
      plotFunction: o.plotFunction,
      tensionLevel: o.tensionLevel,
    })),
    genre: project.genre,
    style: await getStyleAnchorPrompt(projectId),
    pov: project.pov,
    projectId,
  })

  return { project, context, contextManager }
}
