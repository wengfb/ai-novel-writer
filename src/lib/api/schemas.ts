import { z } from 'zod'

/**
 * 项目相关验证 Schema
 */
export const CreateProjectSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题最多200个字符'),
  description: z.string().optional(),
  genre: z.enum(['玄幻', '科幻', '都市', '言情', '武侠', '历史', '其他'], {
    errorMap: () => ({ message: '无效的小说类型' }),
  } as any),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'writing', 'completed']).optional(),
})

export const UpdateProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  genre: z.enum(['玄幻', '科幻', '都市', '言情', '武侠', '历史', '其他']).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'writing', 'completed']).optional(),
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
  chapterTitle: z.string().min(1).max(200),
  chapterOutline: z.string().min(10, '章节大纲至少10个字符'),
  targetWords: z.number().int().positive().default(3000),
  model: z.string().optional(),
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

export const GenerateWorldElementSchema = z.object({
  projectId: z.string().cuid('无效的项目ID'),
  elementType: z.enum(['location', 'history', 'magic', 'organization', 'item', 'other']),
  storyContext: z.string().min(10, '故事背景至少10个字符'),
  requirements: z.string().optional(),
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
})
