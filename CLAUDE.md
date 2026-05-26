# Claude Code 项目配置

> 此文件用于指导 AI 助手（如 Claude）如何理解和协助开发本项目

---

## 项目概述

**项目名称**：AI Novel Writer
**项目类型**：全栈 Web 应用（Next.js 16 + TypeScript）
**核心功能**：基于 AI 的全自动小说创作系统

---

## 项目目标

- 从大纲到人设、世界观、章节的完整自动化创作
- 使用 Gemini 2.5 Pro/Flash 实现 AI 生成
- 保证长篇小说（10万字+）的连贯性
- 本地部署，数据完全掌控

---

## 技术栈

### 前端
- Next.js 16 (App Router)
- TypeScript 5.x
- Tailwind CSS 4.x
- shadcn/ui (UI 组件库)
- TipTap (富文本编辑器)
- Zustand (状态管理)

### 后端
- Next.js API Routes
- Prisma 7.x (ORM)
- SQLite (开发) / PostgreSQL (生产)

### AI
- Vercel AI SDK 6.x
- Gemini 2.5 (Flash & Pro) / OpenAI 兼容中转
- 默认使用 OpenAI 兼容模式（`gpt-4o-mini`），可切换 Gemini
- DB 设置优先级高于环境变量（30 秒缓存）

---

## 关键目录结构

```
src/
├── app/
│   ├── api/                    # API Routes（26个端点）
│   ├── page.tsx                # 主页面（Studio 布局）
│   └── layout.tsx              # 根布局
├── components/
│   ├── ui/                     # shadcn/ui 组件（26个）
│   ├── layout/                 # 布局组件（Studio）
│   ├── studio/                 # Studio 组件（侧边栏、头部）
│   ├── editor/                 # TipTap 富文本编辑器
│   ├── project/                # 项目组件
│   ├── chapter/                # 章节组件
│   ├── character/              # 角色组件
│   ├── world/                  # 世界观组件
│   └── ai/                     # AI 交互组件（Chat、Context、Continue）
├── lib/
│   ├── ai/                     # AI 核心引擎（14个文件）
│   │   ├── providers/          # Gemini / OpenAI 兼容提供者
│   │   ├── prompts/            # 提示词模板管理
│   │   ├── context-manager.ts  # 上下文管理器
│   │   ├── chapter-generator.ts
│   │   ├── rewrite-generator.ts
│   │   ├── chat-tools.ts       # AI 工具调用（Function Calling）
│   │   └── world-consistency-checker.ts
│   ├── api/                    # API 客户端 + 端点封装
│   ├── store/                  # Zustand 状态管理（8个 store）
│   ├── db/prisma.ts
│   └── utils/
└── types/
    └── index.ts
```

---

## 关键文件

- `prisma/schema.prisma` — 数据模型定义（11 个表）
- `src/lib/ai/providers/` — AI Provider 实现，切换模型/中转在这里改
- `src/lib/ai/config.ts` — AI 配置获取，DB 设置优先于环境变量
- `src/lib/ai/context-manager.ts` — 上下文管理器，控制给 AI 传什么内容
- `src/lib/store/` — Zustand store，全局状态管理
- `src/lib/utils/sse-parser.ts` — SSE 流式响应解析器

---

## 命令速查

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（默认 localhost:3000） |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务器 |
| `npm run lint` | ESLint 代码检查 |
| `npx prisma generate` | 重新生成 Prisma 客户端 |
| `npx prisma migrate dev --name xxx` | 创建并应用数据库迁移 |
| `npx prisma studio` | 打开 Prisma 数据库管理界面 |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，添加 API Key

# 3. 初始化数据库
npx prisma generate
npx prisma migrate dev --name init

# 4. 启动开发服务器
npm run dev
```

---

## 环境变量

### 通用
| 变量 | 说明 | 必填 |
|------|------|------|
| `AI_PROVIDER` | `openai-compatible`（默认）或 `gemini` | 否 |
| `AI_MODEL` | 模型名称（通用回退键） | 否 |
| `AI_CONTEXT_MAX_TOKENS` | AI 上下文最大 token 数（默认 100000） | 否 |

### OpenAI 兼容模式（默认）
| 变量 | 说明 | 默认值 |
|------|------|--------|
| `AI_API_KEY` | API 密钥（也读 `OPENAI_API_KEY`） | — |
| `AI_BASE_URL` | 中转地址（也读 `OPENAI_BASE_URL`） | `https://api.openai.com/v1` |
| `AI_MODEL` / `OPENAI_MODEL` | 模型名称 | `gpt-4o-mini` |

### Gemini 模式
| 变量 | 说明 | 默认值 |
|------|------|--------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API 密钥 | — |
| `GEMINI_MODEL` | 模型名称 | `gemini-2.5-flash` |
| `GEMINI_BASE_URL` | 自定义 Base URL | — |

> DB 设置（`SystemSetting` 表）优先级高于环境变量，可在应用内修改。

---

## 重要提醒

**better-sqlite3 原生模块**：`npm install` 需要 C++ 编译环境（python3, gcc/make）。如果安装失败，确认系统已装 `build-essential`。

**Prisma 自定义输出路径**：生成的客户端在 `src/lib/generated/prisma`，而非默认的 `node_modules`。该目录已在 `.gitignore` 中排除。

**数据库操作前务必运行迁移**：
```bash
npx prisma migrate dev --name migration_name
```

**API 密钥安全**：
- 不要将 `.env.local` 或真实 API token 提交到 Git
- `.env.local` 已在 `.gitignore` 中

**AI 生成成本**：
- Gemini 2.5 Flash: $0.075/1M input, $0.30/1M output
- Gemini 2.5 Pro: $1.25/1M input, $5.00/1M output
- 建议先使用 Flash 测试，确认无误后再用 Pro

**SSE 流式响应**：所有 AI 生成 API 使用 SSE 协议，通过 `SSEParser` 解析 `data:` 行，前端使用 `streamSSE()` + `AbortSignal` 支持取消。

**TipTap SSR 适配**：编辑器组件用 `"use client"` 标记，`useEditor` 需设 `immediatelyRender: false` 避免 SSR 水合错误。

---

## 代码规范

- 使用 TypeScript，明确类型定义
- 遵循 ESLint 规则
- 组件使用 PascalCase，文件使用 kebab-case
- API 路由使用 RESTful 规范
- 使用 Zod 进行输入验证
- 关键逻辑和复杂函数需添加中文注释，说明 WHY 而非 WHAT
- 公共函数/类型/接口使用 JSDoc 标准注释，标注参数和返回值
- 组件文件顶部注明组件职责，复杂 Props 写明用途

---

## 用户偏好

- 语言：中文（始终用中文回答和注释）
- 部署方式：本地开发运行
- 开发方式：一步到位，实现完整功能

---

**最后更新**：2026-05-26
**维护者**：项目开发者
