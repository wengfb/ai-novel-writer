/** Onboarding 提示词共享辅助 */


/** 节奏标签映射 */
export const PACE_LABELS: Record<string, string> = {
  fast: '快节奏（短章快更，每章5000字左右，情节推进迅速）',
  medium: '中等节奏（标准篇幅，每章3500字左右，张弛有度）',
  slow: '慢节奏（长章慢展，每章2500字左右，细节描写充分）',
}

/** 受众偏好注入 */
export function audienceContext(audience?: string): string {
  if (!audience) return ''
  return audience === '男频'
    ? '\n目标受众：男频读者，偏好强剧情推进、实力成长体系、爽点密集的叙事风格。'
    : '\n目标受众：女频读者，偏好细腻情感描写、人物关系发展、氛围营造丰富的叙事风格。'
}

/** 叙事人称注入 */
export function povContext(pov?: string): string {
  if (!pov || pov === 'third_person') return ''
  if (pov === 'first_person') return '\n叙事人称：第一人称。全文以"我"的视角叙述，所有描写、心理活动、对话都必须从主角的视角出发，不描写主角不在场的场景。'
  return '\n叙事人称：多视角切换。在不同章节或场景中切换多个人物的视角进行叙述，切换时需清晰标记视角人物。'
}

/** 格式要求——每次 prompt 末尾复用 */
export const JSON_FORMAT_REQUIREMENT = `
【输出格式】
严格输出纯 JSON，不要附带任何解释文字，不要用 markdown 代码块包裹。JSON 必须可直接解析。
键名必须使用双引号，字符串值中的双引号需转义。`


export interface ActInfo {
  act: number
  label: string
  chapterRange: [number, number]
  description: string
}

export function getActDistribution(chapterCount: number): { acts: ActInfo[] } {
  const act1End = Math.max(2, Math.floor(chapterCount * 0.25))
  const act2End = Math.max(act1End + 1, Math.floor(chapterCount * 0.75))

  return {
    acts: [
      {
        act: 1,
        label: '铺垫与建置',
        chapterRange: [1, act1End],
        description: '引入世界观和主要角色，建立日常状态，展示核心冲突的萌芽。开篇切入点在此幕展开。结尾处以一个转折事件打破平衡，推动主角进入第二阶段。',
      },
      {
        act: 2,
        label: '对抗与升级',
        chapterRange: [act1End + 1, act2End],
        description: '冲突不断升级。主角面临越来越大的挑战和选择。盟友和敌人逐渐清晰。中段有一个重要的中间转折，改变故事走向。幕尾是全书最大危机。',
      },
      {
        act: 3,
        label: '高潮与收束',
        chapterRange: [act2End + 1, chapterCount],
        description: '最终对决。所有伏笔和线索汇聚。主角做出最终选择。主题获得完整表达。结局给读者满意的情感收束。',
      },
    ],
  }
}

