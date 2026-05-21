# 🤖 AI Novel Writer

> 基于 AI 的全自动小说创作系统，助力开发者实现写作生产力革命

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5-orange)](https://ai.google.dev/)

---

## ✨ 特性

### 🎯 核心功能

- ✅ **AI 全自动生成**：基于 Gemini 2.5 Pro/Flash，从大纲到章节一键生成
- ✅ **长文本连贯性**：1M tokens 超长上下文，确保长篇小说前后一致
- ✅ **递归规划+反思**：场景划分 + 反思优化机制，保证内容质量
- ✅ **完整创作流程**：大纲 → 人设 → 世界观 → 章节 → 导出
- ✅ **本地部署**：SQLite 零配置，数据完全掌控

### 🚀 技术亮点

- **Next.js 15 App Router**：RSC + SSR，性能卓越
- **TypeScript**：100% 类型覆盖，开发体验优秀
- **Prisma ORM**：类型安全的数据库操作
- **shadcn/ui**：现代化 UI 组件库
- **TipTap 编辑器**：强大的富文本编辑能力
- **Gemini 2.5**：业界领先的 AI 模型

---

## 📸 预览

> 界面开发中，敬请期待...

---

## 🚀 快速开始

### 前置要求

- Node.js 20+
- npm 10+
- OpenAI 格式 API Key（默认，支持 OpenAI 官方或兼容服务）
- 可选：Gemini API Key（设置 `AI_PROVIDER=gemini` 时使用）

### 安装步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd ai-novel-writer

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，添加 OpenAI 格式 API 配置：
# AI_PROVIDER=openai-compatible
# AI_API_KEY=your_api_key_here
# AI_BASE_URL=https://api.openai.com/v1
# AI_MODEL=gpt-4o-mini
#
# 如需使用 Gemini：
# AI_PROVIDER=gemini
# GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key_here
# GEMINI_MODEL=gemini-2.5-flash

# 4. 初始化数据库
npx prisma generate
npx prisma migrate dev

# 5. 启动开发服务器
npm run dev
```

### 访问应用

打开浏览器访问：[http://localhost:3000](http://localhost:3000)

---

## 📚 文档

- **[系统设计文档](./docs/DESIGN.md)** - 架构设计、数据库设计、API 设计
- **[API 文档](./docs/API.md)** - 完整的 API 接口文档
- **[开发指南](./docs/DEVELOPMENT.md)** - 开发环境配置、工作流、测试
- **[进度追踪](./docs/PROGRESS.md)** - 开发进度和里程碑

---

## 🎯 使用场景

### 1. 长篇小说创作

创作 10 万字以上的长篇网络小说：
- ✅ 自动生成故事大纲
- ✅ 创建角色和世界观
- ✅ 逐章生成内容
- ✅ 保证连贯性

### 2. 多类型支持

支持各类小说类型：
- 玄幻/仙侠
- 科幻/赛博朋克
- 都市/言情
- 武侠/历史
- 悬疑/推理

### 3. 个人生产力

适合独立开发者或写作者：
- 快速原型验证
- 灵感捕捉和扩展
- 内容辅助生成
- 质量把控和优化

---

## 🛠️ 技术栈

### 前端

| 技术 | 版本 | 用途 |
|-----|------|------|
| Next.js | 15 | 全栈框架 |
| React | 19 | UI 库 |
| TypeScript | 5.x | 类型系统 |
| Tailwind CSS | 3.x | 样式方案 |
| shadcn/ui | latest | UI 组件库 |
| TipTap | 2.x | 富文本编辑器 |
| Zustand | 4.x | 状态管理 |

### 后端

| 技术 | 版本 | 用途 |
|-----|------|------|
| Next.js API Routes | 15 | API 服务 |
| Prisma | 5.x | ORM |
| SQLite | 3.x | 数据库（开发） |
| PostgreSQL | - | 数据库（生产，可选） |

### AI

| 技术 | 版本 | 用途 |
|-----|------|------|
| Gemini 2.5 Flash | latest | 快速生成（大纲/人设） |
| Gemini 2.5 Pro | latest | 高质量生成（正文） |
| Vercel AI SDK | 3.x | AI 集成 |

---

## 📖 使用示例

### 1. 创建小说项目

```typescript
// POST /api/projects
{
  "title": "仙侠世界",
  "description": "一个修仙少年的成长故事",
  "genre": "玄幻",
  "tags": ["修仙", "热血", "升级流"]
}
```

### 2. AI 生成大纲

```typescript
// POST /api/ai/generate/outline
{
  "projectId": "clx1234567890",
  "genre": "玄幻",
  "coreIdea": "一个修仙少年的成长故事",
  "targetWords": 100000,
  "chapterCount": 50,
  "model": "gpt-4o-mini"
}
```

### 3. AI 生成章节

```typescript
// POST /api/ai/generate/chapter
{
  "projectId": "clx1234567890",
  "chapterNumber": 1,
  "chapterTitle": "第一章 初入仙门",
  "chapterOutline": "主角初次踏入修仙世界，测试天赋，拜入宗门",
  "targetWords": 3000,
  "model": "gemini-2.5-pro"
}

// 响应：流式输出（SSE）
```

---

## 🏗️ 项目结构

```
ai-novel-writer/
├── docs/                   # 📚 文档
│   ├── DESIGN.md          # 系统设计
│   ├── API.md             # API 文档
│   ├── DEVELOPMENT.md     # 开发指南
│   └── PROGRESS.md        # 进度追踪
├── prisma/
│   └── schema.prisma      # 数据模型
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React 组件
│   ├── lib/              # 核心逻辑
│   │   ├── ai/          # AI 引擎
│   │   ├── db/          # 数据库
│   │   └── utils/       # 工具函数
│   ├── types/           # TypeScript 类型
│   └── hooks/           # 自定义 Hooks
└── README.md            # 本文件
```

---

## 🔧 开发指南

### 可用脚本

```bash
# 开发
npm run dev              # 启动开发服务器

# 构建
npm run build            # 构建生产版本
npm run start            # 启动生产服务器

# 数据库
npm run db:generate      # 生成 Prisma 客户端
npm run db:migrate       # 运行数据库迁移
npm run db:reset         # 重置数据库
npm run db:studio        # 打开 Prisma Studio

# 测试
npm test                 # 运行测试
npm run lint             # 运行 ESLint
npm run type-check       # TypeScript 类型检查
```

### 开发工具

- **VS Code**：推荐的 IDE
- **Prisma Studio**：数据库可视化管理
- **Chrome DevTools**：调试工具

详见：[开发指南](./docs/DEVELOPMENT.md)

---

## 🧪 测试

```bash
# 运行所有测试
npm test

# 监听模式
npm test -- --watch

# 覆盖率
npm test -- --coverage
```

---

## 📊 当前进度

### 整体进度：30%

- ✅ 项目基础架构（100%）
- ✅ 数据库设计（100%）
- ✅ AI 核心引擎（100%）
- ⏳ API 开发（20%）
- ⏸️ 前端界面（0%）
- ⏸️ 测试（0%）

详细进度：[进度追踪](./docs/PROGRESS.md)

---

## 🗺️ 路线图

### v1.0.0（当前）

- [x] 项目基础架构
- [x] AI 核心引擎
- [ ] API 开发
- [ ] 基础 UI
- [ ] 核心功能测试

### v1.1.0（计划中）

- [ ] 大纲可视化
- [ ] 角色关系图谱
- [ ] 导出 PDF/EPUB
- [ ] 统计分析

### v2.0.0（未来）

- [ ] 协作功能
- [ ] 云端同步
- [ ] 移动端应用
- [ ] 插件系统

---

## 🤝 贡献

欢迎贡献代码、报告 Bug 或提出新功能建议！

### 贡献流程

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范

- 使用 TypeScript
- 遵循 ESLint 规则
- 编写测试
- 更新文档

详见：[开发指南](./docs/DEVELOPMENT.md)

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

---

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Prisma](https://www.prisma.io/) - 数据库 ORM
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Google Gemini](https://ai.google.dev/) - AI 模型
- [Vercel AI SDK](https://sdk.vercel.ai/) - AI 集成工具

---

## 📞 联系方式

- **Issues**：[GitHub Issues](https://github.com/yourusername/ai-novel-writer/issues)
- **Discussions**：[GitHub Discussions](https://github.com/yourusername/ai-novel-writer/discussions)
- **Email**：待定

---

## 🌟 Star History

如果这个项目对你有帮助，请给它一个 Star！

---

**Made with ❤️ by Developer & Claude**

**最后更新**：2025-01-04
