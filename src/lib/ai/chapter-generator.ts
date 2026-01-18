import { getGeminiProvider } from './providers/gemini'
import { PromptTemplateManager } from './prompts/template-manager'
import { getContextManager } from './context-manager'
import { prisma } from '@/lib/db/prisma'
import type { GenerationParams } from '@/types'

/**
 * 章节生成器
 * 实现递归规划+反思生成机制
 */
export class ChapterGenerator {
  private gemini = getGeminiProvider()
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
    onProgress?: (text: string) => void
  }): Promise<string> {
    const {
      projectId,
      chapterNumber,
      chapterTitle,
      chapterOutline,
      targetWords,
      model,
      onProgress,
    } = params

    // 1. 获取项目数据
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        chapters: {
          orderBy: { chapterNumber: 'asc' },
        },
        characters: true,
        worldElements: true,
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
      genre: project.genre,
    })

    // 3. 生成章节内容（使用场景划分策略）
    const generatedContent = await this.generateChapterWithScenes({
      chapterNumber,
      chapterTitle,
      chapterOutline,
      context,
      targetWords,
      model,
      onProgress,
    })

    // 4. 反思与优化
    const refinedContent = await this.reflectAndRefine({
      content: generatedContent,
      chapterOutline,
      context,
      model,
    })

    // 5. 记录生成历史
    await this.recordGeneration({
      projectId,
      type: 'chapter',
      model,
      prompt: this.buildPrompt({ chapterNumber, chapterTitle, chapterOutline, context }),
      output: refinedContent,
    })

    return refinedContent
  }

  /**
   * 使用场景划分策略生成章节
   */
  private async generateChapterWithScenes(params: {
    chapterNumber: number
    chapterTitle: string
    chapterOutline: string
    context: any
    targetWords: number
    model: GenerationParams['model']
    onProgress?: (text: string) => void
  }): Promise<string> {
    const { chapterNumber, chapterTitle, chapterOutline, context, targetWords, model, onProgress } =
      params

    // 1. 分析大纲，划分场景
    const scenes = await this.analyzeScenes({
      chapterOutline,
      context,
      model,
    })

    // 2. 逐场景生成
    const generatedScenes: string[] = []
    let totalWords = 0
    const targetWordsPerScene = Math.floor(targetWords / scenes.length)

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i]
      const previousContent = generatedScenes.join('\n\n')

      const sceneContent = await this.generateScene({
        scene,
        sceneIndex: i,
        totalScenes: scenes.length,
        chapterNumber,
        chapterTitle,
        previousContent,
        context,
        targetWords: targetWordsPerScene,
        model,
      })

      generatedScenes.push(sceneContent)
      totalWords += this.countWords(sceneContent)

      // 报告进度
      if (onProgress) {
        onProgress(sceneContent)
      }
    }

    // 3. 合并场景
    return generatedScenes.join('\n\n')
  }

  /**
   * 分析大纲，划分场景
   */
  private async analyzeScenes(params: {
    chapterOutline: string
    context: any
    model: GenerationParams['model']
  }): Promise<
    Array<{
      title: string
      goal: string
      location?: string
      characters: string[]
      estimatedWords: number
    }>
  > {
    const { chapterOutline, context, model } = params

    const prompt = `请根据以下章节大纲，将其划分为3-5个场景：

**章节大纲**：
${chapterOutline}

**上下文**：
${this.contextManager.formatContextForPrompt(context)}

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

    const result = await this.gemini.generate({
      type: 'chapter',
      model,
      prompt,
      temperature: 0.7,
      maxTokens: 2000,
    })

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
  private async generateScene(params: {
    scene: any
    sceneIndex: number
    totalScenes: number
    chapterNumber: number
    chapterTitle: string
    previousContent: string
    context: any
    targetWords: number
    model: GenerationParams['model']
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
    } = params

    // 构建场景提示词
    const prompt = this.promptManager.render('scene-generation', {
      sceneGoal: scene.goal,
      characters: scene.characters?.join(', ') || '主要角色',
      location: scene.location || '待定',
      previousText: previousContent.slice(-1000), // 最近1000字
      targetWords,
    })

    const result = await this.gemini.generate({
      type: 'chapter',
      model,
      prompt,
      systemPrompt: `你是一位专业小说作家。正在撰写第${chapterNumber}章《${chapterTitle}》的第${sceneIndex + 1}个场景（共${totalScenes}个场景）。

${this.contextManager.formatContextForPrompt(context)}`,
      temperature: 0.8,
      maxTokens: targetWords * 2,
    })

    return result.output
  }

  /**
   * 反思与优化
   */
  private async reflectAndRefine(params: {
    content: string
    chapterOutline: string
    context: any
    model: GenerationParams['model']
  }): Promise<string> {
    const { content, chapterOutline, context, model } = params

    const prompt = `作为一位专业编辑，请审核并优化以下章节内容：

**章节大纲**：
${chapterOutline}

**待优化内容**：
${content}

**审核要点**：
1. 是否符合剧情发展逻辑？
2. 角色行为是否符合设定？
3. 描写是否生动？是否有冗余？
4. 对话是否自然？
5. 是否需要补充细节？

请直接输出优化后的完整章节，不要包含点评和说明。`

    const result = await this.gemini.generate({
      type: 'chapter',
      model,
      prompt,
      temperature: 0.6, // 略低的温度以保证一致性
      maxTokens: this.gemini.estimateTokens(content) * 2,
    })

    return result.output || content // 如果优化失败，返回原文
  }

  /**
   * 记录生成历史
   */
  private async recordGeneration(params: {
    projectId: string
    type: string
    model: string
    prompt: string
    output: string
  }) {
    try {
      await prisma.generation.create({
        data: {
          projectId: params.projectId,
          type: params.type as any,
          provider: 'google',
          model: params.model,
          prompt: params.prompt,
          output: params.output,
          status: 'success',
        },
      })
    } catch (error) {
      console.error('Failed to record generation:', error)
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
  }): string {
    const { chapterNumber, chapterTitle, chapterOutline, context } = params

    return this.promptManager.render('chapter-generation', {
      chapterNumber,
      chapterTitle,
      chapterOutline,
      characters: JSON.stringify(context.characters),
      worldSettings: JSON.stringify(context.worldElements),
      previousSummary: context.chapterSummaries.map((s: any) => s.summary).join('\n'),
      targetWords: 3000,
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
      genre: project.genre,
    })

    const prompt = this.promptManager.render('chapter-continuation', {
      chapterNumber: chapter.chapterNumber,
      currentContent: currentContent.slice(-2000),
      targetWords,
      chapterOutline: chapter.title, // 简化处理
    })

    // 使用流式生成
    let fullOutput = ''
    const generator = this.gemini.streamGenerate({
      type: 'chapter',
      model,
      prompt,
      systemPrompt: `你是一位专业小说作家。正在续写第${chapter.chapterNumber}章。

${this.contextManager.formatContextForPrompt(context)}`,
      temperature: 0.8,
      maxTokens: targetWords * 2,
    })

    for await (const chunk of generator) {
      fullOutput += chunk
      onProgress?.(chunk)
    }

    // 记录生成
    await this.recordGeneration({
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
