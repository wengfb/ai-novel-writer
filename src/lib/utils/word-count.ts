/**
 * 统计文本字数：中文字符按字计，英文按单词计。
 * 若内容含 HTML（如 TipTap 输出），会先去除标签再统计。
 */
export function countWords(text: string): number {
  const plainText = text.replace(/<[^>]*>/g, '')
  const chineseChars = (plainText.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishWords = (plainText.match(/[a-zA-Z]+/g) || []).length
  return chineseChars + englishWords
}
