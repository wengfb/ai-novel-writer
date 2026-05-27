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
  createChapter: {
    id: 'createChapter',
    displayName: '创建章节',
    description: '创建新的章节',
    icon: 'FilePlus',
    color: 'orange',
    isWriteOperation: true,
  },
  createOutline: {
    id: 'createOutline',
    displayName: '创建大纲',
    description: '添加新的大纲节点',
    icon: 'ListTree',
    color: 'orange',
    isWriteOperation: true,
  },
  updateOutline: {
    id: 'updateOutline',
    displayName: '更新大纲',
    description: '修改现有大纲节点',
    icon: 'ListTree',
    color: 'orange',
    isWriteOperation: true,
  },
  createForeshadowing: {
    id: 'createForeshadowing',
    displayName: '创建伏笔',
    description: '记录新的伏笔信息',
    icon: 'Eye',
    color: 'orange',
    isWriteOperation: true,
  },
  resolveForeshadowing: {
    id: 'resolveForeshadowing',
    displayName: '回收伏笔',
    description: '标记伏笔已被回收',
    icon: 'CheckCircle',
    color: 'orange',
    isWriteOperation: true,
  },
  listForeshadowings: {
    id: 'listForeshadowings',
    displayName: '查询伏笔',
    description: '查看伏笔列表',
    icon: 'List',
    color: 'blue',
    isWriteOperation: false,
  },
  checkWorldConsistency: {
    id: 'checkWorldConsistency',
    displayName: '一致性检查',
    description: '检查章节与世界观设定的一致性',
    icon: 'ScanSearch',
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
