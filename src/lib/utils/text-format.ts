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
