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

### 2.2 上下文管理器 (Context Manager)
**文件**: `src/lib/ai/context-manager.ts`
**策略**: 滑动窗口 + 动态权重 + 智能检索

*   **动态权重算法**: 根据小说题材调整上下文配比。
    *   *修仙*: 世界观 30% | 章节 35% | 角色 15% (强调境界、功法一致性)
    *   *都市*: 角色 30% | 章节 40% | 世界观 10% (强调对话、人际关系)
*   **内容组成**:
    *   最近 N 章完整文本 (滑动窗口)。
    *   关键章节 (Key Chapters) 摘要。
    *   当前场景相关角色的 Snapshot。
    *   当前场景涉及的世界观规则 (WorldElement)。
    *   待回收的伏笔 (Foreshadowing)。

### 2.3 世界观一致性检查器 (World Consistency Checker)
**文件**: `src/lib/ai/world-consistency-checker.ts`

*   **功能**:
    1.  **规则冲突**: 检查新内容是否违反 `WorldElement.constraints` (如：筑基期不能飞行)。
    2.  **前后矛盾**: 对比历史描述，防止设定吃书。
    3.  **引用提醒**: 重要设定长期未出现时提醒作者。
*   **输出**: 生成冲突报告，包含 `contradiction` (矛盾 - 高优) 和 `inconsistency` (不一致 - 中优)。

### 2.4 提示词模板系统 (Prompt Template Manager)
**文件**: `src/lib/ai/prompts/template-manager.ts`

管理所有与 LLM 交互的 Prompt，支持变量插值。
*   `outline-generation`: 大纲生成
*   `chapter-generation`: 正文生成
*   `character-creation`: 角色生成
*   `world-building`: 世界观生成
*   `consistency-check`: 一致性检查

---

## 3. API 设计 (API Design)

所有 API 遵循 RESTful 风格，路径前缀 `/api`。响应格式统一为 JSON。

### 3.1 核心资源端点

| 资源 | 路径 | 方法 | 描述 |
|---|---|---|---|
| **Projects** | `/api/projects` | GET, POST | 项目列表/创建 |
| | `/api/projects/[id]` | GET, PUT, DELETE | 项目详情/更新/删除 |
| **Chapters** | `/api/projects/[id]/chapters` | GET, POST | 章节列表/创建 |
| | `/api/projects/[id]/chapters/[chId]` | GET, PUT, DELETE | 章节内容操作 |
| **Characters** | `/api/projects/[id]/characters` | GET, POST | 角色列表/创建 |
| **World** | `/api/projects/[id]/world-elements` | GET, POST | 世界观列表/创建 |
| **Outlines** | `/api/projects/[id]/outlines` | GET, POST | 大纲管理 |

### 3.2 AI 功能端点

| 功能 | 路径 | 方法 | 描述 |
|---|---|---|---|
| **生成大纲** | `/api/ai/generate/outline` | POST | 根据简介生成大纲结构 |
| **生成章节** | `/api/ai/generate/chapter` | POST | **流式响应**，生成正文 |
| **续写** | `/api/ai/continue` | POST | **流式响应**，基于光标后续写 |
| **生成设定** | `/api/ai/generate/world-element` | POST | 生成世界观条目 |
| **生成角色** | `/api/ai/generate/character` | POST | 生成角色卡 |

### 3.3 辅助功能端点

*   `/api/projects/[id]/export`: 导出 (Markdown/TXT/EPUB)
*   `/api/projects/[id]/stats`: 字数、章节数统计

详细接口定义请参考 `docs/API.md`。

---

## 4. 开发规范 (Development Standards)

### 4.1 命名规范
*   **组件文件**: `PascalCase` (e.g., `ProjectCard.tsx`)
*   **工具/API文件**: `kebab-case` (e.g., `text-processing.ts`, `route.ts`)
*   **Hooks**: `camelCase` (e.g., `useProjectStore.ts`)

### 4.2 状态管理原则
*   **Server Components**: 处理数据获取、数据库直接交互。
*   **Client Components**: 处理用户交互、表单状态、UI 动画。
*   **Zustand**: 用于跨组件的全局 UI 状态（如侧边栏折叠、当前选中的大纲节点）。

### 4.3 数据库迁移
使用 Prisma Migrate 管理变更：
```bash
npx prisma migrate dev --name <description>
```
每次修改 `schema.prisma` 后必须运行迁移并重新生成 Client。
