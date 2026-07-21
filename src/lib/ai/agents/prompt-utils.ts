/**
 * 提示词模板工具
 * 与旧 PromptTemplateManager 的 {var} 语义兼容，供 Agent 运行时统一使用
 */

/** 插值变量表 */
export type PromptVariables = Record<string, unknown>

/**
 * 将模板中的 {key} 替换为 variables[key]
 * - 缺失变量保留原占位符，避免静默丢内容
 * - 对象/数组会 JSON 美化后嵌入
 *
 * @param template 含 {var} 的模板字符串
 * @param variables 运行时变量
 */
export function interpolatePrompt(template: string, variables: PromptVariables = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = variables[key]
    if (value === undefined || value === null) return match
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2)
      } catch {
        return String(value)
      }
    }
    return String(value)
  })
}

/**
 * 规范化提示词文本：统一换行并去掉首尾空白
 * 用于保存时与默认值比对（isCustom）
 */
export function normalizePromptContent(content: string): string {
  return content.replace(/\r\n/g, '\n').trim()
}
