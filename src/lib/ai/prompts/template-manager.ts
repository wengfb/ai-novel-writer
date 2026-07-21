/**
 * 提示词模板管理器
 * 用于管理和渲染 AI 生成提示词模板
 */
import {
  OUTLINE_GENERATION_TEMPLATE,
  OUTLINE_REFINEMENT_TEMPLATE,
  CHAPTER_GENERATION_TEMPLATE,
  CHAPTER_CONTINUATION_TEMPLATE,
  CHARACTER_GENERATION_TEMPLATE,
  CHARACTER_DIALOGUE_TEMPLATE,
  WORLD_ELEMENT_TEMPLATE,
  SCENE_GENERATION_TEMPLATE,
  CONSISTENCY_CHECK_TEMPLATE,
  LOCAL_REWRITE_TEMPLATE,
  CHAPTER_SUMMARY_TEMPLATE,
} from './templates'

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
      ['local-rewrite', LOCAL_REWRITE_TEMPLATE],
      ['chapter-summary', CHAPTER_SUMMARY_TEMPLATE],
    ])
  }

  /** 渲染提示词模板 */
  render(templateName: string, variables: PromptVariables): string {
    const template = this.templates.get(templateName)
    if (!template) {
      throw new Error(`Template not found: ${templateName}`)
    }
    return this.interpolate(template, variables)
  }

  private interpolate(template: string, variables: PromptVariables): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      const value = variables[key]
      if (value === undefined || value === null) {
        return match
      }
      return String(value)
    })
  }

  /** 注入上下文到提示词 */
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

let promptTemplateManager: PromptTemplateManager | null = null

export function getPromptTemplateManager(): PromptTemplateManager {
  if (!promptTemplateManager) {
    promptTemplateManager = new PromptTemplateManager()
  }
  return promptTemplateManager
}
