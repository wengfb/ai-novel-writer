/** 情节功能标签（章节生成/续写/反思共用） */
export const PLOT_FUNCTION_LABELS: Record<string, string> = {
  推进: '推进剧情发展',
  转折: '形成剧情转折',
  铺垫: '为后续剧情做铺垫',
  高潮: '营造剧情高潮',
  过渡: '过渡衔接上下文',
}

export type OutlineIntent = {
  emotionalGoal?: string
  plotFunction: string
  tensionLevel: number
}

export function formatIntentConstraints(outlineIntent: OutlineIntent): string {
  return [
    `情节功能要求：${PLOT_FUNCTION_LABELS[outlineIntent.plotFunction] || outlineIntent.plotFunction}`,
    `整体张力等级：${outlineIntent.tensionLevel}/10（请根据此调整描写的紧张程度和节奏）`,
    outlineIntent.emotionalGoal
      ? `情感目标：${outlineIntent.emotionalGoal}（请通过细节描写传达此情感）`
      : '',
  ]
    .filter(Boolean)
    .join('\n')
}
