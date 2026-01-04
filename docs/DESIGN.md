# AI 写小说应用 - 系统设计文档

## 📋 文档信息

- **项目名称**：AI Novel Writer
- **版本**：v1.0.0
- **更新日期**：2025-01-04
- **技术栈**：Next.js 15 + TypeScript + Prisma + Gemini AI

---

## 📐 目录

1. [系统概述](#系统概述)
2. [技术架构](#技术架构)
3. [数据库设计](#数据库设计)
4. [核心模块设计](#核心模块设计)
5. [API 设计](#api-设计)
6. [UI/UX 设计](#uiux-设计)
7. [安全设计](#安全设计)
8. [性能设计](#性能设计)

---

## 系统概述

### 项目目标

开发一个面向开发者的 AI 辅助小说创作应用，实现从大纲到人设、世界观、章节的完整自动化创作流程。

### 核心特性

- ✅ **AI 全自动生成**：基于 Gemini 2.5 Pro/Flash
- ✅ **长文本连贯性**：1M tokens 上下文窗口
- ✅ **递归规划+反思**：保证内容质量
- ✅ **完整创作流程**：大纲 → 人设 → 世界观 → 章节
- ✅ **本地部署**：SQLite 零配置

### 使用场景

1. **长篇小说创作**：10万字以上的长篇网络小说
2. **多类型支持**：玄幻、科幻、都市、言情等
3. **个人生产力**：开发者个人使用，快速生成内容

---

## 技术架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        前端层 (Frontend)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 项目列表页   │  │ 编辑器界面   │  │ 设置管理页   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────────┐
│              Next.js 15 App Router (RSC + SSR)               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Server Components (数据获取、SEO、初始渲染)         │    │
│  │  Client Components (交互、实时更新、流式输出)        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────────┐
│                      API Routes Layer                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │项目管理API│ │章节管理API│ │AI生成API │ │导出API   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────────┐
│                       业务逻辑层 (Business Logic)             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ 章节生成器  │  │上下文管理器 │  │提示词模板   │        │
│  │(反思驱动)   │  │(滑动窗口)   │  │(9种模板)    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                          ↕
┌──────────────────┬──────────────────┬──────────────────────┐
│  数据持久化层     │   AI服务集成层    │   文件存储层         │
│ ┌──────────────┐ │ ┌──────────────┐ │ ┌────────────────┐  │
│ │ Prisma +     │ │ │ Gemini 2.5   │ │ │ 本地文件系统   │  │
│ │ SQLite       │ │ │ Flash/Pro    │ │ │ 导出文件       │  │
│ └──────────────┘ │ └──────────────┘ │ └────────────────┘  │
└──────────────────┴──────────────────┴──────────────────────┘
```

### 技术栈选型

| 层级 | 技术选型 | 版本 | 理由 |
|-----|---------|------|------|
| 前端框架 | Next.js | 15 | 最新 App Router，RSC 性能优化 |
| 编程语言 | TypeScript | 5.x | 类型安全，提升代码质量 |
| UI 组件库 | shadcn/ui | 最新 | 基于 Radix UI，高度可定制 |
| 样式方案 | Tailwind CSS | 3.x | 原子化 CSS，开发效率高 |
| 状态管理 | Zustand | 4.x | 轻量简洁，与 App Router 配合良好 |
| 数据库 ORM | Prisma | 5.x | 类型安全，迁移管理优秀 |
| 数据库 | SQLite → PostgreSQL | - | 开发零配置，生产可升级 |
| 编辑器 | TipTap | 2.x | ProseMirror 基于，可扩展性强 |
| AI SDK | Vercel AI SDK | 3.x | 流式输出，多模型统一接口 |
| AI 模型 | Gemini 2.5 | - | 1M tokens 上下文，性价比高 |
| 表单处理 | React Hook Form | 7.x | 性能优秀，类型验证 |
| 数据验证 | Zod | 3.x | TypeScript 原生支持 |

### 目录结构

```
ai-novel-writer/
├── docs/                          # 📚 文档目录
│   ├── DESIGN.md                  # 系统设计文档（本文档）
│   ├── API.md                     # API 接口文档
│   ├── DEVELOPMENT.md             # 开发指南
│   └── PROGRESS.md                # 开发进度追踪
├── prisma/
│   └── schema.prisma              # ✅ 数据模型定义
├── public/                        # 静态资源
├── src/
│   ├── app/                       # ✅ Next.js App Router
│   │   ├── (dashboard)/           # 仪表盘路由组
│   │   │   ├── layout.tsx         # 仪表盘布局
│   │   │   ├── page.tsx           # 项目列表
│   │   │   └── projects/[id]/     # 项目详情路由
│   │   ├── api/                   # API Routes
│   │   │   ├── projects/          # 项目管理API
│   │   │   ├── chapters/          # 章节管理API
│   │   │   ├── ai/                # AI生成API
│   │   │   └── export/            # 导出API
│   │   ├── layout.tsx             # 根布局
│   │   └── page.tsx               # 首页
│   ├── components/
│   │   ├── ui/                    # ✅ shadcn/ui 组件（15个）
│   │   ├── editor/                # 编辑器组件（待实现）
│   │   ├── project/               # 项目组件（待实现）
│   │   ├── character/             # 角色组件（待实现）
│   │   ├── world/                 # 世界观组件（待实现）
│   │   └── ai/                    # AI交互组件（待实现）
│   ├── lib/                       # ✅ 核心逻辑层
│   │   ├── ai/
│   │   │   ├── providers/
│   │   │   │   └── gemini.ts      # ✅ Gemini 提供者
│   │   │   ├── prompts/
│   │   │   │   └── template-manager.ts  # ✅ 提示词管理
│   │   │   ├── context-manager.ts # ✅ 上下文管理器
│   │   │   └── chapter-generator.ts # ✅ 章节生成器
│   │   ├── db/
│   │   │   └── prisma.ts          # ✅ Prisma 客户端
│   │   └── utils/                 # 工具函数（待补充）
│   ├── types/
│   │   └── index.ts               # ✅ 类型定义
│   └── hooks/                     # 自定义 Hooks（待实现）
├── .env.example                   # ✅ 环境变量示例
├── .env.local                     # ✅ 环境变量配置
├── next.config.ts                 # ✅ Next.js 配置
├── tailwind.config.ts             # ✅ Tailwind 配置
├── tsconfig.json                  # ✅ TypeScript 配置
└── package.json                   # ✅ 依赖配置
```

---

## 数据库设计

### ER 图

```
┌──────────────┐
│   Project    │
│  (小说项目)   │
└──────┬───────┘
       │
       ├──────────────┬──────────────┬──────────────┐
       │              │              │              │
       ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Outline    │ │   Chapter    │ │  Character   │ │ WorldElement │
│   (大纲)     │ │   (章节)     │ │   (角色)     │ │  (世界观)    │
└──────┬───────┘ └──────┬───────┘ └──────────────┘ └──────────────┘
       │                │
       │                │
       ▼                ▼
┌──────────────┐ ┌──────────────┐
│  Outline     │ │    Scene     │
│  (树形结构)  │ │   (场景)     │
└──────────────┘ └──────────────┘

┌──────────────┐
│ Generation   │
│ (AI生成记录) │
└──────────────┘
```

### 数据表详解

#### 1. Project（小说项目）

**字段说明**：
- `id`: 项目唯一标识（CUID）
- `title`: 小说标题
- `description`: 项目简介
- `genre`: 小说类型（玄幻/科幻/都市/言情等）
- `tags`: 标签（JSON 数组字符串）
- `status`: 状态（draft/writing/completed）
- `totalWords`: 总字数（统计字段）
- `chapterCount`: 章节数量（统计字段）

**索引**：
- `status`: 用于按状态筛选
- `genre`: 用于按类型筛选

**关系**：
- 1:N → Outline
- 1:N → Chapter
- 1:N → Character
- 1:N → WorldElement
- 1:N → Generation

#### 2. Chapter（章节）

**字段说明**：
- `chapterNumber`: 章节编号（从1开始）
- `content`: 章节内容（Markdown 格式）
- `wordCount`: 字数统计
- `summary`: 章节摘要（用于上下文）
- `notes`: 作者笔记

**约束**：
- `UNIQUE(projectId, chapterNumber)`: 每个项目的章节编号唯一

**关系**：
- N:1 → Project
- 1:1 → Outline（可选）
- 1:N → Scene

#### 3. Character（角色）

**字段说明**：
- `name`: 角色姓名
- `personality`: 性格特点
- `dialogueStyle`: 对话风格
- `relationships`: 关系图谱（JSON 字符串）
- `characterArc`: 角色弧光规划

**关系**：
- N:1 → Project

#### 4. WorldElement（世界观元素）

**字段说明**：
- `type`: 元素类型（location/history/magic/organization/item/other）
- `attributes`: 动态属性（JSON 字符串）
- `relatedTo`: 关联关系（JSON 字符串）
- `references`: 引用记录（JSON 字符串）

**索引**：
- `type`: 用于按类型筛选世界观元素

#### 5. Outline（大纲）

**字段说明**：
- `type`: 节点类型（volume/chapter/scene）
- `order`: 排序序号
- `parentId`: 父节点 ID（自关联）
- `chapterId`: 关联章节 ID（可选）

**树形结构**：
- 支持无限层级嵌套
- 根节点：卷（volume）
- 二级节点：章（chapter）
- 三级节点：场景（scene）

#### 6. Generation（AI生成记录）

**用途**：
- 成本追踪
- 历史回溯
- 质量分析

**字段说明**：
- `provider`: AI 提供商（google/openai/claude）
- `model`: 模型名称（gemini-2.5-flash 等）
- `tokensUsed`: Token 使用情况（JSON）
- `cost`: 成本估算（美元）

---

## 核心模块设计

### 1. AI 章节生成器 ⭐

**文件**：`src/lib/ai/chapter-generator.ts`

**设计模式**：递归规划 + 反思驱动

**流程图**：

```
输入：章节大纲、上下文
    ↓
┌─────────────────┐
│ 1. 构建上下文    │
│   - 滑动窗口    │
│   - 智能摘要    │
│   - 角色注入    │
└────────┬────────┘
         ↓
┌─────────────────┐
│ 2. 场景划分     │
│   - AI分析大纲  │
│   - 生成3-5场景 │
└────────┬────────┘
         ↓
┌─────────────────┐
│ 3. 逐场景生成   │
│   for each scene│
│   ├─ 生成内容   │
│   ├─ 流式输出   │
│   └─ 进度回调   │
└────────┬────────┘
         ↓
┌─────────────────┐
│ 4. 反思优化     │
│   - 一致性检查  │
│   - 内容优化    │
│   - 连贯性保证  │
└────────┬────────┘
         ↓
输出：优化后的章节
```

**关键方法**：
- `generateChapter()`: 主生成方法
- `generateChapterWithScenes()`: 场景划分策略
- `analyzeScenes()`: AI 场景分析
- `generateScene()`: 单场景生成
- `reflectAndRefine()`: 反思优化

### 2. 上下文管理器

**文件**：`src/lib/ai/context-manager.ts`

**策略**：滑动窗口 + 智能摘要

**算法**：
```
总上下文预算：100,000 tokens
├─ 40% 完整章节（最近N章）
├─ 20% 章节摘要（更早章节）
├─ 20% 角色卡片（相关角色）
└─ 20% 世界观元素（相关设定）
```

**核心功能**：
- `buildContext()`: 构建完整上下文包
- `getRecentFullChapters()`: 滑动窗口获取完整章节
- `getChapterSummaries()`: 获取历史摘要
- `getRelevantCharacters()`: 相关性过滤角色
- `formatContextForPrompt()`: 格式化为提示词

### 3. 提示词模板管理器

**文件**：`src/lib/ai/prompts/template-manager.ts`

**模板列表**（9种）：
1. `outline-generation`: 大纲生成
2. `outline-refinement`: 大纲细化
3. `chapter-generation`: 章节生成
4. `chapter-continuation`: 章节续写
5. `character-generation`: 角色创建
6. `character-dialogue`: 角色对话
7. `world-element`: 世界观元素
8. `scene-generation`: 场景生成
9. `consistency-check`: 一致性检查

**特性**：
- 变量插值：`{variableName}`
- 上下文注入：自动注入角色、世界观
- JSON 解析：支持结构化输出

### 4. Gemini AI 提供者

**文件**：`src/lib/ai/providers/gemini.ts`

**支持模型**：
- `gemini-2.5-flash`: 快速生成，适合大纲/人设
- `gemini-2.5-pro`: 高质量生成，适合正文

**功能**：
- `generate()`: 同步生成
- `streamGenerate()`: 流式生成（AsyncGenerator）
- `estimateCost()`: 成本估算
- `estimateTokens()`: Token 估算

**定价**（2025年）：
- Gemini 2.5 Flash: $0.075/1M input, $0.30/1M output
- Gemini 2.5 Pro: $1.25/1M input, $5.00/1M output

---

## API 设计

### RESTful 规范

**基础路径**：`/api`

**响应格式**：
```json
{
  "success": true,
  "data": {},
  "error": null
}
```

### API 端点列表

#### 项目管理

| 方法 | 路径 | 描述 | 状态 |
|------|------|------|------|
| GET | `/api/projects` | 获取项目列表 | ⏳ 待实现 |
| POST | `/api/projects` | 创建项目 | ⏳ 待实现 |
| GET | `/api/projects/[id]` | 获取项目详情 | ⏳ 待实现 |
| PUT | `/api/projects/[id]` | 更新项目 | ⏳ 待实现 |
| DELETE | `/api/projects/[id]` | 删除项目 | ⏳ 待实现 |

#### 章节管理

| 方法 | 路径 | 描述 | 状态 |
|------|------|------|------|
| GET | `/api/projects/[id]/chapters` | 获取章节列表 | ⏳ 待实现 |
| POST | `/api/projects/[id]/chapters` | 创建章节 | ⏳ 待实现 |
| GET | `/api/projects/[id]/chapters/[chId]` | 获取章节内容 | ⏳ 待实现 |
| PUT | `/api/projects/[id]/chapters/[chId]` | 更新章节 | ⏳ 待实现 |
| DELETE | `/api/projects/[id]/chapters/[chId]` | 删除章节 | ⏳ 待实现 |

#### AI 生成

| 方法 | 路径 | 描述 | 状态 |
|------|------|------|------|
| POST | `/api/ai/generate/outline` | AI 生成大纲 | ⏳ 待实现 |
| POST | `/api/ai/generate/chapter` | AI 生成章节（流式） | ⏳ 待实现 |
| POST | `/api/ai/generate/character` | AI 生成角色 | ⏳ 待实现 |
| POST | `/api/ai/generate/world-element` | AI 生成世界观 | ⏳ 待实现 |
| POST | `/api/ai/continue` | AI 续写内容 | ⏳ 待实现 |

#### 角色管理

| 方法 | 路径 | 描述 | 状态 |
|------|------|------|------|
| GET | `/api/projects/[id]/characters` | 获取角色列表 | ⏳ 待实现 |
| POST | `/api/projects/[id]/characters` | 创建角色 | ⏳ 待实现 |
| PUT | `/api/projects/[id]/characters/[charId]` | 更新角色 | ⏳ 待实现 |
| DELETE | `/api/projects/[id]/characters/[charId]` | 删除角色 | ⏳ 待实现 |

#### 世界观管理

| 方法 | 路径 | 描述 | 状态 |
|------|------|------|------|
| GET | `/api/projects/[id]/world` | 获取世界观元素 | ⏳ 待实现 |
| POST | `/api/projects/[id]/world` | 添加世界观元素 | ⏳ 待实现 |
| PUT | `/api/projects/[id]/world/[elId]` | 更新世界观元素 | ⏳ 待实现 |
| DELETE | `/api/projects/[id]/world/[elId]` | 删除世界观元素 | ⏳ 待实现 |

#### 导出功能

| 方法 | 路径 | 描述 | 状态 |
|------|------|------|------|
| GET | `/api/projects/[id]/export/md` | 导出 Markdown | ⏳ 待实现 |
| GET | `/api/projects/[id]/export/txt` | 导出纯文本 | ⏳ 待实现 |
| GET | `/api/projects/[id]/export/pdf` | 导出 PDF | ⏳ 待实现 |
| GET | `/api/projects/[id]/export/epub` | 导出 EPUB | ⏳ 待实现 |

详细 API 文档请参考 [API.md](./API.md)

---

## UI/UX 设计

### 页面结构

#### 1. 首页（Landing Page）

**路径**：`/`

**功能**：
- 项目概览
- 快速开始按钮
- 最近编辑的项目

**组件**：
- `Header`: 顶部导航
- `ProjectCard`: 项目卡片
- `QuickStart`: 快速开始引导

#### 2. 项目仪表盘

**路径**：`/(dashboard)`

**布局**：
```
┌─────────────────────────────────────────┐
│ Header (Logo + 用户菜单)                 │
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │   Main Content               │
│          │                              │
│ - 项目   │   项目列表 / 编辑器           │
│ - 大纲   │                              │
│ - 人设   │                              │
│ - 世界观 │                              │
│          │                              │
└──────────┴──────────────────────────────┘
```

#### 3. 项目详情页

**路径**：`/projects/[id]`

**标签页**：
- 概览：项目信息、统计数据
- 大纲：大纲树形编辑器
- 人设：角色列表、关系图谱
- 世界观：世界观元素管理
- 章节：章节列表、编辑器

#### 4. 章节编辑器

**路径**：`/projects/[id]/chapters/[chapterId]`

**布局**：
```
┌─────────────────────────────────────────┐
│ 章节导航：上一章 | 下一章                │
├─────────────────────────────────────────┤
│                                         │
│   编辑器区域（TipTap）                   │
│                                         │
│   - AI 续写按钮                         │
│   - 字数统计                            │
│   - 自动保存提示                        │
│                                         │
├─────────────────────────────────────────┤
│ 侧边栏：大纲、角色、世界观              │
└─────────────────────────────────────────┘
```

### 设计规范

**颜色主题**：
```css
--primary: hsl(222 47% 11%);        /* 深蓝 */
--secondary: hsl(210 40% 96%);      /* 浅灰 */
--accent: hsl(222 47% 55%);         /* 亮蓝 */
--paper: hsl(0 0% 100%);            /* 纸张白 */
--ink: hsl(222 47% 11%);            /* 墨水黑 */
```

**字体**：
```css
--font-sans: 'Inter', system-ui;    /* UI 字体 */
--font-serif: 'Merriweather', serif; /* 阅读字体 */
--font-mono: 'JetBrains Mono', monospace; /* 代码字体 */
```

**组件规范**：
- 圆角：`0.5rem`
- 阴影：`0 1px 3px rgba(0,0,0,0.1)`
- 间距：`0.25rem` 的倍数

---

## 安全设计

### API 安全

1. **输入验证**：使用 Zod schema 验证所有输入
2. **SQL 注入防护**：Prisma ORM 自动防护
3. **XSS 防护**：React 自动转义，TipTap 需配置
4. **CSRF 防护**：Next.js 内置 CSRF token

### 数据安全

1. **环境变量**：`.env.local` 不提交到 Git
2. **API 密钥**：使用环境变量存储
3. **数据备份**：定期导出功能

### 隐私保护

1. **本地优先**：默认本地存储
2. **无追踪**：不收集用户数据
3. **AI 隐私**：生成内容仅用于 API 调用

---

## 性能设计

### 前端优化

1. **代码分割**：Next.js 自动分割路由
2. **懒加载**：动态导入大型组件
3. **图片优化**：`next/image` 自动优化
4. **虚拟滚动**：长列表使用 `react-virtualized`

### 后端优化

1. **数据库索引**：为常用查询字段添加索引
2. **查询优化**：使用 `select` 限制返回字段
3. **流式响应**：AI 生成使用 SSE
4. **缓存策略**：静态数据缓存

### AI 优化

1. **Token 控制**：智能上下文管理
2. **模型选择**：根据任务选择模型
3. **生成缓存**：相同提示词复用结果
4. **成本控制**：每日预算限制

---

## 扩展性设计

### 多模型支持

预留接口支持：
- OpenAI GPT-4
- Anthropic Claude
- 其他兼容模型

### 多语言支持

i18n 架构：
```typescript
// locales/zh-CN.json
{
  "nav.projects": "项目",
  "nav.outline": "大纲"
}

// locales/en-US.json
{
  "nav.projects": "Projects",
  "nav.outline": "Outline"
}
```

### 插件系统（未来）

插件接口设计：
```typescript
interface Plugin {
  name: string
  version: string
  init(): void
  onChapterGenerate?(chapter: Chapter): void
}
```

---

## 部署设计

### 开发环境

```bash
npm run dev          # 开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
```

### 生产环境

**本地部署**：
```bash
npm run build
npm run start
```

**Docker 部署**（未来）：
```dockerfile
FROM node:20-alpine
COPY . /app
WORKDIR /app
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Vercel 部署**（未来）：
- 连接 GitHub 仓库
- 自动部署
- 环境变量配置

---

## 监控与日志

### 错误追踪

- 开发：控制台日志
- 生产：集成 Sentry（可选）

### 性能监控

- Web Vitals：Next.js 内置
- API 响应时间：自定义中间件

### 成本追踪

- 数据库：`Generation` 表记录所有 AI 调用
- 统计页面：可视化展示

---

## 测试策略

### 单元测试

使用 Vitest：
```bash
npm install -D vitest @testing-library/react
```

测试覆盖：
- 工具函数
- 业务逻辑
- 组件

### 集成测试

使用 Playwright：
```bash
npm install -D @playwright/test
```

测试场景：
- 用户注册/登录
- 项目创建流程
- AI 生成流程

### E2E 测试

关键路径：
1. 创建项目
2. 生成大纲
3. 创建角色
4. 生成章节
5. 导出小说

---

## 版本规划

### v1.0（当前）

- ✅ 核心架构
- ✅ AI 生成引擎
- ⏳ 基础 CRUD
- ⏳ 简单 UI

### v1.1（未来）

- 大纲可视化
- 角色关系图谱
- 导出 PDF/EPUB
- 统计分析

### v2.0（未来）

- 协作功能
- 云端同步
- 移动端应用
- 插件系统

---

## 参考资源

### 技术文档

- [Next.js 15 文档](https://nextjs.org/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Gemini API](https://ai.google.dev/docs)
- [TipTap 编辑器](https://tiptap.dev/docs)

### 设计参考

- [SuperWriter 框架](https://www.techwalker.com/2025/0608/3167400.shtml)
- [Notion 编辑器](https://www.notion.so)
- [Scrivener 软件](https://www.literatureandlatte.com/scrivener/overview)

### 开源项目

- [302 AI Novel Writing](https://github.com/302ai/302_novel_writing)
- [AI Content Generator](https://github.com/Varunv003/Ai-content_generator-nextjs)

---

**文档维护**：本文档随项目进展持续更新

**最后更新**：2025-01-04
