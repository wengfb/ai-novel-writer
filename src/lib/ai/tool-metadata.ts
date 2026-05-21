/**
 * AI 聊天工具元数据
 * 定义每个工具的显示信息和属性
 */

export interface ToolMetadata {
  /** 工具唯一标识符 */
  id: string
  /** 显示名称 */
  displayName: string
  /** 工具描述 */
  description: string
  /** 图标（Lucide 图标名称） */
  icon: string
  /** 主题颜色 */
  color: string
  /** 是否为写操作（会修改数据） */
  isWriteOperation: boolean
}

/**
 * 所有工具的元数据配置
 */
export const TOOL_METADATA: Record<string, ToolMetadata> = {
  createCharacter: {
    id: 'createCharacter',
    displayName: '创建角色',
    description: '创建新的角色档案',
    icon: 'UserPlus',
    color: 'orange',
    isWriteOperation: true,
  },
  updateCharacter: {
    id: 'updateCharacter',
    displayName: '更新角色',
    description: '修改现有角色的信息',
    icon: 'UserCog',
    color: 'orange',
    isWriteOperation: true,
  },
  createWorldElement: {
    id: 'createWorldElement',
    displayName: '创建世界观元素',
    description: '添加新的世界观设定',
    icon: 'Globe',
    color: 'orange',
    isWriteOperation: true,
  },
  updateWorldElement: {
    id: 'updateWorldElement',
    displayName: '更新世界观元素',
    description: '修改现有世界观元素',
    icon: 'Globe',
    color: 'orange',
    isWriteOperation: true,
  },
  updateChapterContent: {
    id: 'updateChapterContent',
    displayName: '修改章节内容',
    description: '更新章节的文本内容',
    icon: 'FileEdit',
    color: 'orange',
    isWriteOperation: true,
  },
  getProjectInfo: {
    id: 'getProjectInfo',
    displayName: '查询项目信息',
    description: '获取项目的详细信息',
    icon: 'Info',
    color: 'blue',
    isWriteOperation: false,
  },
}

/**
 * 根据工具 ID 获取元数据
 */
export function getToolMetadata(toolId: string): ToolMetadata | undefined {
  return TOOL_METADATA[toolId]
}

/**
 * 判断工具是否为写操作
 */
export function isWriteOperation(toolId: string): boolean {
  return TOOL_METADATA[toolId]?.isWriteOperation ?? false
}

/**
 * 获取所有写操作工具的 ID 列表
 */
export function getWriteOperationToolIds(): string[] {
  return Object.values(TOOL_METADATA)
    .filter((meta) => meta.isWriteOperation)
    .map((meta) => meta.id)
}

/**
 * 获取所有只读工具的 ID 列表
 */
export function getReadOnlyToolIds(): string[] {
  return Object.values(TOOL_METADATA)
    .filter((meta) => !meta.isWriteOperation)
    .map((meta) => meta.id)
}
