/**
 * 去除 AI 偶发输出的章节总标题。
 *
 * 章节标题属于 Chapter 元数据，由界面单独展示；正文不应携带 H1。
 * 仅在 AI 生成/续写结果入库前调用，不影响用户自行编辑的内容。
 */
export function stripLeadingChapterHeading(text: string): string {
  return text
    .trim()
    .replace(/^\s*<h1\b[^>]*>[\s\S]*?<\/h1>\s*/i, '')
    .replace(/^\s*#(?!#)\s+[^\n]+(?:\n|$)/, '')
    .trim()
}

/**
 * 将纯文本（\n\n 分隔段落）转换为 HTML（<p> 标签包裹）
 * 如果内容已经是 HTML 格式则直接返回
 */
export function plainTextToHtml(text: string): string {
  if (!text) return ''

  // 如果已经是 HTML 格式，直接返回
  if (/<p[\s>]|<br|<div|<h[1-6]|<ul|<ol|<li|<table/i.test(text)) {
    return text
  }

  // 按连续换行符分割段落
  const paragraphs = text
    .split(/\n{2,}/)
    .map(p => p.replace(/\n/g, ' ').trim())
    .filter(p => p.length > 0)

  if (paragraphs.length === 0) return ''

  return paragraphs.map(p => `<p>${p}</p>`).join('')
}
