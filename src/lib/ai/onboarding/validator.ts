import type { PipelineResult, ValidationResult, ValidationWarning } from './types'

/**
 * 对管线完整输出进行质量校验
 * 返回 errors（必须修复）和 warnings（建议关注）
 */
export function validatePipelineResult(result: PipelineResult): ValidationResult {
  const errors: ValidationWarning[] = []
  const warnings: ValidationWarning[] = []

  validateArchitecture(result, errors, warnings)
  validateCharacters(result, errors, warnings)
  validateWorld(result, errors, warnings)
  validateChapters(result, errors, warnings)
  validateForeshadowings(result, errors, warnings)

  return {
    errors,
    warnings,
    passed: errors.length === 0,
  }
}

// ============ 各维度校验 ============

function addWarning(
  list: ValidationWarning[],
  field: string,
  message: string,
  severity: 'low' | 'medium' | 'high' = 'medium'
) {
  list.push({ field, message, severity })
}

function validateArchitecture(
  r: PipelineResult,
  errors: ValidationWarning[],
  warnings: ValidationWarning[]
) {
  const a = r.architecture

  if (!a.storySummary || a.storySummary.length < 100) {
    addWarning(errors, 'architecture.storySummary', '故事梗概过短（<100字），无法覆盖完整主线', 'high')
  }
  if (!a.storySummary.includes('结局') && !a.storySummary.includes('最终')) {
    addWarning(warnings, 'architecture.storySummary', '故事梗概可能未包含结局信息', 'medium')
  }
  if (!a.mainConflict || a.mainConflict.length < 20) {
    addWarning(errors, 'architecture.mainConflict', '核心冲突描述过于简略', 'high')
  }
  if (!a.actStructure || a.actStructure.length < 2) {
    addWarning(errors, 'architecture.actStructure', '幕结构不完整（至少需要2幕）', 'high')
  }
  if (!a.volumePlan || a.volumePlan.length === 0) {
    addWarning(errors, 'architecture.volumePlan', '缺少分卷方案', 'high')
  }
  if (!a.thematicThread || a.thematicThread.length < 30) {
    addWarning(warnings, 'architecture.thematicThread', '主题线索描述过于简略', 'low')
  }
}

function validateCharacters(
  r: PipelineResult,
  errors: ValidationWarning[],
  warnings: ValidationWarning[]
) {
  const chars = r.characters.characters

  if (chars.length < 8) {
    addWarning(errors, 'characters.count', `角色数量不足：需要至少8个，实际只有${chars.length}个`, 'high')
  }

  const roles = chars.map(c => c.role)
  const hasProtagonist = roles.some(r => r === '主角' || r === 'protagonist')
  const hasAntagonist = roles.some(r => r === '反派' || r === 'antagonist')

  if (!hasProtagonist) {
    addWarning(errors, 'characters.roles', '缺少主角', 'high')
  }
  if (!hasAntagonist) {
    addWarning(warnings, 'characters.roles', '缺少明确的反派角色', 'medium')
  }

  // 检查关系闭环
  const nameSet = new Set(chars.map(c => c.name))
  chars.forEach(c => {
    if (!c.personality || (Array.isArray(c.personality) ? c.personality.length === 0 : c.personality.length < 5)) {
      addWarning(warnings, `characters.${c.name}.personality`, `角色"${c.name}"的性格描述过于简略`, 'low')
    }
    if (!c.goal || c.goal.length < 10) {
      addWarning(warnings, `characters.${c.name}.goal`, `角色"${c.name}"的目标描述不足`, 'low')
    }
    if (!c.characterArc || c.characterArc.length < 10) {
      addWarning(warnings, `characters.${c.name}.characterArc`, `角色"${c.name}"缺少角色弧光描述`, 'low')
    }
    if (!c.dialogueStyle || c.dialogueStyle.length < 5) {
      addWarning(warnings, `characters.${c.name}.dialogueStyle`, `角色"${c.name}"缺少对话风格描述`, 'low')
    }

    // 检查关系引用是否存在
    if (c.relationships) {
      c.relationships.forEach(rel => {
        if (!nameSet.has(rel.targetName)) {
          addWarning(warnings, `characters.${c.name}.relationships`, `角色"${c.name}"的关系引用了不存在的角色"${rel.targetName}"`, 'medium')
        }
      })
    }
  })
}

function validateWorld(
  r: PipelineResult,
  errors: ValidationWarning[],
  warnings: ValidationWarning[]
) {
  const ws = r.worldSettings.worldSettings

  if (ws.length < 6) {
    addWarning(errors, 'worldSettings.count', `世界元素数量不足：需要至少6个，实际只有${ws.length}个`, 'high')
  }

  const coreRules = ws.filter(w => w.category === 'core_rule')
  if (coreRules.length === 0) {
    addWarning(warnings, 'worldSettings.coreRules', '缺少核心规则类世界元素（如力量体系/魔法体系）', 'medium')
  }

  ws.forEach(w => {
    if (!w.description || w.description.length < 50) {
      addWarning(warnings, `worldSettings.${w.name}.description`, `世界元素"${w.name}"的描述过短`, 'low')
    }
    if (!w.constraints || w.constraints.length === 0) {
      addWarning(warnings, `worldSettings.${w.name}.constraints`, `世界元素"${w.name}"缺少约束条件`, 'medium')
    }
  })
}

function validateChapters(
  r: PipelineResult,
  errors: ValidationWarning[],
  warnings: ValidationWarning[]
) {
  const chapters = r.chapters.chapters

  if (chapters.length < 8) {
    addWarning(errors, 'chapters.count', `章节数量不足：至少8章，实际${chapters.length}章`, 'high')
  }

  // 检查章节号连续性
  for (let i = 0; i < chapters.length; i++) {
    const expected = i + 1
    if (chapters[i].chapterNumber !== expected) {
      addWarning(warnings, 'chapters.order', `章节号不连续：期望${expected}，实际${chapters[i].chapterNumber}`, 'medium')
    }
  }

  // 检查因果链
  for (let i = 1; i < chapters.length; i++) {
    const prev = chapters[i - 1]
    const curr = chapters[i]
    if (!curr.causalFrom || curr.causalFrom.length < 5) {
      addWarning(warnings, `chapters.${curr.chapterNumber}.causalFrom`, `第${curr.chapterNumber}章缺少因果链（前因）`, 'medium')
    }
    if (!prev.causalTo || prev.causalTo.length < 5) {
      addWarning(warnings, `chapters.${prev.chapterNumber}.causalTo`, `第${prev.chapterNumber}章缺少因果链（后果）`, 'medium')
    }
  }

  // 检查张力曲线
  const tensionLevels = chapters.map(c => c.tensionLevel)
  const maxTension = Math.max(...tensionLevels)
  const minTension = Math.min(...tensionLevels)

  if (maxTension < 8) {
    addWarning(warnings, 'chapters.tensionArc', '整体张力偏低：最高张力不足8，缺少高潮章节', 'medium')
  }
  if (maxTension - minTension < 4) {
    addWarning(warnings, 'chapters.tensionArc', '张力变化范围过小：缺乏起伏感', 'medium')
  }

  // 检查高潮章节分布
  const climaxChapters = chapters.filter(c => c.tensionLevel >= 8)
  const lastChapter = chapters[chapters.length - 1]
  if (climaxChapters.length === 0) {
    addWarning(errors, 'chapters.tensionArc', '完全没有张力≥8的高潮章节', 'high')
  }
  if (lastChapter && lastChapter.tensionLevel < 7) {
    addWarning(warnings, 'chapters.tensionArc', '最后一章张力偏低，故事收束可能偏弱', 'low')
  }

  // 检查 plotFunction 分布
  const functionCounts = chapters.reduce((acc, c) => {
    acc[c.plotFunction] = (acc[c.plotFunction] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const totalChapters = chapters.length
  const climaxRatio = (functionCounts['高潮'] || 0) / totalChapters
  if (climaxRatio < 0.08) {
    addWarning(warnings, 'chapters.plotFunction', '高潮章节占比过低（<8%），情节可能缺乏爆发力', 'medium')
  }

  // 检查字数
  const totalEstimated = chapters.reduce((sum, c) => sum + (c.estimatedWords || 0), 0)
  const target = r.chapters.suggestedTotalWords
  if (target && Math.abs(totalEstimated - target) / target > 0.3) {
    addWarning(warnings, 'chapters.wordCount', `章节预估总字数(${totalEstimated.toLocaleString()})与目标(${target.toLocaleString()})偏差超过30%`, 'medium')
  }
}

function validateForeshadowings(
  r: PipelineResult,
  errors: ValidationWarning[],
  warnings: ValidationWarning[]
) {
  const fs = r.foreshadowings.foreshadowings
  const totalChapters = r.chapters.chapters.length

  if (fs.length < 8) {
    addWarning(errors, 'foreshadowings.count', `伏笔数量不足：需要至少8个，实际只有${fs.length}个`, 'high')
  }

  fs.forEach(f => {
    if (f.plantedInChapterNumber < 1 || f.plantedInChapterNumber > totalChapters) {
      addWarning(errors, `foreshadowings.${f.title}`, `伏笔"${f.title}"的埋设章节(${f.plantedInChapterNumber})超出范围(1-${totalChapters})`, 'high')
    }
    if (f.expectedChapterNumber < 1 || f.expectedChapterNumber > totalChapters) {
      addWarning(errors, `foreshadowings.${f.title}`, `伏笔"${f.title}"的回收章节(${f.expectedChapterNumber})超出范围(1-${totalChapters})`, 'high')
    }
    if (f.expectedChapterNumber <= f.plantedInChapterNumber) {
      addWarning(errors, `foreshadowings.${f.title}`, `伏笔"${f.title}"的回收章节(${f.expectedChapterNumber})必须大于埋设章节(${f.plantedInChapterNumber})`, 'high')
    }
  })

  // 检查是否所有回收章节都在最后几章
  const lastQuarterStart = Math.floor(totalChapters * 0.75)
  const lateReveals = fs.filter(f => f.expectedChapterNumber >= lastQuarterStart)
  if (lateReveals.length > fs.length * 0.6) {
    addWarning(warnings, 'foreshadowings.distribution', '超过60%的伏笔回收集中在后1/4章节，建议分布更均匀', 'medium')
  }
}
