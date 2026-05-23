# Claude Code 项目配置

> 此文件用于指导 AI 助手（如 Claude）如何理解和协助开发本项目

---

## 📋 项目概述

**项目名称**：AI Novel Writer
**项目类型**：全栈 Web 应用（Next.js 15 + TypeScript）
**核心功能**：基于 AI 的全自动小说创作系统

---

## 🎯 项目目标

开发一个面向开发者个人使用的 AI 辅助小说创作应用，实现：
- 从大纲到人设、世界观、章节的完整自动化创作
- 使用 Gemini 3 Pro/Flash 实现 AI 生成
- 保证长篇小说（10万字+）的连贯性
- 本地部署，数据完全掌控

---

## 🛠️ 技术栈

### 前端
- Next.js 15 (App Router)
- TypeScript 5.x
- Tailwind CSS 3.x
- shadcn/ui (UI 组件库)
- TipTap (富文本编辑器)
- Zustand (状态管理)

### 后端
- Next.js API Routes
- Prisma 5.x (ORM)
- SQLite (开发) / PostgreSQL (生产)

### AI
- Google Gemini 2.5 (Flash & Pro)
- Vercel AI SDK 3.x

---

## 📁 关键目录结构

```
ai-novel-writer/
├── docs/                      # 📚 完整文档
│   ├── DESIGN.md             # 系统设计文档
│   ├── API.md                # API 接口文档
│   ├── DEVELOPMENT.md        # 开发指南
│   └── PROGRESS.md           # 进度追踪
├── prisma/
│   └── schema.prisma         # ✅ 数据模型（11个表）
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/             # ✅ API Routes（22个端点）
│   │   ├── page.tsx         # ✅ 主页面（Studio 布局）
│   │   └── layout.tsx       # ✅ 根布局
│   ├── components/           # React 组件
│   │   ├── ui/              # ✅ shadcn/ui 组件（20个）
│   │   ├── layout/          # ✅ 布局组件（Studio）
│   │   ├── studio/          # ✅ Studio 组件（侧边栏、头部）
│   │   ├── editor/          # ✅ 编辑器组件（TipTap）
│   │   ├── project/         # ✅ 项目组件（列表、卡片、对话框）
│   │   ├── chapter/         # ✅ 章节组件（列表、项）
│   │   ├── character/       # ✅ 角色组件（列表、对话框）
│   │   ├── world/           # ✅ 世界观组件（列表）
│   │   └── ai/              # ✅ AI 交互组件（Chat、Context、Continue）
│   ├── lib/
│   │   ├── ai/              # ✅ AI 核心引擎
│   │   │   ├── providers/gemini.ts           # Gemini 提供者
│   │   │   ├── prompts/template-manager.ts   # 提示词管理
│   │   │   ├── context-manager.ts            # 上下文管理器
│   │   │   ├── chapter-generator.ts          # 章节生成器
│   │   │   └── world-consistency-checker.ts  # 世界观一致性检查
│   │   ├── api/             # ✅ API 客户端
│   │   │   ├── client.ts    # 基础客户端
│   │   │   └── endpoints/   # API 端点封装
│   │   ├── store/           # ✅ Zustand 状态管理（6个 store）
│   │   ├── db/
│   │   │   └── prisma.ts    # Prisma 客户端
│   │   └── utils/           # 工具函数
│   └── types/
│       └── index.ts         # TypeScript 类型定义
├── .env.example             # ✅ 环境变量模板
├── .env.local               # ✅ 环境变量配置（不提交）
└── README.md                # ✅ 项目主文档
```

---

## ✅ 已完成模块

### 1. 项目基础架构（100%）
- ✅ Next.js 15 + TypeScript 配置
- ✅ shadcn/ui 组件库（20个组件）
- ✅ Tailwind CSS 配置
- ✅ ESLint 配置

### 2. 数据库设计（100%）
- ✅ Prisma + SQLite 配置
- ✅ 完整数据模型（11个表）
  - Project（小说项目）
  - Chapter（章节）
  - Scene（场景）
  - Character（角色）
  - WorldElement（世界观元素）
  - Outline（大纲）
  - Generation（AI生成记录）
  - Foreshadowing（伏笔管理）
  - CharacterSnapshot（角色快照）
  - WorldElementSnapshot（世界观快照）
  - SystemSetting（系统设置）

### 3. AI 核心引擎（85%）
- ✅ Gemini Provider（支持 2.5 Flash/Pro）
- ✅ 上下文管理器（深度集成到所有 AI 路由）
- ✅ 章节生成器（完整接入 API）
- ✅ 提示词模板系统（10种模板）
- ✅ Token/Cost 估算
- ✅ 世界观一致性检查器（API + 前端集成）
- ✅ 智能上下文筛选（衰减加权 + 角色倍率 + 关系密度）
- ✅ 滑动窗口机制（环境变量可配置）
- ✅ AI 工具调用（Function Calling 完整闭环）
  - AI 助手可创建角色
  - AI 助手可创建世界观元素
  - AI 助手可修改章节
  - 支持写操作确认卡片和状态刷新

### 4. API 开发（95%）
- ✅ 项目管理 API（CRUD + 统计 + 导出）
- ✅ 章节管理 API（CRUD + 批量操作）
- ✅ 角色管理 API（CRUD + 快照）
- ✅ 世界观管理 API（CRUD + 快照）
- ✅ 大纲管理 API（CRUD）
- ✅ AI 生成 API（深度上下文集成完成）
  - ✅ AI 对话（完整上下文 + 伏笔数据）
  - ✅ AI 续写（深度上下文 + 摘要刷新）
  - ✅ 章节生成（完整 ContextManager + AI 摘要生成）
  - ✅ 智能上下文筛选（相关性评分算法）
  - ✅ 一致性检查（`/api/ai/consistency-check`）
  - ✅ 摘要批量补充（`/api/ai/summarize`）
- ✅ 系统设置 API

### 5. 前端界面（88%）
- ✅ Studio 布局（VS Code 风格三栏布局）
- ⚠️ 项目管理组件（列表、卡片、创建对话框已实现，但未集成到界面）
- ✅ 章节管理组件（列表、编辑器）
- ✅ 角色管理组件（列表、创建对话框）
- ✅ 世界观管理组件（列表、创建对话框）
- ✅ TipTap 富文本编辑器（含 SSR 适配）
- ✅ AI 交互组件（Chat、Context、Continue 按钮）
- ✅ Studio 侧边栏（左侧资源树、右侧 AI 面板）
- ❌ 项目选择/切换界面（未实现）
- ❌ 设置界面（未实现）
- ❌ 大纲可视化界面（未实现）

### 6. 状态管理（100%）
- ✅ Project Store（项目状态）
- ✅ Chapter Store（章节状态）
- ✅ Character Store（角色状态）
- ✅ World Store（世界观状态）
- ✅ AI Store（AI 交互状态）
- ✅ UI Store（界面状态）

### 7. API 客户端（100%）
- ✅ 完整的 API 封装（projects、chapters、characters、world-elements、ai）
- ✅ SSE 流式解析器
- ✅ 统一的响应处理和错误处理

### 8. 文档系统（100%）
- ✅ 系统设计文档（docs/DESIGN.md）
- ✅ API 接口文档（docs/API.md）
- ✅ 开发指南（docs/DEVELOPMENT.md）
- ✅ 进度追踪（docs/PROGRESS.md）
- ✅ 项目主文档（README.md）

---

## ⏳ 进行中模块

### 1. AI 功能深度集成（85%）
- ✅ 将完整的上下文管理器集成到 AI API
- ✅ 实现智能上下文筛选（衰减加权 + 角色倍率 + 关系密度）
- ✅ 应用滑动窗口机制（MAX_TOKENS 环境变量）
- ✅ 集成世界观一致性检查（API + 前端）
- ✅ 前端集成完整的章节生成 + 上下文定制功能
- ⏳ 实时一致性检查（编辑器内高亮）
- ⏳ 更多异常状态和错误体验打磨

### 2. 前端界面补充（88%）
- ✅ 项目选择/切换界面
- ✅ 新建项目入口集成
- ❌ 设置界面
- ❌ 大纲可视化界面

---

## ⏸️ 待开始模块

- ⏸️ 测试（0%）
  - 单元测试
  - 集成测试
  - E2E 测试
- ⏸️ 高级功能
  - 关系图谱
  - 多模型支持（OpenAI/Claude）
  - EPUB 导出优化

---

## 🚀 快速开始

### 环境准备
```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，添加 Gemini API Key

# 3. 初始化数据库
npx prisma generate
npx prisma migrate dev --name init

# 4. 启动开发服务器
npm run dev
```

### 重要文件
- **设计文档**：`docs/DESIGN.md` - 完整的系统设计
- **API 文档**：`docs/API.md` - 所有 API 端点定义
- **开发指南**：`docs/DEVELOPMENT.md` - 开发流程和规范
- **进度追踪**：`docs/PROGRESS.md` - 当前开发状态

---

## 🎯 AI 助手协作指南

### 推荐工作流程

当用户请求功能开发时：

1. **理解需求** → 阅读 `docs/API.md` 查看相关 API 定义
2. **查看进度** → 阅读 `docs/PROGRESS.md` 了解当前状态
3. **参考设计** → 阅读 `docs/DESIGN.md` 理解架构设计
4. **遵循规范** → 阅读 `docs/DEVELOPMENT.md` 遵循代码规范
5. **更新进度** → 修改 `docs/PROGRESS.md` 标记完成状态

### 开发优先级

**当前优先级（高→低）**：
1. ✅ ~~API 开发（项目、章节、AI 生成）~~ - 已完成
2. ✅ ~~前端基础界面（项目列表、编辑器）~~ - 已完成
3. ⏳ 前后端对接和功能测试（当前重点）
4. ⏸️ 高级功能（大纲可视化、关系图谱）
5. ⏸️ 测试和优化

### 代码规范

- ✅ 使用 TypeScript，明确类型定义
- ✅ 遵循 ESLint 规则
- ✅ 组件使用 PascalCase，文件使用 kebab-case
- ✅ API 路由使用 RESTful 规范
- ✅ 使用 Zod 进行输入验证
- ✅ 关键功能添加注释

### 重要提醒

⚠️ **数据库操作前务必先运行 Prisma 迁移**
```bash
npx prisma migrate dev --name migration_name
```

⚠️ **API 密钥配置**
- Gemini API Key 需要在 `.env.local` 中配置
- OpenAI 兼容中转默认使用 `https://pucoding.com/v1`
- OpenAI 兼容中转配置写入 `.env.local`：
  ```bash
  AI_PROVIDER=openai-compatible
  AI_BASE_URL=https://pucoding.com/v1
  AI_API_KEY=<本地私有 token，不写入仓库文件>
  ```
- 不要将 `.env.local` 或真实 API token 提交到 Git

⚠️ **AI 生成成本**
- Gemini 2.5 Flash: $0.075/1M input, $0.30/1M output
- Gemini 2.5 Pro: $1.25/1M input, $5.00/1M output
- 建议先使用 Flash 测试，确认无误后再用 Pro

---

## 📊 当前进度

**整体完成度**：78%

- ✅ 项目基础架构（100%）
- ✅ 数据库设计（100%）
- ⏳ AI 核心引擎（40%）- 代码完整但未深度集成，缺少工具调用
- ⏳ API 开发（85%）- AI API 缺少深度上下文集成
- ⏳ 前端界面（70%）- 缺少项目选择、设置、大纲可视化界面
- ✅ 状态管理（100%）
- ✅ API 客户端（100%）
- ⏸️ 测试（0%）

详见：`docs/PROGRESS.md`

---

## 🔗 关键链接

- **设计文档**：`docs/DESIGN.md`
- **API 文档**：`docs/API.md`
- **开发指南**：`docs/DEVELOPMENT.md`
- **进度追踪**：`docs/PROGRESS.md`
- **Gemini API**：https://ai.google.dev/docs
- **Next.js 文档**：https://nextjs.org/docs
- **Prisma 文档**：https://www.prisma.io/docs

---

## 💬 用户偏好

- ✅ **语言**：中文（始终用中文回答和注释）
- ✅ **AI 模型**：优先使用 Gemini 2.5
- ✅ **部署方式**：本地开发运行
- ✅ **开发方式**：一步到位，实现完整功能

---

**最后更新**：2026-05-24
**维护者**：项目开发者
