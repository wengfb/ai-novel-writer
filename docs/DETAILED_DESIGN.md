# 详细设计文档 (Detailed Design Document)

## 1. 数据库设计 (Database Schema)

### 1.1 ER 图 (Entity-Relationship Diagram)

```
┌──────────────┐
│   Project    │
│  (小说项目)   │
└──────┬───────┘
       │
       ├──────────────┬──────────────┬──────────────┬──────────────┐
       │              │              │              │              │
       ▼              ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Outline    │ │   Chapter    │ │  Character   │ │ WorldElement │ │Foreshadowing │
│   (大纲)     │ │   (章节)     │ │   (角色)     │ │  (世界观)    │ │   (伏笔)     │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────────────┘
       │                │                │                │
       │                │                │                ▼
       ▼                ▼                ▼         ┌──────────────┐
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │WorldSnapshot │
│  Outline     │ │    Scene     │ │CharacterSnap │ │(世界观快照)  │
│  (树形结构)  │ │   (场景)     │ │ (角色快照)   │ └──────────────┘
└──────────────┘ └──────────────┘ └──────────────┘
                       │
                       │ (埋设/回收)
                       ▼
                ┌──────────────┐
                │Foreshadowing │
                │   (伏笔)     │
                └──────────────┘
```

### 1.2 数据表详解

#### Project (小说项目)
- `id`: PK, CUID
- `title`: 标题
- `genre`: 类型 (玄幻/科幻/都市等)
- `status`: 状态 (draft/writing/completed)
- `outlineMode`: 大纲模式 (full/progressive)

#### Chapter (章节)
- `chapterNumber`: 章节号 (Unique per Project)
- `content`: 正文内容 (Markdown)
- `summary`: 摘要 (用于 AI 上下文)
- `isKeyChapter`: 是否关键章节 (影响上下文保留)

#### Character (角色)
- `name`: 姓名
- `personality`: 性格
- `role`: 角色类型 (protagonist/antagonist/supporting)
- `importance`: 重要性 (1-10)

#### WorldElement (世界观元素) - *Enhanced*
- `type`: 类型 (magic/location/history/item)
- `importance`: 重要性 (1-10)
- `scope`: 作用范围 (global/regional/local)
- `category`: 分类 (core_rule/detail/background)
- `isEvolvable`: 是否随剧情演化
- `constraints`: 约束条件 (JSON)
- `parentId`: 父元素 ID (支持树形层级)

#### WorldElementSnapshot (世界观快照) - *New*
- 追踪世界观随剧情的演化历史。
- `chapterNumber`: 发生变化的章节。
- `changeType`: 变化类型 (expansion/modification/evolution)。
- `affectedCharacters`: 受影响的角色 ID 列表。

#### CharacterSnapshot (角色快照)
- 记录角色在特定章节的状态（等级、心理、关系变化）。

#### Foreshadowing (伏笔)
- `status`: planned/planted/resolved/abandoned
- `plantedInChapterId`: 埋设章节
- `resolvedInChapterId`: 回收章节

---

## 2. 核心模块设计 (Core Modules)

### 2.1 AI 章节生成器 (Chapter Generator)
**文件**: `src/lib/ai/chapter-generator.ts`
**模式**: 递归规划 + 反思驱动

1.  **上下文构建**: 根据 `ContextManager` 获取相关角色、世界观和前文摘要。
2.  **场景规划**: AI 先分析大纲，将章节拆分为 3-5 个具体场景 (Scene)。
3.  **逐场景生成**: 对每个场景进行生成，支持流式输出。
4.  **反思优化**: 生成后进行一致性检查（是否违背人设？是否冲突？）。

### 2.2 上下文管理器 (Context Manager) - **需要深度集成**
**文件**: `src/lib/ai/context-manager.ts`
**状态**: ⚠️ 代码已实现，但未在 API 中真正使用
**策略**: 滑动窗口 + 动态权重 + 智能检索

#### 2.2.1 当前问题
- AI Chat API 只是简单拼接文本（项目信息 + 前 5 个角色）
- 没有使用 `ContextManager.buildContext()` 方法
- 没有智能筛选相关角色和世界观
- 没有应用滑动窗口机制

#### 2.2.2 改进方案

**动态权重算法**: 根据小说题材调整上下文配比。
*   *修仙*: 世界观 30% | 章节 35% | 角色 15% (强调境界、功法一致性)
*   *都市*: 角色 30% | 章节 40% | 世界观 10% (强调对话、人际关系)

**智能内容组成**:
*   最近 N 章完整文本 (滑动窗口，N 根据 token 限制动态调整)
*   关键章节 (Key Chapters) 摘要
*   **智能筛选**的相关角色 Snapshot（不是简单的前 N 个）
*   **智能筛选**的相关世界观规则（根据当前章节内容）
*   待回收的伏笔 (Foreshadowing)

#### 2.2.3 智能筛选算法

**角色相关性评分**:
```typescript
relevanceScore =
  importance * 0.3 +                    // 角色重要性
  recentAppearance * 0.4 +              // 最近出场频率
  relationshipToCurrentCharacters * 0.3 // 与当前场景角色的关系
```

**世界观相关性评分**:
```typescript
relevanceScore =
  importance * 0.3 +                    // 元素重要性
  mentionedInRecentChapters * 0.4 +    // 最近章节提及
  categoryMatch * 0.3                   // 类型匹配（核心规则优先）
```

**实现步骤**:
1. 分析当前章节内容，提取关键词和实体
2. 计算所有角色/世界观的相关性评分
3. 选择 Top-K 个最相关的元素
4. 组装成结构化上下文

### 2.3 世界观一致性检查器 (World Consistency Checker) - **待深度集成**
**文件**: `src/lib/ai/world-consistency-checker.ts`
**状态**: ⚠️ 代码已实现，但未集成到编辑器实时检查

*   **功能**:
    1.  **规则冲突**: 检查新内容是否违反 `WorldElement.constraints` (如：筑基期不能飞行)。
    2.  **前后矛盾**: 对比历史描述，防止设定吃书。
    3.  **引用提醒**: 重要设定长期未出现时提醒作者。
*   **输出**: 生成冲突报告，包含 `contradiction` (矛盾 - 高优) 和 `inconsistency` (不一致 - 中优)。

#### 2.3.1 实时一致性检查 - **待实现**

**设计目标**: 在用户编辑章节内容时，实时检测设定冲突并在 Context 面板显示警告。

**触发机制**:
- 用户在编辑器中输入内容后，延迟 2 秒触发检查（防止频繁调用）
- 用户点击"保存"时强制触发检查
- 用户切换章节时对当前章节进行检查

**检查流程**:
```
用户编辑内容 → 防抖延迟 2s
    ↓
提取当前段落文本
    ↓
调用 WorldConsistencyChecker.check()
    ↓
分析内容中的实体和行为
    ↓
对比角色能力、世界观规则、历史设定
    ↓
生成冲突报告
    ↓
在 Context 面板显示警告卡片
```

**警告卡片设计**:
```typescript
interface ConsistencyWarning {
  id: string
  type: 'contradiction' | 'inconsistency' | 'suggestion'
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  conflictingContent: string  // 冲突的文本片段
  relatedElement: {
    type: 'character' | 'world' | 'chapter'
    id: string
    name: string
  }
  suggestion?: string  // AI 建议的修改方案
}
```

**UI 展示**:
- 高优先级（contradiction）: 红色边框卡片
- 中优先级（inconsistency）: 黄色边框卡片
- 低优先级（suggestion）: 蓝色边框卡片
- 卡片内容：标题 + 描述 + 冲突文本高亮 + 相关设定链接
- 操作按钮：「查看设定」「忽略」「应用建议」

### 2.4 提示词模板系统 (Prompt Template Manager)
**文件**: `src/lib/ai/prompts/template-manager.ts`

管理所有与 LLM 交互的 Prompt，支持变量插值。
*   `outline-generation`: 大纲生成
*   `chapter-generation`: 正文生成
*   `character-creation`: 角色生成
*   `world-building`: 世界观生成
*   `consistency-check`: 一致性检查
*   `text-rewrite`: 局部重绘（待添加）

### 2.5 AI 局部重绘系统 (In-painting System) - **待实现**
**文件**: `src/lib/ai/text-rewriter.ts`
**状态**: ❌ 未实现（核心缺失功能）

#### 2.5.1 设计目标
允许用户框选编辑器中的一段文本，通过 AI 重写来改进表达，同时保留撤销历史。

#### 2.5.2 交互流程

**用户操作流程**:
```
用户在编辑器中选中文本
    ↓
右键菜单 / 工具栏显示「AI 重写」按钮
    ↓
点击后弹出风格选择面板
    ↓
选择重写风格（更黑暗/更幽默/更简练/更详细）
    ↓
AI 流式生成新文本
    ↓
实时预览替换效果（高亮显示）
    ↓
用户确认 → 替换原文 / 取消 → 保持原文
    ↓
替换后自动保存到撤销历史
```

#### 2.5.3 重写风格定义

**预设风格选项**:
1. **更黑暗 (Darker)**: 增加阴郁、紧张的氛围描写
2. **更幽默 (Humorous)**: 添加轻松、诙谐的表达
3. **更简练 (Concise)**: 删除冗余，保留核心信息
4. **更详细 (Detailed)**: 扩充细节描写，增加感官体验
5. **更正式 (Formal)**: 提升文学性，使用更典雅的措辞
6. **更口语化 (Casual)**: 使用日常对话风格

#### 2.5.4 API 设计

**端点**: `POST /api/ai/rewrite`

**请求参数**:
```typescript
{
  projectId: string
  chapterId: string
  selectedText: string      // 用户选中的原文
  style: 'darker' | 'humorous' | 'concise' | 'detailed' | 'formal' | 'casual'
  context?: {
    beforeText: string      // 选中文本前 200 字
    afterText: string       // 选中文本后 200 字
  }
}
```

**响应**: SSE 流式输出重写后的文本

#### 2.5.5 编辑器集成

**TipTap 扩展实现**:
- 添加自定义菜单项到 BubbleMenu（选中文本时显示）
- 实现文本替换的 Transaction
- 集成撤销/重做历史栈
- 添加高亮预览效果（重写文本以不同颜色显示）

**UI 组件**:
- `RewriteStyleSelector`: 风格选择面板
- `RewritePreview`: 实时预览对比组件
- `RewriteConfirmDialog`: 确认替换对话框

### 2.6 AI 工具调用系统 (AI Tool Calling System) - **待实现**
**文件**: `src/lib/ai/tool-executor.ts`, `src/components/ai/ai-action-card.tsx`
**状态**: ❌ 未实现（核心缺失功能）

#### 2.6.1 设计目标
实现智能的双模式工具调用系统：
- **预览模式**：用户主动创建时，显示卡片预览，需要确认
- **自动模式**：AI 自主维护时，后台自动保存，显示通知

#### 2.6.2 双模式架构设计

**模式 A：预览模式（Preview Mode）**
```
用户: "帮我创建一个叫李明的角色"
    ↓
AI 返回工具调用（mode: 'preview'）
    ↓
前端渲染 AIActionCard（预览状态）
    ↓
用户拖拽/点击保存
    ↓
前端调用 Store API
    ↓
UI 自动刷新
```

**模式 B：自动模式（Auto Mode）**
```
用户: "继续写第三章，李明遇到了新角色张伟"
    ↓
AI 返回工具调用（mode: 'auto'）
    ↓
前端 ToolExecutor 自动调用 Store API
    ↓
后台保存，显示 toast 通知
    ↓
UI 自动刷新
```

**关键设计决策：工具调用在前端执行**
- ✅ Store 自动更新，UI 立即刷新
- ✅ 错误处理直观，可显示用户友好提示
- ✅ 支持撤销、批量操作等高级功能
- ✅ 复用现有 API 权限验证
- ✅ 易于调试和维护

#### 2.6.3 工具调用接口定义

**AI 返回的工具调用格式**:
```typescript
interface ToolCall {
  tool: 'create_character' | 'create_world_element' | 'create_outline_node' | 'update_character'
  mode: 'preview' | 'auto'
  params: Record<string, any>
  reason?: string  // 可选：AI 解释为什么调用这个工具
}
```

**核心工具列表**:

1. **create_character** - 创建角色
   - 参数: `{ name, personality, appearance, backstory, role, importance }`
   - 预览模式：显示角色卡片
   - 自动模式：后台创建，显示 "已添加角色：{name}"

2. **create_world_element** - 创建世界观元素
   - 参数: `{ name, type, description, importance, scope, category }`
   - 预览模式：显示世界观卡片
   - 自动模式：后台创建，显示 "已添加世界观：{name}"

3. **create_outline_node** - 创建大纲节点
   - 参数: `{ title, description, order, parentId? }`
   - 预览模式：显示大纲节点卡片
   - 自动模式：后台创建，显示 "已添加大纲节点：{title}"

4. **update_character** - 更新角色信息
   - 参数: `{ characterId, updates }`
   - 仅自动模式：AI 在章节生成中发现角色变化时自动更新

5. **extract_character_from_text** - 从正文提取角色
   - 参数: `{ selectedText, contextBefore?, contextAfter? }`
   - 仅预览模式：用户选中文本后手动触发

#### 2.6.4 前端工具执行器设计

**ToolExecutor 类**:
```typescript
// src/lib/ai/tool-executor.ts
class ToolExecutor {
  async execute(toolCall: ToolCall, projectId: string) {
    const { tool, mode, params } = toolCall

    if (mode === 'preview') {
      // 预览模式：返回卡片数据，等待用户确认
      return {
        type: 'preview_card',
        tool,
        data: params,
        onSave: () => this.saveToStore(tool, params, projectId)
      }
    }

    // 自动模式：直接调用 Store API
    return await this.saveToStore(tool, params, projectId)
  }

  private async saveToStore(tool: string, params: any, projectId: string) {
    switch (tool) {
      case 'create_character':
        const char = await useCharacterStore.getState()
          .createCharacter({ projectId, ...params })
        toast.success(`已添加角色：${char.name}`)
        return { type: 'auto_saved', data: char }

      case 'create_world_element':
        const elem = await useWorldStore.getState()
          .createWorldElement({ projectId, ...params })
        toast.success(`已添加世界观：${elem.name}`)
        return { type: 'auto_saved', data: elem }

      // ... 其他工具
    }
  }
}
```

#### 2.6.5 模式判断逻辑

**AI 如何决定使用哪种模式**：

```typescript
// Prompt 中的指导规则
const modeSelectionRules = `
使用 preview 模式的场景：
- 用户明确要求创建某个元素（"帮我创建..."）
- 用户提供了详细描述，期待确认
- 单个重要元素的创建

使用 auto 模式的场景：
- 章节生成过程中出现新角色/地点
- 批量补充世界观设定
- 角色状态的自动更新
- 用户说"自动保存"或"直接添加"
`
```

**示例对话**：

| 用户输入 | AI 判断 | 模式 | 原因 |
|---------|---------|------|------|
| "帮我创建一个叫李明的角色" | 用户主动创建 | preview | 需要用户确认 |
| "继续写第三章" → AI 生成中出现新角色 | AI 自主发现 | auto | 自动维护 |
| "补充 5 个世界观设定，自动保存" | 用户明确要求自动 | auto | 批量操作 |

#### 2.6.6 预览模式卡片组件设计

**AIActionCard 组件**:
```typescript
interface AIActionCardProps {
  tool: string
  data: Record<string, any>
  onSave: () => Promise<void>
  onEdit: () => void
  onDiscard: () => void
}
```

**卡片展示**:
- 在 AI Copilot 对话流中以卡片形式嵌入
- 卡片包含：类型图标、标题、关键信息预览、操作按钮

**卡片操作**:
1. **拖拽保存**: 拖拽卡片到左侧对应列表
2. **点击保存**: 点击"保存"按钮
3. **编辑后保存**: 点击"编辑"按钮，修改后再保存
4. **丢弃**: 点击"×"按钮丢弃

#### 2.6.7 特殊功能：正文提取角色

**使用场景**: 用户在编辑器中写了一段对新角色的描写，想快速创建角色卡。

**交互流程**:
```
用户在编辑器中选中文本
    ↓
右键菜单显示"提取为角色"
    ↓
调用 extract_character_from_text 工具
    ↓
AI 分析文本，提取姓名、外貌、性格
    ↓
在 Copilot 面板显示 AIActionCard（预览模式）
    ↓
用户确认/编辑后保存
```

**API 端点**: `POST /api/ai/extract/character`

### 2.7 AI 会话管理系统 (Conversation Management) - **待实现**
**文件**: `src/lib/ai/conversation-manager.ts`
**状态**: ❌ 未实现

#### 2.7.1 设计目标
- 支持多轮对话的上下文保持
- 会话历史持久化
- 支持会话分支和回溯
- 会话与项目/章节关联

#### 2.7.2 数据模型

需要在数据库中添加新表：

```prisma
model Conversation {
  id          String   @id @default(cuid())
  projectId   String
  chapterId   String?
  title       String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  project     Project  @relation(fields: [projectId], references: [id])
  messages    Message[]
}

model Message {
  id             String   @id @default(cuid())
  conversationId String
  role           String   // 'user' | 'assistant' | 'system'
  content        String   @db.Text
  toolCalls      Json?    // 工具调用记录
  createdAt      DateTime @default(now())

  conversation   Conversation @relation(fields: [conversationId], references: [id])
}
```

#### 2.7.3 核心功能

**会话列表管理**:
- 按项目/章节分组显示会话
- 自动生成会话标题（基于首条消息）
- 支持会话重命名、删除、归档

**会话上下文保持**:
- 保存完整的对话历史
- 自动截断过长的历史（保留最近 N 条）
- 支持手动清空会话重新开始

**会话分支**:
- 用户可以从历史某条消息重新开始对话
- 创建新的分支会话
- 保留原会话不变

---

## 3. API 设计 (API Design)

所有 API 遵循 RESTful 风格，路径前缀 `/api`。响应格式统一为 JSON。

### 3.1 核心资源端点

| 资源 | 路径 | 方法 | 描述 | 状态 |
|---|---|---|---|---|
| **Projects** | `/api/projects` | GET, POST | 项目列表/创建 | ✅ 已实现 |
| | `/api/projects/[id]` | GET, PUT, DELETE | 项目详情/更新/删除 | ✅ 已实现 |
| **Chapters** | `/api/projects/[id]/chapters` | GET, POST | 章节列表/创建 | ✅ 已实现 |
| | `/api/projects/[id]/chapters/[chId]` | GET, PUT, DELETE | 章节内容操作 | ✅ 已实现 |
| **Characters** | `/api/projects/[id]/characters` | GET, POST | 角色列表/创建 | ✅ 已实现 |
| **World** | `/api/projects/[id]/world-elements` | GET, POST | 世界观列表/创建 | ✅ 已实现 |
| **Outlines** | `/api/projects/[id]/outlines` | GET, POST | 大纲管理 | ✅ 已实现 |

### 3.2 AI 功能端点

| 功能 | 路径 | 方法 | 描述 | 状态 |
|---|---|---|---|---|
| **AI 对话** | `/api/ai/chat` | POST | **流式响应**，AI 对话 | ⚠️ 基础实现 |
| **续写** | `/api/ai/continue` | POST | **流式响应**，基于光标后续写 | ⚠️ 基础实现 |
| **生成章节** | `/api/ai/generate/chapter` | POST | **流式响应**，生成正文 | ⚠️ 未集成 |
| **上下文查询** | `/api/ai/context` | GET | 获取当前上下文信息 | ✅ 已实现 |
| **生成设定** | `/api/ai/generate/world-element` | POST | 生成世界观条目 | ✅ 已实现 |
| **生成角色** | `/api/ai/generate/character` | POST | 生成角色卡 | ✅ 已实现 |
| **生成大纲** | `/api/ai/generate/outline` | POST | 根据简介生成大纲结构 | ✅ 已实现 |
| **局部重绘** | `/api/ai/rewrite` | POST | **流式响应**，重写选中文本 | ❌ 未实现 |
| **一致性检查** | `/api/ai/consistency-check` | POST | 检查内容与设定冲突 | ❌ 未实现 |
| **提取角色** | `/api/ai/extract/character` | POST | 从正文提取角色信息 | ❌ 未实现 |

### 3.3 会话管理端点 - **待实现**

| 功能 | 路径 | 方法 | 描述 | 状态 |
|---|---|---|---|---|
| **会话列表** | `/api/conversations` | GET | 获取所有会话 | ❌ 未实现 |
| **创建会话** | `/api/conversations` | POST | 创建新会话 | ❌ 未实现 |
| **会话详情** | `/api/conversations/[id]` | GET | 获取会话历史 | ❌ 未实现 |
| **删除会话** | `/api/conversations/[id]` | DELETE | 删除会话 | ❌ 未实现 |
| **会话分支** | `/api/conversations/[id]/branch` | POST | 从某条消息创建分支 | ❌ 未实现 |

### 3.4 辅助功能端点

*   `/api/projects/[id]/export`: 导出 (Markdown/TXT/EPUB) - ✅ 已实现
*   `/api/projects/[id]/stats`: 字数、章节数统计 - ✅ 已实现
*   `/api/settings`: 系统设置管理 - ✅ 已实现

详细接口定义请参考 `docs/API.md`。

---

## 4. 前端界面设计 (Frontend UI Design)

### 4.1 项目选择/切换界面 - **待实现**
**状态**: ❌ 未实现（核心缺失功能）

#### 4.1.1 设计目标
- 提供直观的项目选择入口
- 支持快速切换项目
- 显示项目基本信息和进度

#### 4.1.2 界面方案

**方案 A: 下拉选择器（推荐）**
- 位置：Studio Header 左上角
- 样式：类似 VS Code 的文件夹选择器
- 内容：项目名称 + 类型标签 + 字数进度
- 交互：点击展开下拉列表，支持搜索过滤

**方案 B: 侧边栏顶部**
- 位置：左侧边栏最顶部
- 样式：卡片式展示当前项目
- 内容：项目封面 + 标题 + 进度条
- 交互：点击弹出项目列表对话框

### 4.2 设置界面 - **待实现**
**状态**: ❌ 未实现（核心缺失功能）

#### 4.2.1 设计目标
- 提供系统配置入口
- 管理 API Key 和模型选择
- 配置 AI 生成参数

#### 4.2.2 设置项分类

**AI 配置**:
- Gemini API Key 输入框
- 模型选择（Flash/Pro）
- 默认生成参数（温度、最大 Token）

**界面配置**:
- 主题切换（深色/浅色）
- 字体大小调整
- 编辑器配置

**项目默认值**:
- 默认小说类型
- 默认章节字数
- 自动保存间隔

### 4.3 项目启动与构思界面 - **待实现**
**状态**: ❌ 未实现（核心缺失功能）

#### 4.3.1 设计目标
- 降低创作门槛，引导用户快速开始
- 通过 AI 辅助完成项目初始化
- 自动生成初始大纲和世界观

#### 4.3.2 交互流程

**步骤 1: 欢迎对话**
- 首次进入或点击"新建项目"时触发
- 全屏对话框，中心显示："你想写个什么故事？"
- 提供文本输入框，支持多行输入
- 示例提示："例如：一个修仙者在现代都市的故事"

**步骤 2: AI 脑暴**
- 用户输入想法后，AI 分析并生成 3 个创意方向
- 每个方向包含：
  - 故事标题建议
  - 核心冲突描述
  - 主角设定
  - 结局走向（开放式/悲剧/喜剧）
- 卡片式展示，支持选择或修改

**步骤 3: 自动生成**
- 用户选择方向后，AI 自动生成：
  - 初始大纲（3-5 个章节节点）
  - 核心世界观元素（2-3 个）
  - 主要角色（1-2 个）
- 显示生成进度，支持取消

**步骤 4: 确认创建**
- 预览生成的内容
- 允许用户修改项目名称和类型
- 点击"开始创作"进入 Studio 界面

---

## 5. 开发规范 (Development Standards)

### 5.1 命名规范
*   **组件文件**: `PascalCase` (e.g., `ProjectCard.tsx`)
*   **工具/API文件**: `kebab-case` (e.g., `text-processing.ts`, `route.ts`)
*   **Hooks**: `camelCase` (e.g., `useProjectStore.ts`)

### 5.2 状态管理原则
*   **Server Components**: 处理数据获取、数据库直接交互。
*   **Client Components**: 处理用户交互、表单状态、UI 动画。
*   **Zustand**: 用于跨组件的全局 UI 状态（如侧边栏折叠、当前选中的大纲节点）。

### 5.3 数据库迁移
使用 Prisma Migrate 管理变更：
```bash
npx prisma migrate dev --name <description>
```
每次修改 `schema.prisma` 后必须运行迁移并重新生成 Client。
