import type { StoryIdeaCard } from '@/types'
import type { BootstrapParams, ChapterCalculation } from './types'

// ============ 辅助函数 ============

/** 节奏标签映射 */
const PACE_LABELS: Record<string, string> = {
  fast: '快节奏（短章快更，每章5000字左右，情节推进迅速）',
  medium: '中等节奏（标准篇幅，每章3500字左右，张弛有度）',
  slow: '慢节奏（长章慢展，每章2500字左右，细节描写充分）',
}

/** 受众偏好注入 */
function audienceContext(audience?: string): string {
  if (!audience) return ''
  return audience === '男频'
    ? '\n目标受众：男频读者，偏好强剧情推进、实力成长体系、爽点密集的叙事风格。'
    : '\n目标受众：女频读者，偏好细腻情感描写、人物关系发展、氛围营造丰富的叙事风格。'
}

/** 叙事人称注入 */
function povContext(pov?: string): string {
  if (!pov || pov === 'third_person') return ''
  if (pov === 'first_person') return '\n叙事人称：第一人称。全文以"我"的视角叙述，所有描写、心理活动、对话都必须从主角的视角出发，不描写主角不在场的场景。'
  return '\n叙事人称：多视角切换。在不同章节或场景中切换多个人物的视角进行叙述，切换时需清晰标记视角人物。'
}

/** 格式要求——每次 prompt 末尾复用 */
const JSON_FORMAT_REQUIREMENT = `
【输出格式】
严格输出纯 JSON，不要附带任何解释文字，不要用 markdown 代码块包裹。JSON 必须可直接解析。
键名必须使用双引号，字符串值中的双引号需转义。`

// ============ 步骤 1：故事架构 ============

export function buildArchitecturePrompt(
  idea: StoryIdeaCard,
  params: BootstrapParams,
  calc: ChapterCalculation
): string {
  const actDistribution = getActDistribution(calc.chapterCount)

  return `你是一位资深的小说策划编辑。请基于以下创意，为小说《${params.projectTitle}》设计完整的全局架构。

【创意设定】
- 题材：${idea.genre}
- 世界观：${idea.worldBuilding}
- 主角：${idea.protagonist}
- 核心冲突：${idea.coreConflict}
- 主线目标：${idea.mainGoal}
- 高概念梗概：${idea.highConcept}
- 主题升华：${idea.sublimation}
- 开篇切入点：${idea.openingHook}

【创作参数】
- 目标总字数：${params.targetWords.toLocaleString()} 字
- 叙事节奏：${PACE_LABELS[params.pace]}
- 计划章节数：${calc.chapterCount} 章
- 分卷数：${calc.volumeCount} 卷，每卷约 ${calc.chaptersPerVolume} 章${audienceContext(params.audience)}${params.tone ? `\n- 故事基调：${params.tone}` : ''}${povContext(params.pov)}

【任务要求】

1. **故事梗概** (300-500字)：完整的故事主线，从开篇到结局，涵盖关键转折点和最终结局。将"${idea.openingHook}"作为开篇引子融入故事线，将"${idea.sublimation}"作为主题线索贯穿全篇。

2. **核心冲突**：明确的内外冲突。外部冲突（对抗力量是什么？）和内部冲突（主角的内心挣扎是什么？）。

3. **三幕结构** (${actDistribution.acts.length} 幕)：
${actDistribution.acts.map(a => `   - 第${a.act}幕："${a.label}"：第 ${a.chapterRange[0]}-${a.chapterRange[1]} 章，${a.description}`).join('\n')}

4. **分卷方案** (${calc.volumeCount} 卷)：每卷有自己的小高潮和阶段目标。

5. **主题线索**：说明"${idea.sublimation}"这个主题如何在故事的不同阶段展开和深化。

请输出以下 JSON：
{
  "storySummary": "完整故事梗概（300-500字，包含开篇-发展-高潮-结局）",
  "mainConflict": "核心冲突描述（内外部冲突）",
  "suggestedTotalWords": ${params.targetWords},
  "wordCountRationale": "篇幅分配说明（为什么这样分配，高潮章节占比等）",
  "actStructure": [
    { "act": 1, "chapterRange": [${actDistribution.acts[0].chapterRange[0]}, ${actDistribution.acts[0].chapterRange[1]}], "description": "该幕的主要事件和情感走向", "emotionalArc": "情感弧线描述" }
  ],
  "volumePlan": [
    { "volumeNumber": 1, "title": "卷名", "description": "本卷主要内容和阶段目标", "chapterRange": [1, N] }
  ],
  "thematicThread": "主题线索如何在各阶段展开"
}

要求：
- storySummary 必须覆盖从开篇到结局的完整主线，不能只有开头
- 开篇切入点必须体现在 actStructure 第1幕中
- 卷名要有吸引力，不能是"第一卷"这种占位符
- 每卷的小高潮规划要具体${JSON_FORMAT_REQUIREMENT}`
}

// ============ 步骤 2：角色群像 ============

export function buildCharactersPrompt(
  idea: StoryIdeaCard,
  architecture: { storySummary: string; mainConflict: string; thematicThread: string },
  params: BootstrapParams
): string {
  return `你是一位专业的小说角色设计师。请基于以下故事架构，创建完整的角色群像。

【故事概要】
${architecture.storySummary}

【核心冲突】
${architecture.mainConflict}

【主题线索】
${architecture.thematicThread}

【角色基础设定】
- 主角：${idea.protagonist}${audienceContext(params.audience)}${params.tone ? `\n- 故事基调：${params.tone}` : ''}${povContext(params.pov)}

【任务要求】

请生成 **10-15 个角色**，覆盖以下角色类型，确保每个类型都有代表：
- 主角 (protagonist)：1-2 个
- 反派 (antagonist)：2-3 个（包括最终反派和阶段性反派）
- 主要配角 (supporting)：4-6 个（盟友、导师、伙伴等关键配角）
- 次要角色 (minor)：3-4 个（功能性角色但有自己的特点）

每个角色必须包含：

1. **基本信息**：name, role（主角/配角/反派/次要角色）, description（100-200字的角色简介）
2. **性格**：personality（可以是字符串或数组，描述性格的多维度特征）
3. **动机与弧光**：
   - goal：角色的核心目标和驱动力
   - characterArc：角色在故事中的变化轨迹（从A变成B，或者因为什么而改变）
4. **对话风格**：dialogueStyle（描述该角色的语言习惯、口头禅、语气特点）
5. **关系网络**：relationships（至少列出 2 个与其他角色的关系，说明关系性质和互动要点）
6. **登场时机**：firstAppearance（角色在故事的大致哪个阶段登场）

请输出以下 JSON：
{
  "characters": [
    {
      "name": "角色名",
      "role": "主角/配角/反派/次要角色",
      "description": "角色简介（100-200字）",
      "personality": "性格特点",
      "goal": "核心目标",
      "characterArc": "角色弧光（从何种状态变为何种状态）",
      "dialogueStyle": "对话风格描述",
      "relationships": [
        { "targetName": "关联角色名", "relation": "关系名称（师徒/对手/爱人/仇敌等）", "description": "关系具体描述" }
      ],
      "firstAppearance": "登场阶段描述"
    }
  ]
}

要求：
- 角色数量必须达到 10-15 个
- 每个角色的性格必须具体，不能是"性格坚韧"这种泛泛描述
- 关系网络要形成闭环：如果A的关系中提到B，B的关系中也应提到A
- 反派的动机必须有其合理性，不能是纯粹的恶
- 配角要有独立的性格和目标，不能只是主角的附庸${JSON_FORMAT_REQUIREMENT}`
}

// ============ 步骤 3：世界观 ============

export function buildWorldPrompt(
  idea: StoryIdeaCard,
  architecture: { storySummary: string; mainConflict: string },
  characters: { name: string; description: string }[],
  params: BootstrapParams
): string {
  const charNames = characters.map(c => c.name).join('、')

  return `你是一位专业的小说世界观设计师。请基于以下故事和角色信息，构建完整的世界观体系。

【故事概要】
${architecture.storySummary}

【核心冲突】
${architecture.mainConflict}

【已有角色】
${charNames}

【原始世界观概念】
${idea.worldBuilding}
${idea.genre ? `题材类型：${idea.genre}` : ''}${audienceContext(params.audience)}${povContext(params.pov)}

【任务要求】

请生成 **8-12 个世界观元素**，覆盖以下类型：
- 地理/地点 (location)：3-4 个（与角色和情节相关的重要地点）
- 历史/传说 (history)：1-2 个（影响当前故事的历史事件或传说）
- 力量/魔法/修炼体系 (magic)：1-2 个（如果适用）
- 组织/势力 (organization)：2-3 个（与核心冲突相关的势力）
- 关键物品 (item)：1-2 个
- 其他 (other)：0-1 个

每个世界观元素必须包含：

1. **基本信息**：type, name, description（300-500字详细描述）
2. **重要性与范围**：
   - importance：1-10（该元素对故事的重要程度）
   - scope：global（影响整个故事世界）/ regional（影响某个区域）/ local（影响特定地点）
   - category：core_rule（核心规则：力量体系、世界法则）/ detail（细节设定）/ background（背景信息）
3. **约束与例外**：
   - constraints：至少 1 条该设定的限制或规则
   - exceptions：例外情况（如有）
4. **关联**：relatedTo（关联的角色名或世界观元素名列表）
5. **演化空间**：isEvolvable（是否可随时间演化），evolutionSpace（可能的演化方向）

请输出以下 JSON：
{
  "worldSettings": [
    {
      "type": "location/history/magic/organization/item/other",
      "name": "设定名称",
      "description": "详细描述（300-500字，包含视觉细节、功能说明、故事意义）",
      "importance": 7,
      "scope": "global",
      "category": "core_rule",
      "constraints": [
        { "description": "约束说明", "rule": "具体规则" }
      ],
      "exceptions": [
        { "condition": "例外条件", "description": "例外说明" }
      ],
      "relatedTo": ["角色名或元素名"],
      "isEvolvable": false,
      "evolutionSpace": "演化空间描述（如不可演化则写'不可演化'并说明原因）"
    }
  ]
}

要求：
- 世界元素总数 8-12 个
- 核心规则类至少 2 个（必须包含力量体系/魔法体系/修炼体系中的一个，如果故事中有的话）
- 每个地点的描述要具体到可以用作场景描写的参考
- 每个组织/势力的概况必须包含其目标和与其他势力的关系
- constraints 不能为空，要写出真正的限制
- relatedTo 必须引用前面角色的真实名称：${charNames}${JSON_FORMAT_REQUIREMENT}`
}

// ============ 步骤 4：分章大纲 ============

export function buildChaptersPrompt(
  idea: StoryIdeaCard,
  architecture: {
    storySummary: string
    actStructure: { act: number; chapterRange: [number, number]; description: string; emotionalArc: string }[]
    volumePlan: { volumeNumber: number; title: string; description: string; chapterRange: [number, number] }[]
    thematicThread: string
  },
  characters: { name: string; role: string }[],
  worldSettings: { name: string; type: string }[],
  params: BootstrapParams,
  calc: ChapterCalculation
): string {
  const charNames = characters.map(c => c.name).join('、')
  const worldNames = worldSettings.map(w => w.name).join('、')

  const actDescriptions = architecture.actStructure
    .map(a => `第${a.act}幕（第${a.chapterRange[0]}-${a.chapterRange[1]}章）：${a.description}\n  情感弧线：${a.emotionalArc}`)
    .join('\n')

  const volumeDescriptions = architecture.volumePlan
    .map(v => `第${v.volumeNumber}卷"${v.title}"（第${v.chapterRange[0]}-${v.chapterRange[1]}章）：${v.description}`)
    .join('\n')

  return `你是一位专业的小说大纲设计师。请基于以下完整的项目设定，生成 ${calc.chapterCount} 章的分章大纲。

【故事概要】
${architecture.storySummary}

【幕结构】
${actDescriptions}

【分卷方案】
${volumeDescriptions}

【主题线索】
${architecture.thematicThread}

【角色列表】
${charNames}

【世界观元素列表】
${worldNames}

【创作参数】
- 目标总字数：${params.targetWords.toLocaleString()} 字
- 计划章节数：${calc.chapterCount} 章
- 每章平均字数：${calc.avgChapterWords} 字
- 叙事节奏：${PACE_LABELS[params.pace]}${audienceContext(params.audience)}${povContext(params.pov)}

【任务要求】

为全部 ${calc.chapterCount} 章生成大纲，每章包含：

1. **章节标题**：title（要有吸引力，不能是"第X章"）
2. **章节摘要**：summary（80-150字，写清本章发生的关键事件）
3. **情感目标**：emotionalGoal（本章想让读者产生什么情感反应）
4. **情节功能**：plotFunction（只能是：推进、转折、铺垫、高潮、过渡 之一）
5. **张力等级**：tensionLevel（1-10，高潮章节 8-10，铺垫章节 3-5）
6. **关键事件**：keyEvents（2-4 个具体事件）
7. **涉及角色**：characters（从角色列表中选择，必须是真实角色名）
8. **预估字数**：estimatedWords
9. **所属幕**：act（1/2/3，按幕结构分配）
10. **因果链**：causalFrom（前一章的什么事件导致本章发生）、causalTo（本章的事件会引发什么后果）

【字数与张力分布要求】
- 高潮章节（tensionLevel 8-10）estimatedWords 应偏高（${Math.round(calc.avgChapterWords * 1.3)} 字左右）
- 过渡章节（plotFunction="过渡"）estimatedWords 可偏低（${Math.round(calc.avgChapterWords * 0.7)} 字左右）
- 所有章节的 estimatedWords 之和应接近 ${params.targetWords.toLocaleString()}
- 张力曲线应该呈现波浪式上升：有起有伏，但整体从低到高
- 每卷结尾应有一个小高潮（tensionLevel ≥ 8）
- 最后 3 章应是大高潮和收束

请输出以下 JSON：
{
  "chapters": [
    {
      "chapterNumber": 1,
      "title": "章节标题（有吸引力）",
      "summary": "章节摘要（80-150字）",
      "emotionalGoal": "情感目标",
      "plotFunction": "推进/转折/铺垫/高潮/过渡",
      "tensionLevel": 5,
      "keyEvents": ["关键事件1", "关键事件2"],
      "characters": ["角色1", "角色2"],
      "estimatedWords": ${calc.avgChapterWords},
      "act": 1,
      "causalFrom": "前因（第一章可写'故事开端'）",
      "causalTo": "后果"
    }
  ],
  "suggestedTotalWords": ${params.targetWords},
  "wordCountRationale": "总体篇幅分配说明",
  "tensionArcSummary": "整体张力曲线描述（高潮点在哪几章，为什么这样安排）"
}

要求：
- 必须生成全部 ${calc.chapterCount} 章，不能少
- 章节标题必须有特色，不能是"新的征程"、"危机来临"这种空洞标题
- causalFrom/causalTo 必须形成完整的因果链：第N章的 causalTo 应大致对应第N+1章的 causalFrom
- keyEvents 要具体到发生了什么事，不能是"发生了一场战斗"这种模糊描述
- plotFunction 分布合理：高潮章节占 15%，转折占 20%，铺垫占 25%，推进占 30%，过渡占 10%
- 角色登场必须符合前面设定：如果某个角色在第一章还没出现，就不要写在 characters 中${JSON_FORMAT_REQUIREMENT}`
}

// ============ 步骤 5：伏笔系统 ============

export function buildForeshadowingsPrompt(
  chapters: { chapterNumber: number; title: string; summary: string }[],
  characters: { name: string }[],
  worldSettings: { name: string }[],
  params: BootstrapParams
): string {
  const chapterList = chapters
    .map(c => `第${c.chapterNumber}章《${c.title}》：${c.summary}`)
    .join('\n')

  const charNames = characters.map(c => c.name).join('、')
  const worldNames = worldSettings.map(w => w.name).join('、')

  return `你是一位擅长埋伏笔和设置悬念的小说家。请基于以下章节大纲，设计一个完整的伏笔网络。

【章节大纲】
${chapterList}

【角色列表】${charNames}
【世界观元素】${worldNames}

【总章节数】${chapters.length} 章

【任务要求】

请设计 **10-15 个伏笔**，均匀分布在故事的不同阶段。伏笔类型分布：
- 剧情伏笔 (plot)：3-5 个（与主线剧情转折相关）
- 角色伏笔 (character)：3-5 个（与角色身份、背景、关系相关）
- 世界伏笔 (world)：2-3 个（与世界观秘密、隐藏设定相关）
- 悬疑伏笔 (mystery)：2-3 个（与谜题、悬念相关）

每个伏笔必须包含：
1. **标题和描述**：title, description（该伏笔的具体内容）
2. **类型和重要性**：type, importance（1-10）
3. **埋设点**：plantedInChapterNumber（在哪个章节埋下线索）
4. **回收点**：expectedChapterNumber（预期在哪个章节揭晓/回收）
5. **关联角色和元素**：relatedCharacters, relatedElements

设计原则：
- 伏笔有层次：小的伏笔 2-3 章内回收，大的伏笔贯穿全书
- 回收点不能全部集中在最后，应该分布在中后期
- 同一个章节可以同时埋多个伏笔
- plantedInChapterNumber 和 expectedChapterNumber 必须在 1-${chapters.length} 范围内
- 每个伏笔的回收点必须 > 埋设点

请输出以下 JSON：
{
  "foreshadowings": [
    {
      "title": "伏笔名称",
      "description": "伏笔具体描述（埋下了什么线索）",
      "type": "plot",
      "importance": 5,
      "plantedInChapterNumber": 3,
      "expectedChapterNumber": 15,
      "relatedCharacters": ["角色名"],
      "relatedElements": ["世界观元素名"]
    }
  ]
}

要求：
- 伏笔总数 10-15 个
- 不同类型伏笔要均匀分布
- 回收章节要合理（不能全部挤在最后几章）
- 本中途回收的伏笔要标记清楚${JSON_FORMAT_REQUIREMENT}`
}

// ============ 步骤 6：风格锚点 ============

export function buildStyleAnchorPrompt(
  idea: StoryIdeaCard,
  summary: string,
  params: BootstrapParams
): string {
  return `你是一位专业的小说作家。请根据以下设定，写一段 800-1200 字的样章，作为本项目后续 AI 生成的写作风格参考。

【故事设定】
- 题材：${idea.genre}
- 核心创意：${idea.highConcept}
- 主角：${idea.protagonist}
- 核心冲突：${idea.coreConflict}
- 故事基调：${params.tone || '正剧'}${audienceContext(params.audience)}

【故事概要】
${summary}

【写作要求】

1. 选择一个有代表性的场景来写（可以是开篇场景，也可以是某个关键冲突场景）
2. 样章要求：
   - 展示该题材应有的叙事节奏和描写密度
   - 包含对话片段，展示对话风格
   - 包含环境/场景描写，展示描写风格
   - 包含动作描写和心理描写
3. 风格注意事项：
   - 句式要有变化，长短句结合
   - 描写要有画面感，但不堆砌辞藻
   - 对话要符合角色身份和性格
   - 节奏要符合 ${PACE_LABELS[params.pace]} 的要求

请直接输出样章正文，不要附带任何说明文字、标题或标签。输出字数 800-1200 字。`
}

// ============ 工具函数 ============

interface ActInfo {
  act: number
  label: string
  chapterRange: [number, number]
  description: string
}

function getActDistribution(chapterCount: number): { acts: ActInfo[] } {
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

export { audienceContext, JSON_FORMAT_REQUIREMENT, getActDistribution }
