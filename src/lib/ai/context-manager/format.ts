import type { ContextPackage } from '@/types'

/**
 * 将上下文包格式化为可注入 AI 的提示词文本
 */
export function formatContextForPrompt(context: ContextPackage): string {
  const parts: string[] = []

  parts.push(`## 故事信息\n`)
  parts.push(`- 类型：${context.metadata.genre}`)
  if (context.metadata.style) {
    parts.push(`- 风格：${context.metadata.style}`)
  }
  if (context.metadata.pov) {
    const povLabel =
      context.metadata.pov === 'first_person'
        ? '第一人称'
        : context.metadata.pov === 'third_person'
          ? '第三人称'
          : '多视角切换'
    parts.push(`- 叙事人称：${povLabel}`)
  }
  parts.push(`- 总章节数：${context.metadata.totalChapters}`)
  parts.push(`- 当前章节：第${context.metadata.currentChapter}章\n`)

  if (context.fullChapters.length > 0 || context.chapterSummaries.length > 0) {
    parts.push(`## 前文内容\n`)

    const MAX_CHAPTER_CHARS = 8000
    for (const chapter of context.fullChapters) {
      parts.push(`### 第${chapter.chapterNumber}章 ${chapter.title}`)
      const trimmed =
        chapter.content.length > MAX_CHAPTER_CHARS
          ? '...(前略)\n' + chapter.content.slice(-MAX_CHAPTER_CHARS)
          : chapter.content
      parts.push(trimmed)
      parts.push('\n')
    }

    if (context.chapterSummaries.length > 0) {
      parts.push(`### 更早章节摘要\n`)
      for (const summary of context.chapterSummaries) {
        parts.push(`- 第${summary.chapterNumber}章：${summary.summary}`)
      }
      parts.push('\n')
    }
  }

  if (context.characters.length > 0) {
    parts.push(`## 角色信息\n`)
    for (const char of context.characters) {
      parts.push(`### ${char.name}（${char.role || '未知定位'}）`)
      if (char.nickname) parts.push(`- 昵称：${char.nickname}`)
      if (char.age !== undefined) parts.push(`- 年龄：${char.age}`)
      if (char.gender) parts.push(`- 性别：${char.gender}`)
      if (char.appearance) parts.push(`- 外貌：${char.appearance}`)
      if (char.personality) parts.push(`- 性格：${char.personality}`)
      if (char.backstory) parts.push(`- 背景：${char.backstory}`)
      if (char.motivation) parts.push(`- 动机：${char.motivation}`)
      if (char.relationships) parts.push(`- 关系：${char.relationships}`)
      if (char.characterArc) parts.push(`- 弧光：${char.characterArc}`)
      if (char.dialogueStyle) parts.push(`- 对话风格：${char.dialogueStyle}`)
      parts.push('')
    }
  }

  if (context.worldElements.length > 0) {
    parts.push(`## 世界观设定\n`)
    for (const element of context.worldElements) {
      const scopeLabel =
        element.scope === 'global' ? '全局' : element.scope === 'regional' ? '区域' : '本地'
      const catLabel =
        element.category === 'core_rule' ? '核心规则' : element.category === 'detail' ? '细节' : '背景'
      parts.push(`### ${element.name}（${element.type} / ${scopeLabel} / ${catLabel}）`)
      parts.push(element.description)
      if (element.constraints) parts.push(`- 约束：${element.constraints}`)
      if (element.exceptions) parts.push(`- 例外：${element.exceptions}`)
      parts.push('')
    }
  }

  if (context.foreshadowings && context.foreshadowings.length > 0) {
    parts.push(`## 待回收伏笔\n`)
    const sorted = [...context.foreshadowings].sort((a, b) => b.importance - a.importance)
    for (const f of sorted) {
      const typeLabel =
        { plot: '剧情', character: '角色', world: '世界', mystery: '悬疑' }[f.type] || f.type
      const statusLabel = f.status === 'planted' ? '已埋下' : '计划中'
      const expectInfo = f.expectedChapterNumber
        ? ` → 预期第${f.expectedChapterNumber}章回收`
        : ''
      parts.push(
        `- [${typeLabel}][重要性${f.importance}][${statusLabel}] ${f.title}：${f.description}${expectInfo}`
      )
    }
    parts.push('\n')
  }

  if (context.outlines && context.outlines.length > 0) {
    parts.push(`## 章节大纲\n`)
    for (const o of context.outlines) {
      const statusLabel = o.status === 'completed' ? '✓' : o.status === 'writing' ? '...' : '○'
      parts.push(`- ${statusLabel} 第${o.order}章 ${o.title}`)
      if (o.description) {
        parts.push(`  内容：${o.description}`)
      }
      if (o.emotionalGoal) {
        parts.push(`  情感目标：${o.emotionalGoal}`)
      }
      if (o.plotFunction) {
        const plotLabel: Record<string, string> = {
          推进: '推进剧情',
          转折: '剧情转折',
          铺垫: '为后续铺垫',
          高潮: '高潮段落',
          过渡: '过渡衔接',
        }
        parts.push(`  情节功能：${plotLabel[o.plotFunction] || o.plotFunction}`)
      }
      if (o.tensionLevel) {
        parts.push(`  张力等级：${o.tensionLevel}/10`)
      }
    }
    parts.push('\n')
  }

  return parts.join('\n')
}
