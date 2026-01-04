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
- 使用 Gemini 2.5 Pro/Flash 实现 AI 生成
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
├── docs/                      # 📚 完整文档（已创建）
│   ├── DESIGN.md             # 系统设计文档
│   ├── API.md                # API 接口文档
│   ├── DEVELOPMENT.md        # 开发指南
│   └── PROGRESS.md           # 进度追踪
├── prisma/
│   └── schema.prisma         # ✅ 数据模型（7个表）
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/             # API Routes（待实现）
│   │   └── (dashboard)/     # 主应用界面（待实现）
│   ├── components/           # React 组件
│   │   ├── ui/              # ✅ shadcn/ui 组件（15个）
│   │   ├── editor/          # 编辑器组件（待实现）
│   │   ├── project/         # 项目组件（待实现）
│   │   └── ai/              # AI 交互组件（待实现）
│   ├── lib/
│   │   ├── ai/              # ✅ AI 核心引擎
│   │   │   ├── providers/gemini.ts        # Gemini 提供者
│   │   │   ├── prompts/template-manager.ts  # 提示词管理
│   │   │   ├── context-manager.ts          # 上下文管理器
│   │   │   └── chapter-generator.ts        # 章节生成器
│   │   └── db/
│   │       └── prisma.ts     # Prisma 客户端
│   └── types/
│       └── index.ts          # TypeScript 类型定义
├── .env.example              # ✅ 环境变量模板
├── .env.local                # ✅ 环境变量配置（不提交）
└── README.md                 # ✅ 项目主文档
```

---

## ✅ 已完成模块

### 1. 项目基础架构（100%）
- ✅ Next.js 15 + TypeScript 配置
- ✅ shadcn/ui 组件库（15个组件）
- ✅ Tailwind CSS 配置
- ✅ ESLint 配置

### 2. 数据库设计（100%）
- ✅ Prisma + SQLite 配置
- ✅ 完整数据模型（7个表）
  - Project（小说项目）
  - Chapter（章节）
  - Scene（场景）
  - Character（角色）
  - WorldElement（世界观元素）
  - Outline（大纲）
  - Generation（AI生成记录）

### 3. AI 核心引擎（100%）
- ✅ Gemini Provider（支持 2.5 Flash/Pro）
- ✅ 上下文管理器（滑动窗口+摘要策略）
- ✅ 章节生成器（递归规划+反思机制）
- ✅ 提示词模板系统（9种模板）
- ✅ Token/Cost 估算

### 4. 文档系统（100%）
- ✅ 系统设计文档（docs/DESIGN.md）
- ✅ API 接口文档（docs/API.md）
- ✅ 开发指南（docs/DEVELOPMENT.md）
- ✅ 进度追踪（docs/PROGRESS.md）
- ✅ 项目主文档（README.md）

---

## ⏳ 进行中模块

### API 开发（20%）
- ⏳ 项目管理 API
- ⏳ 章节管理 API
- ⏳ AI 生成 API
- ⏳ 其他 API（角色、世界观、大纲、导出、统计）

---

## ⏸️ 待开始模块

- ⏸️ 前端界面（0%）
- ⏸️ 状态管理（0%）
- ⏸️ 测试（0%）

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
1. API 开发（项目、章节、AI 生成）
2. 前端基础界面（项目列表、编辑器）
3. 高级功能（大纲可视化、关系图谱）
4. 测试和优化

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
- 不要将 `.env.local` 提交到 Git

⚠️ **AI 生成成本**
- Gemini 2.5 Flash: $0.075/1M input, $0.30/1M output
- Gemini 2.5 Pro: $1.25/1M input, $5.00/1M output
- 建议先使用 Flash 测试，确认无误后再用 Pro

---

## 📊 当前进度

**整体完成度**：30%

- ✅ 项目基础架构（100%）
- ✅ 数据库设计（100%）
- ✅ AI 核心引擎（100%）
- ⏳ API 开发（20%）
- ⏸️ 前端界面（0%）
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

**最后更新**：2025-01-04
**维护者**：项目开发者
