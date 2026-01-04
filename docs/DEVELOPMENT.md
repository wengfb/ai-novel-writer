# 开发指南

## 📋 文档信息

- **项目名称**：AI Novel Writer
- **版本**：v1.0.0
- **开发环境**：Node.js 20+, npm 10+
- **更新日期**：2025-01-04

---

## 📐 目录

1. [快速开始](#快速开始)
2. [开发环境配置](#开发环境配置)
3. [项目结构](#项目结构)
4. [开发工作流](#开发工作流)
5. [代码规范](#代码规范)
6. [测试指南](#测试指南)
7. [调试技巧](#调试技巧)
8. [部署指南](#部署指南)
9. [常见问题](#常见问题)

---

## 快速开始

### 前置要求

- Node.js 20+
- npm 10+
- Git

### 安装步骤

```bash
# 1. 克隆项目（如果从 Git 克隆）
git clone <repository-url>
cd ai-novel-writer

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，添加 Gemini API Key

# 4. 初始化数据库
npx prisma generate
npx prisma migrate dev

# 5. 启动开发服务器
npm run dev
```

### 访问应用

打开浏览器访问：`http://localhost:3000`

---

## 开发环境配置

### 推荐工具

#### VS Code 扩展

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

#### 必备扩展

- **ESLint**: JavaScript/TypeScript 代码检查
- **Prettier**: 代码格式化
- **Tailwind CSS IntelliSense**: Tailwind 类名提示
- **Prisma**: 数据库 ORM 支持
- **TypeScript**: TypeScript 语言支持

### VS Code 配置

创建 `.vscode/settings.json`：

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

---

## 项目结构

### 目录说明

```
ai-novel-writer/
├── docs/                    # 📚 文档
│   ├── DESIGN.md           # 系统设计文档
│   ├── API.md              # API 文档
│   ├── DEVELOPMENT.md      # 开发指南（本文档）
│   └── PROGRESS.md         # 开发进度
├── prisma/
│   └── schema.prisma       # ✅ 数据模型定义
├── public/                 # 静态资源
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (dashboard)/   # 仪表盘路由组
│   │   ├── api/           # API Routes
│   │   ├── layout.tsx     # 根布局
│   │   └── page.tsx       # 首页
│   ├── components/        # React 组件
│   │   ├── ui/           # ✅ shadcn/ui 组件
│   │   ├── editor/       # 编辑器组件
│   │   ├── project/      # 项目组件
│   │   ├── character/    # 角色组件
│   │   ├── world/        # 世界观组件
│   │   └── ai/           # AI 交互组件
│   ├── lib/              # ✅ 核心逻辑
│   │   ├── ai/          # AI 引擎
│   │   ├── db/          # 数据库
│   │   ├── store/       # 状态管理
│   │   └── utils/       # 工具函数
│   ├── types/           # ✅ TypeScript 类型
│   └── hooks/           # 自定义 Hooks
├── .env.example          # ✅ 环境变量示例
├── .env.local           # ✅ 环境变量配置（不提交）
├── next.config.ts       # ✅ Next.js 配置
├── tailwind.config.ts   # ✅ Tailwind 配置
├── tsconfig.json        # ✅ TypeScript 配置
└── package.json         # ✅ 依赖配置
```

### 文件命名规范

```
组件文件：       PascalCase  (e.g., ProjectCard.tsx)
工具文件：       kebab-case  (e.g., text-processing.ts)
API 路由：       kebab-case  (e.g., route.ts)
类型文件：       kebab-case  (e.g., project-types.ts)
Hooks：         camelCase   (e.g., useProjectStore.ts)
```

---

## 开发工作流

### Git 工作流

```bash
# 1. 创建功能分支
git checkout -b feature/project-management

# 2. 开发功能
# ... 编写代码 ...

# 3. 提交代码
git add .
git commit -m "feat: 实现项目管理功能"

# 4. 推送到远程
git push origin feature/project-management

# 5. 创建 Pull Request（如果使用 GitHub/GitLab）
```

### Commit 规范

使用 Conventional Commits：

```
feat:     新功能
fix:      Bug 修复
docs:     文档更新
style:    代码格式调整
refactor: 代码重构
perf:     性能优化
test:     测试相关
chore:    构建/工具链相关
```

示例：
```bash
git commit -m "feat: 添加项目列表 API"
git commit -m "fix: 修复章节字数统计问题"
git commit -m "docs: 更新 API 文档"
```

### 分支策略

```
main          - 生产环境
develop       - 开发环境
feature/*     - 功能分支
bugfix/*      - Bug 修复分支
hotfix/*      - 紧急修复分支
```

---

## 代码规范

### TypeScript 规范

#### 类型定义

```typescript
// ✅ 推荐：使用接口定义对象类型
interface User {
  id: string
  name: string
  email: string
}

// ✅ 推荐：使用类型定义联合类型
type Status = 'draft' | 'writing' | 'completed'

// ❌ 避免：使用 any
const data: any = fetchData()

// ✅ 推荐：使用 unknown 或具体类型
const data: unknown = fetchData()
```

#### 函数定义

```typescript
// ✅ 推荐：明确参数和返回类型
async function getProject(id: string): Promise<Project | null> {
  return await prisma.project.findUnique({ where: { id } })
}

// ✅ 推荐：使用泛型
function findById<T>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id)
}
```

### React 规范

#### 组件定义

```typescript
// ✅ 推荐：使用函数组件 + Hooks
interface ProjectCardProps {
  project: Project
  onEdit?: (id: string) => void
}

export function ProjectCard({ project, onEdit }: ProjectCardProps) {
  return (
    <div className="project-card">
      <h2>{project.title}</h2>
      {onEdit && (
        <button onClick={() => onEdit(project.id)}>
          编辑
        </button>
      )}
    </div>
  )
}
```

#### Server vs Client Components

```typescript
// ✅ Server Component：数据获取、静态内容
// app/projects/page.tsx
export default async function ProjectsPage() {
  const projects = await prisma.project.findMany()
  return <ProjectList projects={projects} />
}

// ✅ Client Component：交互、状态管理
// components/project/project-card.tsx
'use client'

export function ProjectCard({ project }: { project: Project }) {
  const [isEditing, setIsEditing] = useState(false)
  return <div>...</div>
}
```

#### Hooks 使用

```typescript
// ✅ 推荐：自定义 Hook 复用逻辑
function useProject(projectId: string) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProject(projectId).then(data => {
      setProject(data)
      setLoading(false)
    })
  }, [projectId])

  return { project, loading }
}
```

### 样式规范

#### Tailwind CSS

```typescript
// ✅ 推荐：使用 cn() 工具函数合并类名
import { cn } from '@/lib/utils'

export function Button({ className, ...props }) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-lg",
        "bg-primary text-primary-foreground",
        "hover:bg-primary/90",
        className
      )}
      {...props}
    />
  )
}

// ✅ 推荐：提取可复用的样式
const cardStyles = cn(
  "rounded-lg border bg-card text-card-foreground shadow-sm"
)
```

#### 响应式设计

```typescript
// ✅ 推荐：移动优先
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  <h1 className="text-2xl sm:text-3xl lg:text-4xl">
    响应式标题
  </h1>
</div>
```

### API 路由规范

```typescript
// ✅ 推荐：使用 Zod 验证
import { z } from 'zod'

const CreateProjectSchema = z.object({
  title: z.string().min(1).max(200),
  genre: z.enum(['玄幻', '科幻', '都市']),
})

export async function POST(req: Request) {
  const body = await req.json()

  // 验证输入
  const result = CreateProjectSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    )
  }

  // 业务逻辑
  const project = await prisma.project.create({
    data: result.data,
  })

  return NextResponse.json({ success: true, data: { project } })
}
```

---

## 测试指南

### 单元测试

使用 Vitest：

```bash
npm install -D vitest @testing-library/react
```

**示例**：

```typescript
// lib/utils/__tests__/text-processing.test.ts
import { describe, it, expect } from 'vitest'
import { countWords } from '../text-processing'

describe('countWords', () => {
  it('should count Chinese characters', () => {
    expect(countWords('你好世界')).toBe(4)
  })

  it('should count English words', () => {
    expect(countWords('Hello world')).toBe(2)
  })
})
```

### 组件测试

```typescript
// components/project/__tests__/project-card.test.tsx
import { render, screen } from '@testing-library/react'
import { ProjectCard } from '../project-card'

describe('ProjectCard', () => {
  it('renders project title', () => {
    const project = { id: '1', title: '测试项目' }
    render(<ProjectCard project={project} />)
    expect(screen.getByText('测试项目')).toBeInTheDocument()
  })
})
```

### API 测试

```typescript
// app/api/projects/__tests__/route.test.ts
import { POST } from '../route'

describe('POST /api/projects', () => {
  it('should create a project', async () => {
    const req = new Request('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify({ title: '新项目', genre: '玄幻' }),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.success).toBe(true)
  })
})
```

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式
npm test -- --watch

# 覆盖率
npm test -- --coverage
```

---

## 调试技巧

### VS Code 调试配置

创建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "Next.js: debug full stack",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev",
      "serverReadyAction": {
        "pattern": "started server on .+, url: (https?://.+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      }
    }
  ]
}
```

### Console 调试

```typescript
// ✅ 推荐：使用 console.log 调试
console.log('Project data:', project)

// ✅ 推荐：使用 console.table 显示表格数据
console.table(projects)

// ✅ 推荐：使用 console.group 分组
console.group('Project Creation')
console.log('Title:', title)
console.log('Genre:', genre)
console.groupEnd()

// ✅ 推荐：使用 console.time 测性能
console.time('Project Fetch')
const projects = await fetchProjects()
console.timeEnd('Project Fetch')
```

### Prisma 调试

```typescript
// 开发环境启用日志
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})

// 查看生成的 SQL
// 会在控制台输出：
// prisma:query SELECT * FROM "Project"
```

### API 调试

使用 curl：

```bash
# 测试创建项目
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"title":"测试项目","genre":"玄幻"}'
```

使用 Postman/Thunder Client：
- 导入 API 文档
- 保存环境变量
- 自动化测试

---

## 部署指南

### 构建生产版本

```bash
# 1. 构建
npm run build

# 2. 启动生产服务器
npm run start

# 或使用 PM2
npm install -g pm2
pm2 start npm --name "ai-novel-writer" -- start
pm2 save
pm2 startup
```

### Docker 部署

创建 `Dockerfile`：

```dockerfile
FROM node:20-alpine AS base

# 安装依赖
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 构建应用
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 生产镜像
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

构建和运行：

```bash
docker build -t ai-novel-writer .
docker run -p 3000:3000 --env-file .env.local ai-novel-writer
```

### Vercel 部署

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel

# 4. 设置环境变量
vercel env add GOOGLE_GENERATIVE_AI_API_KEY

# 5. 生产部署
vercel --prod
```

---

## 常见问题

### 开发问题

#### Q: 端口被占用

```bash
# 查找占用 3000 端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或使用其他端口
PORT=3001 npm run dev
```

#### Q: Prisma 迁移失败

```bash
# 重置数据库
npx prisma migrate reset

# 重新生成客户端
npx prisma generate

# 创建新迁移
npx prisma migrate dev --name init
```

#### Q: TypeScript 类型错误

```bash
# 重新生成类型
npx prisma generate

# 重启 TypeScript 服务器
# 在 VS Code 中: Cmd/Ctrl + Shift + P -> TypeScript: Restart TS Server
```

### AI 生成问题

#### Q: Gemini API 调用失败

**检查清单**：
1. API Key 是否正确配置？
2. 是否有足够的 API 配额？
3. 网络连接是否正常？
4. 模型名称是否正确？

**调试**：
```typescript
console.log('API Key configured:', !!process.env.GOOGLE_GENERATIVE_AI_API_KEY)
console.log('Model:', model)
```

#### Q: 生成速度慢

**优化建议**：
1. 使用 `gemini-2.5-flash` 而非 `gemini-2.5-pro`
2. 减少上下文长度
3. 分段生成而非一次性生成
4. 启用流式输出

### 性能问题

#### Q: 页面加载慢

**排查**：
1. 打开 Chrome DevTools -> Network
2. 查看加载慢的资源
3. 检查数据库查询（Prisma 日志）
4. 使用 `next build` 分析包大小

**优化**：
```typescript
// ✅ 使用动态导入
const Editor = dynamic(() => import('@/components/editor/editor'), {
  loading: () => <p>加载中...</p>,
})

// ✅ 限制返回字段
const projects = await prisma.project.findMany({
  select: {
    id: true,
    title: true,
    // 不返回大字段
  },
})
```

#### Q: 内存占用高

**排查**：
```bash
# 查看内存使用
npm install -g memory-usage
memory-usage

# Node.js 内存分析
node --heap-prof
```

**优化**：
- 使用流式处理大数据
- 限制上下文大小
- 定期清理缓存

---

## 开发技巧

### 快捷键

#### VS Code

- `Cmd/Ctrl + P`: 快速打开文件
- `Cmd/Ctrl + Shift + F`: 全局搜索
- `Cmd/Ctrl + `` : 打开终端
- `F12`: 转到定义
- `Shift + F12`: 查找引用

#### Next.js

- `npm run dev`: 启动开发服务器
- `npm run build`: 构建生产版本
- `npm run lint`: 运行 ESLint
- `npm run type-check`: TypeScript 类型检查

### 有用的 NPM 脚本

在 `package.json` 中添加：

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:reset": "prisma migrate reset",
    "db:studio": "prisma studio",
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

---

## 资源链接

### 官方文档

- [Next.js 15](https://nextjs.org/docs)
- [Prisma](https://www.prisma.io/docs)
- [TypeScript](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Gemini API](https://ai.google.dev/docs)

### 社区资源

- [Next.js GitHub](https://github.com/vercel/next.js)
- [shadcn/ui](https://ui.shadcn.com)
- [TipTap](https://tiptap.dev)
- [Zustand](https://zustand-demo.pmnd.rs)

---

**文档维护**：开发指南随项目进展持续更新

**最后更新**：2025-01-04
