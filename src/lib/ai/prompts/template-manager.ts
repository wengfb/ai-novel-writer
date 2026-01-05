/**
 * 提示词模板管理器
 * 用于管理和渲染AI生成提示词模板
 */

export interface PromptVariables {
  [key: string]: any
}

export class PromptTemplateManager {
  private templates: Map<string, string>

  constructor() {
    this.templates = new Map([
      ['outline-generation', OUTLINE_GENERATION_TEMPLATE],
      ['outline-refinement', OUTLINE_REFINEMENT_TEMPLATE],
      ['chapter-generation', CHAPTER_GENERATION_TEMPLATE],
      ['chapter-continuation', CHAPTER_CONTINUATION_TEMPLATE],
      ['character-generation', CHARACTER_GENERATION_TEMPLATE],
      ['character-dialogue', CHARACTER_DIALOGUE_TEMPLATE],
      ['world-element', WORLD_ELEMENT_TEMPLATE],
      ['scene-generation', SCENE_GENERATION_TEMPLATE],
      ['consistency-check', CONSISTENCY_CHECK_TEMPLATE],
    ])
  }

  /**
   * 渲染提示词模板
   */
  render(templateName: string, variables: PromptVariables): string {
    const template = this.templates.get(templateName)
    if (!template) {
      throw new Error(`Template not found: ${templateName}`)
    }

    return this.interpolate(template, variables)
  }

  /**
   * 字符串插值
   */
  private interpolate(template: string, variables: PromptVariables): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      const value = variables[key]
      if (value === undefined || value === null) {
        return match
      }
      return String(value)
    })
  }

  /**
   * 注入上下文到提示词
   */
  injectContext(
    basePrompt: string,
    context: {
      previousChaptersSummary?: string
      currentOutline?: string
      characters?: any
      worldElements?: any
    }
  ): string {
    const parts: string[] = []

    if (context.previousChaptersSummary) {
      parts.push(`## 前文摘要\n${context.previousChaptersSummary}`)
    }

    if (context.currentOutline) {
      parts.push(`## 当前大纲\n${context.currentOutline}`)
    }

    if (context.characters && Object.keys(context.characters).length > 0) {
      parts.push(`## 角色信息\n${JSON.stringify(context.characters, null, 2)}`)
    }

    if (context.worldElements && Object.keys(context.worldElements).length > 0) {
      parts.push(`## 世界观设定\n${JSON.stringify(context.worldElements, null, 2)}`)
    }

    if (parts.length > 0) {
      return `${parts.join('\n\n')}\n\n## 用户指令\n${basePrompt}`
    }

    return basePrompt
  }
}

// ============== 提示词模板 ==============

/**
 * 大纲生成模板
 */
const OUTLINE_GENERATION_TEMPLATE = `你是一位专业的小说大纲设计师。根据以下信息生成详细的小说大纲：

**小说类型**：{genre}
**核心创意**：{coreIdea}
**故事风格**：{style}
**目标字数**：{targetWords}字
**章节数量**：{chapterCount}章

请按以下结构生成大纲，并以JSON格式返回：

\`\`\`json
{
  "storySummary": "故事梗概（200-300字）",
  "mainConflict": "核心冲突",
  "characters": [
    {
      "name": "角色名",
      "role": "主角/配角/反派",
      "description": "角色简介",
      "personality": "性格特点",
      "goal": "角色目标"
    }
  ],
  "worldSettings": [
    {
      "type": "设定类型（地理/历史/魔法/组织等）",
      "name": "设定名称",
      "description": "详细描述"
    }
  ],
  "chapters": [
    {
      "chapterNumber": 1,
      "title": "章节标题",
      "summary": "章节摘要（50-100字）",
      "keyEvents": ["关键事件1", "关键事件2"],
      "characters": ["涉及角色"],
      "estimatedWords": 预估字数
    }
  ],
  "plotTwists": [
    {
      "chapterNumber": 出现章节,
      "description": "转折描述"
    }
  ]
}
\`\`\`

请确保JSON格式正确，可以直接解析。`

/**
 * 大纲细化模板
 */
const OUTLINE_REFINEMENT_TEMPLATE = `基于以下已有大纲，请对第{chapterNumber}章进行细化：

**当前大纲**：
{currentOutline}

**用户要求**：
{userRequirement}

请生成该章的详细大纲，包含：
1. 场景划分（3-5个场景）
2. 每个场景的目标
3. 关键对话点
4. 情感节点
5. 预估字数

以JSON格式返回：
\`\`\`json
{
  "chapterNumber": {chapterNumber},
  "scenes": [
    {
      "order": 1,
      "title": "场景标题",
      "goal": "场景目标",
      "location": "地点",
      "characters": ["角色名"],
      "keyEvents": ["事件1", "事件2"],
      "estimatedWords": 字数
    }
  ]
}
\`\`\``

/**
 * 章节生成模板
 */
const CHAPTER_GENERATION_TEMPLATE = `你是一位专业的小说作家。请根据以下信息撰写小说章节：

**章节编号**：第{chapterNumber}章
**章节标题**：{chapterTitle}
**章节大纲**：{chapterOutline}
**预估字数**：{targetWords}字

**相关角色**：
{characters}

**世界观设定**：
{worldSettings}

**前文概要**：
{previousSummary}

**写作要求**：
1. 保持与前文的连贯性
2. 严格遵守角色性格设定
3. 场景描写生动具体
4. 对话自然流畅，符合人物性格
5. 节奏把控得当，张弛有度
6. 字数控制在{targetWords}字左右

请直接输出章节正文内容，不要包含任何说明性文字或标题。`

/**
 * 章节续写模板
 */
const CHAPTER_CONTINUATION_TEMPLATE = `你是一位专业的小说作家。请续写以下章节内容：

**当前章节**：第{chapterNumber}章
**已有内容**：
{currentContent}

**续写要求**：
1. 保持与已有内容的连贯性
2. 保持文风一致性
3. 续写约{targetWords}字
4. 遵循章节大纲：{chapterOutline}

请直接输出续写内容，不要重复已有内容。`

/**
 * 角色生成模板
 */
const CHARACTER_GENERATION_TEMPLATE = `请根据以下信息创建一个小说角色：

**角色定位**：{role}
**故事背景**：{storyContext}
**特殊要求**：{requirements}

请生成详细的角色卡片，包含：
1. 基本信息（姓名、年龄、性别）
2. 外貌特征
3. 性格特点
4. 背景故事
5. 核心动机
6. 对话风格示例
7. 角色弧光规划

以JSON格式返回：
\`\`\`json
{
  "name": "角色名",
  "nickname": "昵称",
  "age": 年龄,
  "gender": "性别",
  "appearance": "外貌描述",
  "personality": ["性格特点1", "性格特点2"],
  "backstory": "背景故事",
  "motivation": "核心动机",
  "dialogueStyle": "对话风格描述",
  "dialogueExample": ["对话示例1", "对话示例2"],
  "characterArc": "角色弧光"
}
\`\`\``

/**
 * 角色对话生成模板
 */
const CHARACTER_DIALOGUE_TEMPLATE = `请为角色{characterName}生成一段对话：

**角色信息**：
{characterInfo}

**对话场景**：{scenario}
**对话对象**：{otherCharacters}
**对话目的**：{purpose}

**要求**：
1. 严格遵守角色对话风格
2. 体现角色性格特点
3. 对话自然流畅
4. 包含必要的动作描写和神态描写

请直接输出对话内容，格式为小说正文。`

/**
 * 世界观元素生成模板
 */
const WORLD_ELEMENT_TEMPLATE = `请为小说创建一个世界观设定：

**设定类型**：{elementType}
**故事背景**：{storyContext}
**相关要求**：{requirements}

请生成详细的设定描述，包含：
1. 设定名称
2. 详细描述（300-500字）
3. 关键属性或规则
4. 与故事的关系

以JSON格式返回：
\`\`\`json
{
  "name": "设定名称",
  "description": "详细描述",
  "attributes": {
    "key1": "value1",
    "key2": "value2"
  },
  "rules": ["规则1", "规则2"]
}
\`\`\``

/**
 * 场景生成模板
 */
const SCENE_GENERATION_TEMPLATE = `请撰写小说中的一个场景：

**场景目标**：{sceneGoal}
**出场角色**：{characters}
**场景地点**：{location}
**场景时间**：{time}
**前文**：
{previousText}

**要求**：
1. 场景描写生动
2. 角色行为符合设定
3. 对话自然流畅
4. 字数约{targetWords}字
5. 直接输出场景内容，不要标题

请撰写场景：`

/**
 * 一致性检查模板
 */
const CONSISTENCY_CHECK_TEMPLATE = `作为一位专业编辑，请检查以下内容的一致性：

**角色设定**：
{characterSettings}

**待检查内容**：
{content}

**检查要点**：
1. 角色性格是否一致？（1-10分）
2. 对话风格是否符合角色设定？
3. 是否出现设定矛盾？
4. 具体问题描述（如有）

请以JSON格式返回分析报告：
\`\`\`json
{
  "personalityConsistency": 分数,
  "dialogueConsistency": 分数,
  "hasContradictions": true/false,
  "issues": ["问题1", "问题2"],
  "suggestions": ["建议1", "建议2"]
}
\`\`\`
`
