import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { apiSuccess, ApiErrors, withErrorHandler } from '@/lib/api/response'
import { validateRequest } from '@/lib/api/validators'
import { z } from 'zod'

/**
 * 导出 API
 * POST /api/projects/[projectId]/export
 */

// 导出请求 Schema
const ExportSchema = z.object({
  format: z.enum(['markdown', 'txt'], {
    errorMap: () => ({ message: '无效的导出格式' }),
  } as any),
  includeOutlines: z.boolean().optional().default(false),
  includeCharacters: z.boolean().optional().default(false),
  includeWorldElements: z.boolean().optional().default(false),
  chapterRange: z.tuple([z.number().int().positive(), z.number().int().positive()]).optional(),
})

/**
 * POST /api/projects/[projectId]/export
 * 导出项目
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  return withErrorHandler(async () => {
    const { projectId } = await params

    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return ApiErrors.projectNotFound()
    }

    // 验证请求数据
    const data = validateRequest(ExportSchema, await request.json())

    const {
      format,
      includeOutlines,
      includeCharacters,
      includeWorldElements,
      chapterRange,
    } = data

    // 获取项目数据
    const [chapters, outlines, characters, worldElements] = await Promise.all([
      prisma.chapter.findMany({
        where: {
          projectId,
          ...(chapterRange && {
            chapterNumber: {
              gte: chapterRange[0],
              lte: chapterRange[1],
            },
          }),
        },
        orderBy: { chapterNumber: 'asc' },
      }),
      includeOutlines
        ? prisma.outline.findMany({
            where: { projectId },
            orderBy: { order: 'asc' },
          })
        : [],
      includeCharacters
        ? prisma.character.findMany({
            where: { projectId },
          })
        : [],
      includeWorldElements
        ? prisma.worldElement.findMany({
            where: { projectId },
          })
        : [],
    ])

    // 生成导出内容
    let content = ''

    if (format === 'markdown') {
      content = generateMarkdown(project, chapters, outlines, characters, worldElements, {
        includeOutlines,
        includeCharacters,
        includeWorldElements,
      })
    } else if (format === 'txt') {
      content = generateTxt(project, chapters, outlines, characters, worldElements, {
        includeOutlines,
        includeCharacters,
        includeWorldElements,
      })
    }

    // 返回文件内容
    const filename = `${project.title}_${new Date().toISOString().split('T')[0]}.${format}`

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': format === 'markdown' ? 'text/markdown; charset=utf-8' : 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    })
  })
}

/**
 * 生成 Markdown 格式
 */
function generateMarkdown(
  project: any,
  chapters: any[],
  outlines: any[],
  characters: any[],
  worldElements: any[],
  options: {
    includeOutlines: boolean
    includeCharacters: boolean
    includeWorldElements: boolean
  }
): string {
  const lines: string[] = []

  // 标题
  lines.push(`# ${project.title}\n`)
  if (project.description) {
    lines.push(`${project.description}\n`)
  }
  lines.push(`**类型**：${project.genre}  |  **状态**：${project.status}\n`)
  lines.push(`---\n`)

  // 大纲
  if (options.includeOutlines && outlines.length > 0) {
    lines.push(`## 大纲\n`)
    for (const outline of outlines) {
      const indent = '  '.repeat(outline.type === 'scene' ? 2 : outline.type === 'chapter' ? 1 : 0)
      lines.push(`${indent}- ${outline.title}`)
      if (outline.description) {
        lines.push(`${indent}  ${outline.description}`)
      }
    }
    lines.push(`\n`)
  }

  // 角色
  if (options.includeCharacters && characters.length > 0) {
    lines.push(`## 角色\n`)
    for (const char of characters) {
      lines.push(`### ${char.name}\n`)
      if (char.nickname) lines.push(`**昵称**：${char.nickname}\n`)
      if (char.age || char.gender) lines.push(`**年龄**：${char.age || '?'}  |  **性别**：${char.gender || '?'}\n`)
      if (char.appearance) lines.push(`**外貌**：${char.appearance}\n`)
      if (char.personality && char.personality.length > 0) {
        lines.push(`**性格**：${char.personality.join('、')}\n`)
      }
      if (char.backstory) lines.push(`**背景**：${char.backstory}\n`)
      if (char.motivation) lines.push(`**动机**：${char.motivation}\n`)
      lines.push(`\n`)
    }
  }

  // 世界观
  if (options.includeWorldElements && worldElements.length > 0) {
    lines.push(`## 世界观设定\n`)
    for (const element of worldElements) {
      lines.push(`### ${element.name} (${element.type})\n`)
      if (element.description) {
        lines.push(`${element.description}\n`)
      }
      if (element.attributes && Object.keys(element.attributes).length > 0) {
        lines.push(`**属性**：\n`)
        for (const [key, value] of Object.entries(element.attributes)) {
          lines.push(`- ${key}: ${value}\n`)
        }
      }
      if (element.rules && element.rules.length > 0) {
        lines.push(`**规则**：\n`)
        for (const rule of element.rules) {
          lines.push(`- ${rule}\n`)
        }
      }
      lines.push(`\n`)
    }
  }

  // 正文
  lines.push(`---\n`)
  lines.push(`## 正文\n`)
  for (const chapter of chapters) {
    lines.push(`### ${chapter.title}\n\n`)
    if (chapter.content) {
      lines.push(`${chapter.content}\n\n`)
    }
    lines.push(`\n`)
  }

  return lines.join('')
}

/**
 * 生成 TXT 格式
 */
function generateTxt(
  project: any,
  chapters: any[],
  outlines: any[],
  characters: any[],
  worldElements: any[],
  options: {
    includeOutlines: boolean
    includeCharacters: boolean
    includeWorldElements: boolean
  }
): string {
  const lines: string[] = []

  // 标题
  lines.push(`${project.title}`)
  lines.push(''.padEnd(project.title.length, '='))
  if (project.description) {
    lines.push(`${project.description}`)
  }
  lines.push(`类型：${project.genre} | 状态：${project.status}`)
  lines.push('')

  // 大纲
  if (options.includeOutlines && outlines.length > 0) {
    lines.push('[大纲]')
    for (const outline of outlines) {
      const indent = '  '.repeat(outline.type === 'scene' ? 2 : outline.type === 'chapter' ? 1 : 0)
      lines.push(`${indent}- ${outline.title}`)
    }
    lines.push('')
  }

  // 角色
  if (options.includeCharacters && characters.length > 0) {
    lines.push('[角色]')
    for (const char of characters) {
      lines.push(`${char.name}`)
      if (char.nickname) lines.push(`  昵称: ${char.nickname}`)
      if (char.backstory) lines.push(`  背景: ${char.backstory}`)
    }
    lines.push('')
  }

  // 正文
  lines.push(''.padEnd(50, '-'))
  lines.push('')
  for (const chapter of chapters) {
    lines.push(`${chapter.title}`)
    lines.push(''.padEnd(chapter.title.length, '-'))
    lines.push('')
    if (chapter.content) {
      lines.push(`${chapter.content}`)
    }
    lines.push('')
    lines.push('')
  }

  return lines.join('\n')
}
