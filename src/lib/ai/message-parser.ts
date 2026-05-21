type ParsedToolPart = {
  type: string
  state?: string
  toolName?: string
  toolCallId?: string
  input?: unknown
  output?: unknown
  errorText?: string
  approval?: {
    id: string
    approved?: boolean
    reason?: string
  }
}

type ParsedTextPart = {
  type: 'text'
  text: string
}

export interface ParsedToolInvocation {
  toolCallId: string
  toolName: string
  state?: string
  input?: unknown
  output?: unknown
  errorText?: string
  approval?: {
    id: string
    approved?: boolean
    reason?: string
  }
}

export interface ParsedMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  textContent: string
  toolParts: ParsedToolInvocation[]
  toolInputs: Array<{
    toolCallId: string
    toolName: string
    input: unknown
    state?: string
  }>
  toolApprovals: Array<{
    approvalId: string
    toolCallId: string
    toolName: string
  }>
}

function isTextPart(part: unknown): part is ParsedTextPart {
  return typeof part === 'object'
    && part !== null
    && 'type' in part
    && part.type === 'text'
    && 'text' in part
    && typeof part.text === 'string'
}

function isToolPart(part: unknown): part is ParsedToolPart {
  return typeof part === 'object'
    && part !== null
    && 'type' in part
    && typeof part.type === 'string'
    && (part.type === 'dynamic-tool' || part.type.startsWith('tool-'))
}

function getToolName(part: ParsedToolPart): string {
  return part.toolName ?? part.type.replace(/^tool-/, '')
}

export function parseMessage(message: {
  id: string
  role: 'user' | 'assistant' | 'system'
  parts?: unknown[]
}): ParsedMessage {
  const textParts: string[] = []
  const toolParts: ParsedToolInvocation[] = []
  const toolInputs: ParsedMessage['toolInputs'] = []
  const toolApprovals: ParsedMessage['toolApprovals'] = []

  message.parts?.forEach((part) => {
    if (isTextPart(part)) {
      textParts.push(part.text)
      return
    }

    if (!isToolPart(part) || !part.toolCallId) return

    const toolName = getToolName(part)
    toolParts.push({
      toolCallId: part.toolCallId,
      toolName,
      state: part.state,
      input: part.input,
      output: part.output,
      errorText: part.errorText,
      approval: part.approval,
    })

    if (part.input !== undefined) {
      toolInputs.push({
        toolCallId: part.toolCallId,
        toolName,
        input: part.input,
        state: part.state,
      })
    }

    if (part.state === 'approval-requested' && part.approval?.id) {
      toolApprovals.push({
        approvalId: part.approval.id,
        toolCallId: part.toolCallId,
        toolName,
      })
    }
  })

  return {
    id: message.id,
    role: message.role,
    textContent: textParts.join(''),
    toolParts,
    toolInputs,
    toolApprovals,
  }
}
