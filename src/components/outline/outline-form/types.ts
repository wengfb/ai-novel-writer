export type OutlineFormData = {
  type: 'volume' | 'chapter' | 'scene'
  parentId: string
  order: string
  title: string
  description: string
  targetWords: string
  planningMode: 'full' | 'progressive'
  planningRange: string
  isFlexible: boolean
  confidence: number[]
  emotionalGoal: string
  plotFunction: '推进' | '转折' | '铺垫' | '高潮' | '过渡'
  tensionLevel: number[]
}

export function createDefaultOutlineForm(params: {
  defaultType?: 'volume' | 'chapter' | 'scene'
  parentId?: string | null
}): OutlineFormData {
  return {
    type: params.defaultType || 'chapter',
    parentId: params.parentId || '__none__',
    order: '1',
    title: '',
    description: '',
    targetWords: '',
    planningMode: 'full',
    planningRange: '',
    isFlexible: false,
    confidence: [5],
    emotionalGoal: '',
    plotFunction: '推进',
    tensionLevel: [5],
  }
}
