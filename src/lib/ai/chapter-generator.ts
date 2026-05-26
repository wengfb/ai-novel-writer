import { getAIProviderAsync } from './providers'
import type { AIProvider } from './providers/types'
import { PromptTemplateManager } from './prompts/template-manager'
import { getContextManager } from './context-manager'
import { getStyleAnchorPrompt } from './style-anchor'
import { prisma } from '@/lib/db/prisma'
import type { GenerationParams } from '@/types'

/**
 * 章节生成器
 * 实现递归规划+反思生成机制
 */
export class ChapterGenerator {
  private promptManager = new PromptTemplateManager()
  private contextManager = getContextManager()

  /**
   * 生成章节（完整流程）
   */
  async generateChapter(params: {
    projectId: string
    chapterNumber: number
    chapterTitle: string
    chapterOutline: string
    targetWords: number
    model: GenerationParams['model']
    emotionalGoal?: string
    plotFunction?: string
    tensionLevel?: number
    onProgress?: (progress: { content: string; sceneIndex: number; totalScenes: number }) => void
  }): Promise<{ content: string; totalScenes: number; generationId?: string }> {
    const startTime = Date.now()
    const {
      projectId,
      chapterNumber,
      chapterTitle,
      chapterOutline,
      targetWords,
      model,
      onProgress,
    } = params

    const ai = await getAIProviderAsync(model)

    // 1. 获取项目数据
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        chapters: {
          orderBy: { chapterNumber: 'asc' },
        },
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

    // 2. 构建上下文（类型转换以处理 null vs undefined）
    const context = this.contextManager.buildContext({
      currentChapter: chapterNumber,
      allChapters: project.chapters.map(ch => ({
        ...ch,
        summary: ch.summary ?? undefined,
        notes: ch.notes ?? undefined,
      })) as any,
      characters: project.characters.map(ch => ({
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
      worldElements: project.worldElements.map(we => ({
        ...we,
        type: we.type as any,
        attributes: we.attributes ?? undefined,
        relatedTo: we.relatedTo ?? undefined,
        references: we.references ?? undefined,
      })) as any,
      foreshadowings: project.foreshadowings as any,
      outlines: project.outlines.map(o => ({
        order: o.order,
        title: o.title,
        description: o.description,
        status: o.status,
        emotionalGoal: o.emotionalGoal,
        plotFunction: o.plotFunction,
        tensionLevel: o.tensionLevel,
      })),
      genre: project.genre,
      projectId,
    })

    // 3. 获取当前章节的大纲结构化意图（表单值优先）
    const matchedOutline = project.outlines.find(
      o => o.type === 'chapter' && o.order === chapterNumber
    )
    const outlineIntent = {
      emotionalGoal: params.emotionalGoal ?? (matchedOutline?.emotionalGoal || undefined),
      plotFunction: (params.plotFunction || matchedOutline?.plotFunction || '推进') as string,
      tensionLevel: params.tensionLevel ?? matchedOutline?.tensionLevel ?? 5,
    }

    // 4. 生成章节内容（使用场景划分策略）
    const { content: generatedContent, totalScenes } = await this.generateChapterWithScenes(ai, {
      chapterNumber,
      chapterTitle,
      chapterOutline,
      context,
      targetWords,
      model,
      outlineIntent,
      onProgress,
    })

    // 5. 反思与优化
    const refinedContent = await this.reflectAndRefine(ai, {
      content: generatedContent,
      chapterOutline,
      context,
      model,
      outlineIntent,
    })

    // 6. 记录生成历史
    const prompt = this.buildPrompt({ chapterNumber, chapterTitle, chapterOutline, context, targetWords })
    const generation = await this.recordGeneration(ai, {
      projectId,
      type: 'chapter',
      model,
      prompt,
      systemPrompt: this.contextManager.formatContextForPrompt(context),
      output: refinedContent,
      duration: Date.now() - startTime,
    })

    return {
      content: refinedContent,
      totalScenes,
      generationId: generation?.id,
    }
  }

  /**
   * 使用场景划分策略生成章节
   */
  private async generateChapterWithScenes(ai: AIProvider, params: {
    chapterNumber: number
    chapterTitle: string
    chapterOutline: string
    context: any
    targetWords: number
    model: GenerationParams['model']
    outlineIntent: { emotionalGoal?: string; plotFunction: string; tensionLevel: number }
    onProgress?: (progress: { content: string; sceneIndex: number; totalScenes: number }) => void
  }): Promise<{ content: string; totalScenes: number }> {
    const { chapterNumber, chapterTitle, chapterOutline, context, targetWords, model, outlineIntent, onProgress } =
      params

    // 1. 分析大纲，划分场景
    const scenes = await this.analyzeScenes(ai, {
      chapterOutline,
      context,
      model,
      outlineIntent,
    })

    // 2. 逐场景生成
    const generatedScenes: string[] = []
    let totalWords = 0
    const targetWordsPerScene = Math.floor(targetWords / scenes.length)

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i]
      const previousContent = generatedScenes.join('\n\n')

      const sceneContent = await this.generateScene(ai, {
        scene,
        sceneIndex: i,
        totalScenes: scenes.length,
        chapterNumber,
        chapterTitle,
        previousContent,
        context,
        targetWords: targetWordsPerScene,
        model,
        outlineIntent,
      })

      generatedScenes.push(sceneContent)
      totalWords += this.countWords(sceneContent)

      // 报告进度
      if (onProgress) {
        onProgress({ content: sceneContent, sceneIndex: i, totalScenes: scenes.length })
      }
    }

    // 3. 合并场景
    return { content: generatedScenes.join('\n\n'), totalScenes: scenes.length }
  }

  /**
   * 分析大纲，划分场景
   */
  private async analyzeScenes(ai: AIProvider, params: {
    chapterOutline: string
    context: any
    model: GenerationParams['model']
    outlineIntent: { emotionalGoal?: string; plotFunction: string; tensionLevel: number }
  }): Promise<
    Array<{
      title: string
      goal: string
      location?: string
      characters: string[]
      estimatedWords: number
    }>
  > {
    const { chapterOutline, context, model, outlineIntent } = params

    // 构建精简上下文（仅摘要 + 大纲，场景划分不需要完整章节内容和详细设定）
    const briefContext = [
      `类型：${context.metadata.genre}`,
      context.chapterSummaries.length > 0
        ? `前情摘要：${context.chapterSummaries.map((s: any) => `第${s.chapterNumber}章 ${s.summary}`).join('；')}`
        : '',
    ].filter(Boolean).join('\n')

    const plotLabel: Record<string, string> = {
      '推进': '推进剧情发展', '转折': '形成剧情转折', '铺垫': '为后续剧情做铺垫',
      '高潮': '营造剧情高潮', '过渡': '过渡衔接上下文',
    }

    const prompt = `请根据以下章节大纲，将其划分为3-5个场景：

**章节大纲**：
${chapterOutline}

**创作意图约束**：
- 情节功能：${plotLabel[outlineIntent.plotFunction] || outlineIntent.plotFunction}
- 张力等级：${outlineIntent.tensionLevel}/10${outlineIntent.emotionalGoal ? `\n- 情感目标：${outlineIntent.emotionalGoal}` : ''}

**故事背景**：
${briefContext}

请分析并返回场景划分，以JSON格式：
\`\`\`json
{
  "scenes": [
    {
      "title": "场景标题",
      "goal": "场景目标",
      "location": "地点",
      "characters": ["角色名"],
      "estimatedWords": 预估字数
    }
  ]
}
\`\`\``

    const result = await ai.generate({
      type: 'chapter',
      model,
      prompt,
      temperature: 0.7,
      maxTokens: 2000,
    })

    if (result.status !== 'success' || !result.output.trim()) {
      const detail = result.error ? `: ${result.error}` : ''
      throw new Error(`AI 场景分析失败${detail}`)
    }

    // 解析JSON结果
    try {
      const jsonMatch = result.output.match(/```json\n([\s\S]*?)\n```/) ||
        result.output.match(/\{[\s\S]*\}/)

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])
        return parsed.scenes || []
      }
    } catch (error) {
      console.error('Failed to parse scenes:', error)
    }

    // 返回默认单场景
    return [
      {
        title: '完整章节',
        goal: chapterOutline,
        characters: [],
        estimatedWords: 3000,
      },
    ]
  }

  /**
   * 生成单个场景
   */
  private async generateScene(ai: AIProvider, params: {
    scene: any
    sceneIndex: number
    totalScenes: number
    chapterNumber: number
    chapterTitle: string
    previousContent: string
    context: any
    targetWords: number
    model: GenerationParams['model']
    outlineIntent: { emotionalGoal?: string; plotFunction: string; tensionLevel: number }
  }): Promise<string> {
    const {
      scene,
      sceneIndex,
      totalScenes,
      chapterNumber,
      chapterTitle,
      previousContent,
      context,
      targetWords,
      model,
      outlineIntent,
    } = params

    // 构建场景提示词
    const prompt = this.promptManager.render('scene-generation', {
      sceneGoal: scene.goal,
      characters: scene.characters?.join(', ') || '主要角色',
      location: scene.location || '待定',
      previousText: previousContent.slice(-1000), // 最近1000字
      targetWords,
    })

    const plotLabel: Record<string, string> = {
      '推进': '推进剧情发展', '转折': '形成剧情转折', '铺垫': '为后续剧情做铺垫',
      '高潮': '营造剧情高潮', '过渡': '过渡衔接上下文',
    }

    const intentConstraints = [
      `情节功能要求：${plotLabel[outlineIntent.plotFunction] || outlineIntent.plotFunction}`,
      `整体张力等级：${outlineIntent.tensionLevel}/10（请根据此调整描写的紧张程度和节奏）`,
      outlineIntent.emotionalGoal ? `情感目标：${outlineIntent.emotionalGoal}（请通过细节描写传达此情感）` : '',
    ].filter(Boolean).join('\n')

    const sceneProjectId = context.metadata?.projectId
    const styleAnchor = sceneProjectId ? await getStyleAnchorPrompt(sceneProjectId) : ''

    const result = await ai.generate({
      type: 'chapter',
      model,
      prompt,
      systemPrompt: `你是一位专业小说作家。正在撰写第${chapterNumber}章《${chapterTitle}》的第${sceneIndex + 1}个场景（共${totalScenes}个场景）。

${styleAnchor ? styleAnchor + '\n\n' : ''}## 创作约束
${intentConstraints}

${this.contextManager.formatContextForPrompt(context)}`,
      temperature: 0.8,
      maxTokens: targetWords * 2,
    })

    if (result.status !== 'success' || !result.output.trim()) {
      const detail = result.error ? `: ${result.error}` : ''
      throw new Error(`AI 场景生成失败${detail}`)
    }

    return result.output
  }

  /**
   * 反思与优化
   */
  private async reflectAndRefine(ai: AIProvider, params: {
    content: string
    chapterOutline: string
    context: any
    model: GenerationParams['model']
    outlineIntent: { emotionalGoal?: string; plotFunction: string; tensionLevel: number }
  }): Promise<string> {
    const { content, chapterOutline, context, model, outlineIntent } = params

    const plotLabel: Record<string, string> = {
      '推进': '推进剧情发展', '转折': '形成剧情转折', '铺垫': '为后续剧情做铺垫',
      '高潮': '营造剧情高潮', '过渡': '过渡衔接上下文',
    }

    const intentCheckItems = [
      `是否达成了情节功能目标「${plotLabel[outlineIntent.plotFunction] || outlineIntent.plotFunction}」？`,
      outlineIntent.emotionalGoal ? `是否通过描写传达了情感目标「${outlineIntent.emotionalGoal}」？` : '',
      `整体张力是否接近 ${outlineIntent.tensionLevel}/10？节奏和紧张程度是否匹配？`,
    ].filter(Boolean).map((item, i) => `8${i ? '' : ''}. ${item}`).join('\n')

    const prompt = `作为一位专业编辑，请审核并优化以下章节内容。

请严格对照上下文中的角色设定和世界观规则进行审核，确保角色行为不偏离设定、世界观描写无矛盾。同时请确保章节内容达到结构化创作意图的目标。

**章节大纲**：
${chapterOutline}

**待优化内容**：
${content}

**审核要点**：
1. 是否符合剧情发展逻辑？
2. 角色行为是否符合设定？（对照上下文中的角色信息检查）
3. 世界观描写是否有矛盾？（对照上下文中的世界观规则检查）
4. 是否遗漏了重要的伏笔回收机会？
5. 描写是否生动？是否有冗余？
6. 对话是否自然？
7. 是否需要补充细节？
${intentCheckItems}

请直接输出优化后的完整章节，不要包含点评和说明。`

    const systemPrompt = `你是一位资深小说编辑，擅长发现剧情漏洞和角色行为不一致的问题。

${this.contextManager.formatContextForPrompt(context)}`

    const refineProjectId = context.metadata?.projectId
    const refineStyleAnchor = refineProjectId ? await getStyleAnchorPrompt(refineProjectId) : ''

    const result = await ai.generate({
      type: 'chapter',
      model,
      prompt,
      systemPrompt: refineStyleAnchor
        ? `${refineStyleAnchor}\n\n${systemPrompt}`
        : systemPrompt,
      temperature: 0.6, // 略低的温度以保证一致性
      maxTokens: ai.estimateTokens(content) * 2,
    })

    if (result.status !== 'success' || !result.output.trim()) {
      const detail = result.error ? `: ${result.error}` : ''
      throw new Error(`AI 章节优化失败${detail}`)
    }

    return result.output
  }

  /**
   * 记录生成历史
   */
  private async recordGeneration(ai: { name: string; model: string }, params: {
    projectId: string
    type: string
    model?: string
    prompt: string
    systemPrompt?: string
    output: string
    duration?: number
    targetId?: string
  }) {
    try {
      return await prisma.generation.create({
        data: {
          projectId: params.projectId,
          type: params.type,
          targetId: params.targetId,
          provider: ai.name,
          model: params.model || ai.model,
          prompt: params.prompt,
          systemPrompt: params.systemPrompt,
          output: params.output,
          duration: params.duration,
          status: 'success',
        },
      })
    } catch (error) {
      console.error('Failed to record generation:', error)
      return null
    }
  }

  /**
   * 构建提示词
   */
  private buildPrompt(params: {
    chapterNumber: number
    chapterTitle: string
    chapterOutline: string
    context: any
    targetWords: number
  }): string {
    const { chapterNumber, chapterTitle, chapterOutline, context, targetWords } = params

    return this.promptManager.render('chapter-generation', {
      chapterNumber,
      chapterTitle,
      chapterOutline,
      characters: JSON.stringify(context.characters),
      worldSettings: JSON.stringify(context.worldElements),
      previousSummary: context.chapterSummaries.map((s: any) => s.summary).join('\n'),
      targetWords,
    })
  }

  /**
   * 统计字数
   */
  private countWords(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    return chineseChars + englishWords
  }

  /**
   * 续写章节
   */
  async continueChapter(params: {
    projectId: string
    chapterId: string
    currentContent: string
    targetWords: number
    model: GenerationParams['model']
    onProgress?: (text: string) => void
  }): Promise<string> {
    const { projectId, chapterId, currentContent, targetWords, model, onProgress } = params
    const ai = await getAIProviderAsync(model)

    // 获取章节信息
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { project: true },
    })

    if (!chapter) {
      throw new Error('Chapter not found')
    }

    // 获取上下文
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

    const context = this.contextManager.buildContext({
      currentChapter: chapter.chapterNumber,
      allChapters: project.chapters.map(ch => ({
        ...ch,
        summary: ch.summary ?? undefined,
        notes: ch.notes ?? undefined,
      })) as any,
      characters: project.characters.map(ch => ({
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
      worldElements: project.worldElements.map(we => ({
        ...we,
        type: we.type as any,
        attributes: we.attributes ?? undefined,
        relatedTo: we.relatedTo ?? undefined,
        references: we.references ?? undefined,
      })) as any,
      foreshadowings: project.foreshadowings as any,
      outlines: project.outlines.map(o => ({
        order: o.order,
        title: o.title,
        description: o.description,
        status: o.status,
        emotionalGoal: o.emotionalGoal,
        plotFunction: o.plotFunction,
        tensionLevel: o.tensionLevel,
      })),
      genre: project.genre,
      projectId,
    })

    // 从 Outline 表匹配当前章节的大纲描述和结构化意图
    const matchedOutline = project.outlines.find(
      o => o.type === 'chapter' && o.order === chapter.chapterNumber
    )
    const chapterOutline = matchedOutline?.description || chapter.summary || chapter.title

    const outlineIntent = {
      emotionalGoal: matchedOutline?.emotionalGoal || undefined,
      plotFunction: (matchedOutline?.plotFunction || '推进') as string,
      tensionLevel: matchedOutline?.tensionLevel || 5,
    }

    const plotLabel: Record<string, string> = {
      '推进': '推进剧情发展', '转折': '形成剧情转折', '铺垫': '为后续剧情做铺垫',
      '高潮': '营造剧情高潮', '过渡': '过渡衔接上下文',
    }

    const intentConstraints = [
      `情节功能要求：${plotLabel[outlineIntent.plotFunction] || outlineIntent.plotFunction}`,
      `整体张力等级：${outlineIntent.tensionLevel}/10`,
      outlineIntent.emotionalGoal ? `情感目标：${outlineIntent.emotionalGoal}` : '',
    ].filter(Boolean).join('\n')

    // 构建续写上文（末尾 8000 字 + 如有摘要则加入）
    const recentContent = currentContent.slice(-8000)
    const contentSnippet = chapter.summary
      ? `[前文摘要：${chapter.summary}]\n\n${recentContent}`
      : recentContent

    const prompt = this.promptManager.render('chapter-continuation', {
      chapterNumber: chapter.chapterNumber,
      currentContent: contentSnippet,
      targetWords,
      chapterOutline,
    })

    // 使用流式生成
    let fullOutput = ''
    const continueStyleAnchor = await getStyleAnchorPrompt(projectId)
    const generator = ai.streamGenerate({
      type: 'chapter',
      model,
      prompt,
      systemPrompt: `你是一位专业小说作家。正在续写第${chapter.chapterNumber}章《${chapter.title}》。

${continueStyleAnchor ? continueStyleAnchor + '\n\n' : ''}## 创作约束
${intentConstraints}

${this.contextManager.formatContextForPrompt(context)}`,
      temperature: 0.8,
      maxTokens: targetWords * 2,
    })

    for await (const chunk of generator) {
      fullOutput += chunk
      onProgress?.(chunk)
    }

    // 记录生成
    await this.recordGeneration(ai, {
      projectId,
      type: 'chapter',
      model,
      prompt,
      output: fullOutput,
    })

    return fullOutput
  }
}

// 导出单例
let chapterGenerator: ChapterGenerator | null = null

export function getChapterGenerator(): ChapterGenerator {
  if (!chapterGenerator) {
    chapterGenerator = new ChapterGenerator()
  }
  return chapterGenerator
}
