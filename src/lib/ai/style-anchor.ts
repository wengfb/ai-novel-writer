import { prisma } from '@/lib/db/prisma'

const STYLE_ANCHOR_HEADER = `## 写作风格锚点
请严格模仿以下样章的写作风格，包括但不限于：句式节奏、修辞偏好、
描写密度、对话风格、段落组织方式。但不复制其具体情节和内容。

【样章开始】`

const STYLE_ANCHOR_FOOTER = '【样章结束】'

function formatStyleAnchor(text: string): string {
  return `${STYLE_ANCHOR_HEADER}
${text}
${STYLE_ANCHOR_FOOTER}`
}

export async function getStyleAnchorPrompt(projectId?: string): Promise<string> {
  const keys: string[] = []
  if (projectId) {
    keys.push(`project.${projectId}.styleAnchor`)
  }
  keys.push('styleAnchor.default')

  const rows = await prisma.systemSetting.findMany({
    where: { key: { in: keys } },
    select: { key: true, value: true },
  })

  if (rows.length === 0) return ''

  // 项目级优先
  const keyMap = new Map(rows.map(r => [r.key, r.value]))

  const text = projectId
    ? (keyMap.get(`project.${projectId}.styleAnchor`) || keyMap.get('styleAnchor.default') || '')
    : (keyMap.get('styleAnchor.default') || '')

  return text.trim() ? formatStyleAnchor(text.trim()) : ''
}
