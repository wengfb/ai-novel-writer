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
       ├──────────────┬──────────────┬──────────────┬──────────────┐
       │              │              │              │              │
       ▼              ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Outline    │ │   Chapter    │ │  Character   │ │ WorldElement │ │Foreshadowing │
│   (大纲)     │ │   (章节)     │ │   (角色)     │ │  (世界观)    │ │   (伏笔)     │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────────────┘ └──────────────┘
       │                │                │
       │                │                │
       ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Outline     │ │    Scene     │ │CharacterSnap │
│  (树形结构)  │ │   (场景)     │ │ (角色快照)   │
└──────────────┘ └──────────────┘ └──────────────┘
                       │
                       │ (埋设/回收)
                       ▼
                ┌──────────────┐
                │Foreshadowing │
                │   (伏笔)     │
                └──────────────┘

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
- `outlineMode`: 大纲模式（full=完整规划/progressive=渐进式规划）
- `planningRange`: 渐进式规划时的章节范围（例如：每次规划未来5章）

**索引**：
- `status`: 用于按状态筛选
- `genre`: 用于按类型筛选

**关系**：
- 1:N → Outline
- 1:N → Chapter
- 1:N → Character
- 1:N → WorldElement
- 1:N → Generation
- 1:N → Foreshadowing

#### 2. Chapter（章节）

**字段说明**：
- `chapterNumber`: 章节编号（从1开始）
- `content`: 章节内容（Markdown 格式）
- `wordCount`: 字数统计
- `summary`: 章节摘要（用于上下文）
- `notes`: 作者笔记
- `isKeyChapter`: 是否为关键章节（影响上下文保留策略）
- `plotType`: 情节类型（setup=铺垫/conflict=冲突/climax=高潮/resolution=解决）

**约束**：
- `UNIQUE(projectId, chapterNumber)`: 每个项目的章节编号唯一

**关系**：
- N:1 → Project
- 1:1 → Outline（可选）
- 1:N → Scene
- 1:N → Foreshadowing（埋设的伏笔，plantedForeshadowings）
- 1:N → Foreshadowing（回收的伏笔，resolvedForeshadowings）
- 1:N → CharacterSnapshot（角色快照）

#### 3. Character（角色）

**字段说明**：
- `name`: 角色姓名
- `personality`: 性格特点
- `dialogueStyle`: 对话风格
- `relationships`: 关系图谱（JSON 字符串）
- `characterArc`: 角色弧光规划
- `importance`: 角色重要性（1-10，影响上下文权重和保留优先级）
- `role`: 角色类型（protagonist=主角/antagonist=反派/supporting=配角/minor=次要角色）

**关系**：
- N:1 → Project
- 1:N → CharacterSnapshot（角色快照）

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
- `planningMode`: 规划模式（full=完整规划/progressive=渐进式规划）
- `planningRange`: 规划范围（渐进式规划时的章节数量）
- `isFlexible`: 是否允许灵活调整（true=可根据创作进展调整）
- `confidence`: 规划置信度（1-10，表示大纲的可靠性）

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

#### 7. Foreshadowing（伏笔管理）

**字段说明**：
- `id`: 伏笔唯一标识
- `projectId`: 所属项目
- `title`: 伏笔标题
- `description`: 伏笔描述
- `type`: 伏笔类型（plot=情节/character=角色/world=世界观/mystery=悬念）
- `importance`: 重要性（1-10，影响提醒优先级）
- `plantedInChapterId`: 埋设章节ID
- `plantedContent`: 埋设内容（具体的伏笔文本）
- `plantedAt`: 埋设时间
- `expectedChapterNumber`: 预期回收章节号
- `resolvedInChapterId`: 回收章节ID
- `resolvedContent`: 回收内容（回收时的文本）
- `resolvedAt`: 回收时间
- `status`: 状态（planned=计划中/planted=已埋设/resolved=已回收/abandoned=已放弃）
- `relatedCharacters`: 相关角色（JSON数组，存储角色ID）
- `relatedElements`: 相关世界观元素（JSON数组，存储元素ID）
- `tags`: 标签（JSON数组，用于分类和检索）
- `reminderChapterNumber`: 提醒章节号（在此章节前提醒回收）

**索引**：
- `projectId`: 按项目查询
- `status`: 按状态筛选
- `plantedInChapterId`: 查询章节埋设的伏笔
- `resolvedInChapterId`: 查询章节回收的伏笔

**关系**：
- N:1 → Project
- N:1 → Chapter（埋设章节，plantedInChapter）
- N:1 → Chapter（回收章节，resolvedInChapter）

#### 8. CharacterSnapshot（角色快照）

**字段说明**：
- `id`: 快照唯一标识
- `characterId`: 角色ID
- `chapterId`: 章节ID
- `chapterNumber`: 章节编号（冗余字段，便于查询）
- `age`: 年龄（可能随剧情变化）
- `appearance`: 外貌描述（可能因受伤、修炼等改变）
- `personality`: 性格特点（可能因经历而变化）
- `powerLevel`: 实力等级（修仙、玄幻等题材）
- `skills`: 技能列表（JSON数组）
- `items`: 物品清单（JSON数组）
- `status`: 状态描述（健康/受伤/中毒等）
- `relationships`: 关系变化（JSON对象，记录与其他角色的关系）
- `mentalState`: 心理状态（情绪、心境等）
- `motivation`: 当前动机（当前章节的行动目标）
- `majorEvents`: 重大事件记录（该章节发生的重要事件）
- `notes`: 备注（其他需要记录的信息）

**约束**：
- `UNIQUE(characterId, chapterNumber)`: 每个角色在每个章节只有一个快照

**索引**：
- `characterId`: 按角色查询
- `chapterId`: 按章节查询
- `chapterNumber`: 按章节号查询

**关系**：
- N:1 → Character
- N:1 → Chapter

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

**策略**：滑动窗口 + 智能摘要 + 角色重要性权重

**算法**：
```
总上下文预算：100,000 tokens
├─ 40% 完整章节（最近N章）
│   └─ 关键章节优先保留（isKeyChapter=true）
├─ 20% 章节摘要（更早章节）
├─ 20% 角色卡片（相关角色）
│   ├─ 主角/反派优先（role=protagonist/antagonist）
│   └─ 按重要性权重排序（importance字段）
├─ 15% 世界观元素（相关设定）
└─ 5% 伏笔上下文（未回收伏笔的埋设章节）
```

**改进策略**：

1. **角色重要性权重**：
   - 根据角色的 `importance` 字段（1-10）调整上下文权重
   - 主角（protagonist）和反派（antagonist）优先保留
   - 次要角色根据重要性动态调整，低重要性角色可能被省略

2. **关键章节保留策略**：
   - 标记为 `isKeyChapter=true` 的章节优先保留在上下文中
   - 关键章节包括：重要情节转折、伏笔埋设/回收、角色重大变化
   - 即使超出滑动窗口范围，关键章节也会被保留

3. **伏笔上下文**：
   - 自动包含未回收伏笔（status=planted）的埋设章节
   - 在接近回收章节时增加伏笔相关上下文权重
   - 确保 AI 生成时能够合理回收伏笔

**核心功能**：
- `buildContext()`: 构建完整上下文包
- `getRecentFullChapters()`: 滑动窗口获取完整章节
- `getChapterSummaries()`: 获取历史摘要
- `getRelevantCharacters()`: 相关性过滤角色（支持重要性权重）
- `getForeshadowingContext()`: 获取伏笔相关上下文
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

### 5. 伏笔管理器（Foreshadowing Manager）

**文件**：`src/lib/ai/foreshadowing-manager.ts`

**职责**：
- 伏笔的计划、埋设、追踪和回收
- 自动提醒即将需要回收的伏笔
- 分析伏笔的使用情况和效果

**核心功能**：

1. **伏笔规划**：
   - `createForeshadowing()`: 创建伏笔计划
   - `planForeshadowing()`: 设置预期回收章节
   - `categorizeForeshadowing()`: 按类型分类（情节/角色/世界观/悬念）

2. **智能埋设**：
   - `plantForeshadowing()`: 在生成章节时自动埋设伏笔
   - `suggestPlantingLocation()`: AI 建议最佳埋设位置
   - `validatePlanting()`: 验证埋设的自然性

3. **追踪提醒**：
   - `trackForeshadowing()`: 追踪所有未回收伏笔
   - `getReminders()`: 获取需要回收的伏笔提醒
   - `calculateUrgency()`: 计算回收紧急度

4. **回收验证**：
   - `resolveForeshadowing()`: 标记伏笔已回收
   - `validateResolution()`: 确保伏笔得到合理回收
   - `analyzeEffectiveness()`: 分析伏笔效果

### 6. 角色快照管理器（Character Snapshot Manager）

**文件**：`src/lib/ai/character-snapshot-manager.ts`

**职责**：
- 记录角色在不同章节的状态变化
- 提供角色历史状态查询
- 确保角色发展的连贯性

**核心功能**：

1. **自动快照**：
   - `createSnapshot()`: 在关键章节自动创建角色快照
   - `detectKeyMoments()`: 检测需要创建快照的关键时刻
   - `captureCharacterState()`: 捕获角色完整状态

2. **状态对比**：
   - `compareSnapshots()`: 对比不同章节的角色状态
   - `trackCharacterGrowth()`: 追踪角色成长轨迹
   - `visualizeChanges()`: 可视化角色变化

3. **一致性检查**：
   - `validateConsistency()`: 检测角色发展的不合理跳跃
   - `detectContradictions()`: 发现前后矛盾
   - `suggestCorrections()`: 建议修正方案

4. **历史回溯**：
   - `getSnapshotAtChapter()`: 查询角色在特定章节的状态
   - `getSnapshotHistory()`: 获取角色完整历史
   - `restoreFromSnapshot()`: 从快照恢复角色状态

### 7. 渐进式大纲管理器（Progressive Outline Manager）

**文件**：`src/lib/ai/progressive-outline-manager.ts`

**职责**：
- 支持渐进式大纲规划模式
- 动态调整大纲内容
- 管理大纲的灵活性和置信度

**核心功能**：

1. **分段规划**：
   - `planNextChapters()`: 只规划未来N个章节的大纲
   - `setPlanningRange()`: 设置规划范围（例如：每次规划5章）
   - `generateProgressiveOutline()`: 生成渐进式大纲

2. **动态调整**：
   - `adjustOutline()`: 根据创作进展调整后续大纲
   - `detectDeviations()`: 检测实际创作与大纲的偏差
   - `replanFromChapter()`: 从指定章节重新规划

3. **置信度评估**：
   - `evaluateConfidence()`: 评估大纲的可靠性（1-10）
   - `identifyUncertainties()`: 识别不确定的情节点
   - `updateConfidenceScores()`: 更新置信度分数

4. **灵活性管理**：
   - `markFlexible()`: 标记可调整的大纲节点
   - `lockOutline()`: 锁定已确定的大纲部分
   - `suggestAlternatives()`: 建议替代情节方案

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
