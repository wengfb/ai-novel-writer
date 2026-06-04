/**
 * feedback 迭代 prompt 构建工具
 *
 * 用于每个生成端点支持"全新生成"和"反馈迭代"两种模式。
 * 反馈模式：将 previousOutput 和 feedback 拼入 prompt，指示 AI 仅针对反馈进行调整。
 */

/**
 * 在基础 prompt 后追加反馈迭代指令
 */
export function appendFeedbackInstruction(
  basePrompt: string,
  previousOutput: Record<string, unknown>,
  feedback: string
): string {
  return `${basePrompt}

【重要：反馈迭代模式】
以下是上次生成的结果，请基于此进行调整而非重新生成：
\`\`\`json
${JSON.stringify(previousOutput, null, 2)}
\`\`\`

用户反馈：${feedback}

要求：
1. 仅针对反馈意见进行调整，保持其他内容不变
2. 如果反馈涉及删除某些内容，直接移除对应部分
3. 如果反馈要求增加内容，在合适位置添加
4. 输出完整 JSON，不能只输出修改部分
5. 保持原 JSON 的结构和键名完全一致`
}

/**
 * 构建请求体的 Zod schema 扩展字段描述
 */
export const FEEDBACK_FIELDS_DESCRIPTION = `
- previousOutput: 上次生成的结果（反馈迭代时传入）
- feedback: 用户反馈意见（反馈迭代时传入）
- 如果传了 previousOutput 和 feedback，进入迭代模式；否则为全新生成模式`
