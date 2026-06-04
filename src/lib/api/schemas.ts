import { z } from 'zod'

export const OutlinePlotFunctionValues = ['推进', '转折', '铺垫', '高潮', '过渡'] as const

/**
 * 项目相关验证 Schema
 */
export const CreateProjectSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题最多200个字符'),
  description: z.string().optional(),
  genre: z.enum(['玄幻', '科幻', '都市', '言情', '武侠', '历史', '其他']),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'writing', 'completed']).optional(),
})

export const UpdateProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  genre: z.enum(['玄幻', '科幻', '都市', '言情', '武侠', '历史', '其他']).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'writing', 'completed']).optional(),
  coverImage: z.string().optional(),
  outlineMode: z.enum(['full', 'progressive']).optional(),
  planningRange: z.number().int().positive().optional(),
})

export const ProjectQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(['draft', 'writing', 'completed']).optional(),
  genre: z.string().optional(),
})

/**
 * 章节相关验证 Schema
 */
export const CreateChapterSchema = z.object({
  chapterNumber: z.number().int().positive('章节号必须是正整数'),
  title: z.string().min(1, '标题不能为空').max(200, '标题最多200个字符'),
  content: z.string().optional(),
  summary: z.string().optional(),
  notes: z.string().optional(),
})

export const UpdateChapterSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  summary: z.string().optional(),
  notes: z.string().optional(),
})

export const ChapterQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  orderBy: z.enum(['chapterNumber', 'createdAt', 'updatedAt']).default('chapterNumber'),
  order: z.enum(['asc', 'desc']).default('asc'),
})

/**
 * AI 生成相关验证 Schema
 */
export const GenerateOutlineSchema = z.object({
  projectId: z.string().cuid('无效的项目ID'),
  genre: z.enum(['玄幻', '科幻', '都市', '言情', '武侠', '历史', '其他']),
  coreIdea: z.string().min(10, '核心创意至少10个字符'),
  style: z.string().optional(),
  targetWords: z.number().int().positive().default(100000),
  chapterCount: z.number().int().positive().max(200).default(50),
  model: z.string().optional(),
})

export const GenerateChapterSchema = z.object({
  projectId: z.string().cuid('无效的项目ID'),
  chapterNumber: z.number().int().positive(),
  chapterTitle: z.string().max(200).optional(),
  chapterOutline: z.string().optional(),
  targetWords: z.number().int().positive().default(3000),
  model: z.string().optional(),
  emotionalGoal: z.string().optional(),
  plotFunction: z.enum(OutlinePlotFunctionValues).optional(),
  tensionLevel: z.number().int().min(1).max(10).optional(),
})

export const ContinueChapterSchema = z.object({
  projectId: z.string().cuid('无效的项目ID'),
  chapterId: z.string().cuid('无效的章节ID'),
  currentContent: z.string().min(1, '当前内容不能为空'),
  targetWords: z.number().int().positive().default(1000),
  model: z.string().optional(),
})

export const GenerateCharacterSchema = z.object({
  projectId: z.string().cuid('无效的项目ID'),
  role: z.string().min(1, '角色不能为空'),
  storyContext: z.string().min(10, '故事背景至少10个字符'),
  requirements: z.string().optional(),
})

export const RewriteSchema = z.object({
  projectId: z.string().cuid('无效的项目ID'),
  chapterId: z.string().cuid('无效的章节ID'),
  selectedText: z.string().min(1, '选中的文本不能为空').max(5000, '选中的文本过长'),
  style: z.enum(['更黑暗', '更幽默', '更简练', '更详细', '更正式', '更口语化']),
  fullChapterContent: z.string().min(1, '章节内容不能为空'),
  model: z.string().optional(),
})

export const GenerateWorldElementSchema = z.object({
  projectId: z.string().cuid('无效的项目ID'),
  elementType: z.enum(['location', 'history', 'magic', 'organization', 'item', 'other']),
  storyContext: z.string().min(10, '故事背景至少10个字符'),
  requirements: z.string().optional(),
})

/**
 * onboarding 初始化相关 Schema
 */
export const StoryIdeaCardSchema = z.object({
  id: z.string().min(1, '创意卡片ID不能为空'),
  title: z.string().min(1, '创意标题不能为空').max(200, '创意标题最多200个字符'),
  genre: z.string().min(1, '题材不能为空'),
  worldBuilding: z.string().min(1, '世界观不能为空'),
  protagonist: z.string().min(1, '主角不能为空'),
  coreConflict: z.string().min(1, '核心冲突不能为空'),
  mainGoal: z.string().min(1, '主线目标不能为空'),
  highConcept: z.string().min(1, '高概念梗概不能为空'),
  sublimation: z.string().min(1, '内容升华不能为空'),
  openingHook: z.string().min(1, '开篇切入点不能为空'),
})

/**
 * onboarding 初始化请求 Schema（v2 — 拆分为 6 步生成管线）
 */
export const BootstrapOnboardingSchema = z.object({
  projectTitle: z.string().min(1, '项目名称不能为空').max(200, '项目名称最多200个字符'),
  idea: StoryIdeaCardSchema,
  targetWords: z.number().int().min(200000, '目标字数至少20万字').max(20000000, '目标字数最多2000万字').default(1000000),
  pace: z.enum(['fast', 'medium', 'slow']).default('medium'),
  audience: z.string().optional(),
  tone: z.string().optional(),
  model: z.string().optional(),
})

export const GeneratedOutlineCharacterSchema = z.object({
  name: z.string().min(1, '角色名不能为空'),
  role: z.string().optional(),
  description: z.string().optional(),
  personality: z.union([z.string(), z.array(z.string())]).optional(),
  goal: z.string().optional(),
})

export const GeneratedOutlineWorldSettingSchema = z.object({
  type: z.string().optional(),
  name: z.string().min(1, '设定名称不能为空'),
  description: z.string().optional(),
})

export const GeneratedOutlineChapterSchema = z.object({
  chapterNumber: z.number().int().positive().optional(),
  title: z.string().optional(),
  summary: z.string().optional(),
  emotionalGoal: z.string().optional(),
  plotFunction: z.enum(OutlinePlotFunctionValues).optional(),
  tensionLevel: z.number().int().min(1).max(10).optional(),
  keyEvents: z.array(z.string()).optional(),
  characters: z.array(z.string()).optional(),
  estimatedWords: z.number().int().positive().optional(),
})

export const GeneratedOnboardingOutlineSchema = z.object({
  storySummary: z.string().min(1, '故事梗概不能为空'),
  mainConflict: z.string().optional(),
  suggestedTotalWords: z.number().int().positive().optional(),
  wordCountRationale: z.string().optional(),
  characters: z.array(GeneratedOutlineCharacterSchema).min(1, '至少需要 1 个角色'),
  worldSettings: z.array(GeneratedOutlineWorldSettingSchema).min(1, '至少需要 1 个世界观设定'),
  chapters: z.array(GeneratedOutlineChapterSchema).min(1, '至少需要 1 个章节规划'),
  plotTwists: z.array(z.object({
    chapterNumber: z.number().int().positive().optional(),
    description: z.string().optional(),
  })).optional(),
})

/**
 * 角色相关验证 Schema
 */
export const CreateCharacterSchema = z.object({
  name: z.string().min(1, '姓名不能为空').max(100),
  nickname: z.string().max(50).optional(),
  age: z.number().int().positive().optional(),
  gender: z.string().max(20).optional(),
  appearance: z.string().optional(),
  personality: z.string().optional(),
  backstory: z.string().optional(),
  motivation: z.string().optional(),
  dialogueStyle: z.string().optional(),
  relationships: z.string().optional(),
  characterArc: z.string().optional(),
})

/**
 * 世界观相关验证 Schema
 */
export const CreateWorldElementSchema = z.object({
  type: z.enum(['location', 'history', 'magic', 'organization', 'item', 'other']),
  name: z.string().min(1, '名称不能为空').max(200),
  description: z.string().min(1, '描述不能为空'),
  attributes: z.string().optional(),
  relatedTo: z.string().optional(),
  references: z.string().optional(),
})

/**
 * 大纲相关验证 Schema
 */
export const CreateOutlineSchema = z.object({
  type: z.enum(['volume', 'chapter', 'scene']),
  order: z.number().int().positive(),
  title: z.string().min(1, '标题不能为空').max(200),
  description: z.string().optional(),
  targetWords: z.number().int().positive().optional(),
  parentId: z.string().cuid().optional(),
  chapterId: z.string().cuid().optional(),
  status: z.enum(['planned', 'writing', 'completed']).optional(),
  emotionalGoal: z.string().optional(),
  plotFunction: z.enum(OutlinePlotFunctionValues).optional(),
  tensionLevel: z.number().int().min(1).max(10).optional(),
})
