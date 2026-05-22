# API 接口文档

## 📋 文档信息

- **项目名称**：AI Novel Writer API
- **版本**：v1.0.0
- **基础路径**：`/api`
- **协议**：HTTP/HTTPS
- **数据格式**：JSON

---

## 📐 目录

1. [通用规范](#通用规范)
2. [项目管理 API](#项目管理-api)
3. [章节管理 API](#章节管理-api)
4. [AI 生成 API](#ai-生成-api)
5. [角色管理 API](#角色管理-api)
6. [世界观管理 API](#世界观管理-api)
7. [大纲管理 API](#大纲管理-api)
8. [导出 API](#导出-api)
9. [统计 API](#统计-api)
10. [伏笔管理 API](#伏笔管理-api)
11. [角色快照 API](#角色快照-api)
12. [渐进式大纲 API](#渐进式大纲-api)
13. [章节分析 API](#章节分析-api)

---

## 通用规范

### 请求格式

#### Headers

```http
Content-Type: application/json
Accept: application/json
```

#### 响应格式

**成功响应**：
```json
{
  "success": true,
  "data": {
    // 响应数据
  },
  "error": null
}
```

**错误响应**：
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  }
}
```

### HTTP 状态码

| 状态码 | 说明 |
|-------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

### 错误码

| 错误码 | 说明 |
|-------|------|
| `INVALID_PARAMS` | 参数验证失败 |
| `PROJECT_NOT_FOUND` | 项目不存在 |
| `CHAPTER_NOT_FOUND` | 章节不存在 |
| `AI_GENERATION_FAILED` | AI 生成失败 |
| `DATABASE_ERROR` | 数据库错误 |

---

## 项目管理 API

### 获取项目列表

**端点**：`GET /api/projects`

**查询参数**：
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| `page` | number | 否 | 页码，默认 1 |
| `limit` | number | 否 | 每页数量，默认 10 |
| `status` | string | 否 | 状态筛选（draft/writing/completed） |
| `genre` | string | 否 | 类型筛选 |

**响应示例**：
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "clx1234567890",
        "title": "仙侠世界",
        "description": "一个修仙少年的成长故事",
        "genre": "玄幻",
        "status": "writing",
        "totalWords": 150000,
        "chapterCount": 50,
        "coverImage": null,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-04T12:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

---

### 创建项目

**端点**：`POST /api/projects`

**请求体**：
```json
{
  "title": "仙侠世界",
  "description": "一个修仙少年的成长故事",
  "genre": "玄幻",
  "tags": ["修仙", "热血", "升级流"],
  "status": "draft"
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "clx1234567890",
      "title": "仙侠世界",
      "description": "一个修仙少年的成长故事",
      "genre": "玄幻",
      "tags": "[\"修仙\",\"热血\",\"升级流\"]",
      "status": "draft",
      "totalWords": 0,
      "chapterCount": 0,
      "createdAt": "2025-01-04T12:00:00.000Z",
      "updatedAt": "2025-01-04T12:00:00.000Z"
    }
  }
}
```

**验证规则**：
- `title`: 必填，长度 1-200 字符
- `genre`: 必填，可选值见类型表
- `status`: 可选，默认 `draft`

---

### 获取项目详情

**端点**：`GET /api/projects/[id]`

**路径参数**：
- `id`: 项目 ID

**响应示例**：
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "clx1234567890",
      "title": "仙侠世界",
      "description": "一个修仙少年的成长故事",
      "genre": "玄幻",
      "tags": "[\"修仙\",\"热血\",\"升级流\"]",
      "status": "writing",
      "totalWords": 150000,
      "chapterCount": 50,
      "coverImage": null,
      "chapters": [
        {
          "id": "clx1111111111",
          "chapterNumber": 1,
          "title": "第一章 初入仙门",
          "wordCount": 3000
        }
      ],
      "characters": [],
      "worldElements": [],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-04T12:00:00.000Z"
    }
  }
}
```

---

### 更新项目

**端点**：`PUT /api/projects/[id]`

**路径参数**：
- `id`: 项目 ID

**请求体**：
```json
{
  "title": "仙侠世界（修订版）",
  "description": "更新后的简介",
  "genre": "玄幻",
  "status": "writing"
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "clx1234567890",
      "title": "仙侠世界（修订版）",
      "description": "更新后的简介",
      "genre": "玄幻",
      "status": "writing",
      "updatedAt": "2025-01-04T13:00:00.000Z"
    }
  }
}
```

---

### 删除项目

**端点**：`DELETE /api/projects/[id]`

**路径参数**：
- `id`: 项目 ID

**响应示例**：
```json
{
  "success": true,
  "data": {
    "deleted": true,
    "message": "项目已删除"
  }
}
```

**注意**：删除项目会级联删除所有关联数据（章节、角色、世界观等）

---

## 章节管理 API

### 获取章节列表

**端点**：`GET /api/projects/[projectId]/chapters`

**路径参数**：
- `projectId`: 项目 ID

**查询参数**：
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| `page` | number | 否 | 页码，默认 1 |
| `limit` | number | 否 | 每页数量，默认 20 |
| `orderBy` | string | 否 | 排序字段（chapterNumber/createdAt） |
| `order` | string | 否 | 排序方向（asc/desc） |

**响应示例**：
```json
{
  "success": true,
  "data": {
    "chapters": [
      {
        "id": "clx1111111111",
        "chapterNumber": 1,
        "title": "第一章 初入仙门",
        "wordCount": 3000,
        "summary": "主角初次踏入修仙世界",
        "createdAt": "2025-01-02T00:00:00.000Z",
        "updatedAt": "2025-01-02T01:00:00.000Z"
      },
      {
        "id": "clx2222222222",
        "chapterNumber": 2,
        "title": "第二章 奇遇",
        "wordCount": 3500,
        "summary": "主角在森林中遇到奇遇",
        "createdAt": "2025-01-03T00:00:00.000Z",
        "updatedAt": "2025-01-03T01:00:00.000Z"
      }
    ],
    "total": 2,
    "page": 1,
    "limit": 20
  }
}
```

---

### 创建章节

**端点**：`POST /api/projects/[projectId]/chapters`

**路径参数**：
- `projectId`: 项目 ID

**请求体**：
```json
{
  "chapterNumber": 1,
  "title": "第一章 初入仙门",
  "content": "# 第一章 初入仙门\n\n这是章节内容...",
  "summary": "主角初次踏入修仙世界"
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "chapter": {
      "id": "clx1111111111",
      "chapterNumber": 1,
      "title": "第一章 初入仙门",
      "content": "# 第一章 初入仙门\n\n这是章节内容...",
      "wordCount": 3000,
      "summary": "主角初次踏入修仙世界",
      "createdAt": "2025-01-04T14:00:00.000Z",
      "updatedAt": "2025-01-04T14:00:00.000Z"
    }
  }
}
```

**验证规则**：
- `chapterNumber`: 必填，在项目中唯一
- `title`: 必填，长度 1-200 字符
- `content`: 可选，Markdown 格式
- `wordCount`: 自动计算

---

### 获取章节内容

**端点**：`GET /api/projects/[projectId]/chapters/[chapterId]`

**路径参数**：
- `projectId`: 项目 ID
- `chapterId`: 章节 ID

**响应示例**：
```json
{
  "success": true,
  "data": {
    "chapter": {
      "id": "clx1111111111",
      "chapterNumber": 1,
      "title": "第一章 初入仙门",
      "content": "# 第一章 初入仙门\n\n这是章节内容...",
      "wordCount": 3000,
      "summary": "主角初次踏入修仙世界",
      "notes": "本章需要补充环境描写",
      "scenes": [],
      "createdAt": "2025-01-02T00:00:00.000Z",
      "updatedAt": "2025-01-02T01:00:00.000Z"
    }
  }
}
```

---

### 更新章节

**端点**：`PUT /api/projects/[projectId]/chapters/[chapterId]`

**路径参数**：
- `projectId`: 项目 ID
- `chapterId`: 章节 ID

**请求体**：
```json
{
  "title": "第一章 初入仙门（修订）",
  "content": "更新后的内容...",
  "summary": "更新后的摘要"
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "chapter": {
      "id": "clx1111111111",
      "chapterNumber": 1,
      "title": "第一章 初入仙门（修订）",
      "content": "更新后的内容...",
      "wordCount": 3500,
      "updatedAt": "2025-01-04T15:00:00.000Z"
    }
  }
}
```

---

### 删除章节

**端点**：`DELETE /api/projects/[projectId]/chapters/[chapterId]`

**路径参数**：
- `projectId`: 项目 ID
- `chapterId`: 章节 ID

**响应示例**：
```json
{
  "success": true,
  "data": {
    "deleted": true,
    "message": "章节已删除"
  }
}
```

---

## AI 生成 API

### AI 生成大纲 ⭐

**端点**：`POST /api/ai/generate/outline`

**请求体**：
```json
{
  "projectId": "clx1234567890",
  "genre": "玄幻",
  "coreIdea": "一个修仙少年的成长故事",
  "style": "热血升级流",
  "targetWords": 100000,
  "chapterCount": 50,
  "model": "gpt-4o-mini"
}
```

**响应**：流式输出（Server-Sent Events）

```typescript
// 事件格式
data: {"type": "token", "content": "第"}
data: {"type": "token", "content": "一"}
data: {"type": "token", "content": "章"}
data: {"type": "done", "outline": {...}}
```

**完整响应示例**：
```json
{
  "success": true,
  "data": {
    "outline": {
      "storySummary": "故事梗概...",
      "mainConflict": "核心冲突...",
      "characters": [
        {
          "name": "张三",
          "role": "主角",
          "description": "修仙少年",
          "personality": "坚毅、热血",
          "goal": "成为最强修仙者"
        }
      ],
      "worldSettings": [
        {
          "type": "地理",
          "name": "九州大陆",
          "description": "修仙世界的主要大陆"
        }
      ],
      "chapters": [
        {
          "chapterNumber": 1,
          "title": "初入仙门",
          "summary": "主角初次踏入修仙世界",
          "keyEvents": ["测试天赋", "拜入宗门"],
          "characters": ["张三"],
          "estimatedWords": 3000
        }
      ],
      "plotTwists": [
        {
          "chapterNumber": 10,
          "description": "主角发现身世之谜"
        }
      ]
    },
    "generationId": "clx9999999999",
    "tokensUsed": {
      "promptTokens": 500,
      "completionTokens": 2000,
      "totalTokens": 2500
    },
    "cost": 0.005,
    "duration": 5000
  }
}
```

---

### AI 生成章节 ⭐⭐⭐

**端点**：`POST /api/ai/generate/chapter`

**请求体**：
```json
{
  "projectId": "clx1234567890",
  "chapterNumber": 1,
  "chapterTitle": "第一章 初入仙门",
  "chapterOutline": "主角初次踏入修仙世界，测试天赋，拜入宗门",
  "targetWords": 3000,
  "model": "gemini-2.5-pro"
}
```

**响应**：流式输出（Server-Sent Events）

```typescript
// 开始生成
data: {"type":"start"}

// 场景级进度更新；当前不会逐 token 输出正文
data: {"type":"progress","content":"已完成第 1 个场景","scene":1,"totalScenes":3}

// 完成后返回新章节信息
data: {
  "type": "done",
  "data": {
    "chapterId": "clx1111111111",
    "content": "完整章节内容...",
    "wordCount": 3200
  }
}

// 失败时返回错误；不会创建空章节
data: {"type":"error","error":"生成失败原因"}
```

**响应字段**：
- `type`: 事件类型
  - `start`: 开始生成
  - `progress`: 场景级进度更新
  - `done`: 生成完成，`data` 内包含章节 ID、正文和字数
  - `error`: 生成失败

**完成事件数据**：
```json
{
  "chapterId": "clx1111111111",
  "content": "# 第一章 初入仙门\n\n完整内容...",
  "wordCount": 3200
}
```

**副作用**：
- 创建新的 `Chapter` 记录
- 更新项目 `totalWords` / `chapterCount`
- 创建 `Generation` 记录，并回填 `targetId` 为新章节 ID
- 若同项目章节号已存在，返回 `INVALID_PARAMS` 错误
- 若 AI provider 返回失败或空输出，中止生成且不创建空章节


---

### AI 续写内容

**端点**：`POST /api/ai/continue`

**请求体**：
```json
{
  "projectId": "clx1234567890",
  "chapterId": "clx1111111111",
  "currentContent": "当前已写的内容...",
  "targetWords": 1000,
  "model": "gpt-4o-mini"
}
```

**响应**：流式输出（同章节生成）

---

### AI 生成角色

**端点**：`POST /api/ai/generate/character`

**请求体**：
```json
{
  "projectId": "clx1234567890",
  "role": "主角",
  "storyContext": "玄幻修仙世界",
  "requirements": "性格坚毅，有正义感"
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "character": {
      "name": "张三",
      "nickname": "小三",
      "age": 16,
      "gender": "男",
      "appearance": "清秀少年，眼神坚毅",
      "personality": ["坚毅", "热血", "正义感"],
      "backstory": "出身贫寒，渴望改变命运",
      "motivation": "保护家人，成为强者",
      "dialogueStyle": "直接坦率，不善言辞",
      "dialogueExample": ["我一定会成功的！", "绝不让别人欺负我的家人"],
      "characterArc": "从懵懂少年成长为一代宗师"
    },
    "generationId": "clx8888888888"
  }
}
```

---

### AI 生成世界观元素

**端点**：`POST /api/ai/generate/world-element`

**请求体**：
```json
{
  "projectId": "clx1234567890",
  "elementType": "location",
  "storyContext": "玄幻修仙世界",
  "requirements": "宗门所在的山脉"
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "element": {
      "type": "location",
      "name": "青云山脉",
      "description": "连绵千里的山脉，云雾缭绕，灵气充沛...",
      "attributes": {
        "location": "九州大陆东部",
        "area": "十万平方公里",
        "majorForces": ["青云宗", "玄天门"],
        "specialResources": ["灵石矿", "灵药园"]
      },
      "rules": [
        "山脉深处有妖兽出没",
        "只有筑基期修士才能深入"
      ]
    },
    "generationId": "clx7777777777"
  }
}
```

---

## 角色管理 API

### 获取角色列表

**端点**：`GET /api/projects/[projectId]/characters`

**响应示例**：
```json
{
  "success": true,
  "data": {
    "characters": [
      {
        "id": "clx1111111111",
        "name": "张三",
        "nickname": "小三",
        "age": 16,
        "gender": "男",
        "personality": "坚毅、热血",
        "motivation": "成为最强修仙者",
        "avatar": null,
        "createdAt": "2025-01-02T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 创建角色

**端点**：`POST /api/projects/[projectId]/characters`

**请求体**：
```json
{
  "name": "张三",
  "nickname": "小三",
  "age": 16,
  "gender": "男",
  "appearance": "清秀少年",
  "personality": "坚毅、热血",
  "backstory": "出身贫寒",
  "motivation": "成为最强修仙者",
  "dialogueStyle": "直接坦率"
}
```

---

## 世界观管理 API

### 获取世界观元素

**端点**：`GET /api/projects/[projectId]/world`

**查询参数**：
- `type`: 元素类型（location/history/magic/organization/item/other）

**响应示例**：
```json
{
  "success": true,
  "data": {
    "elements": [
      {
        "id": "clx1111111111",
        "type": "location",
        "name": "青云山脉",
        "description": "连绵千里的山脉...",
        "attributes": "{\"location\":\"九州大陆东部\"}",
        "createdAt": "2025-01-02T00:00:00.000Z"
      }
    ]
  }
}
```

---

## 大纲管理 API

### 获取大纲树

**端点**：`GET /api/projects/[projectId]/outline`

**响应示例**：
```json
{
  "success": true,
  "data": {
    "outline": [
      {
        "id": "clx1111111111",
        "type": "volume",
        "order": 1,
        "title": "第一卷：初入修仙",
        "children": [
          {
            "id": "clx2222222222",
            "type": "chapter",
            "order": 1,
            "title": "第一章 初入仙门",
            "children": [
              {
                "id": "clx3333333333",
                "type": "scene",
                "order": 1,
                "title": "场景1：测试天赋",
                "children": []
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## 导出 API

### 导出 Markdown

**端点**：`GET /api/projects/[projectId]/export/md`

**响应**：
- Content-Type: `text/markdown`
- 文件名: `{project-title}.md`

---

### 导出 PDF

**端点**：`GET /api/projects/[projectId]/export/pdf`

**响应**：
- Content-Type: `application/pdf`
- 文件名: `{project-title}.pdf`

---

### 导出 EPUB

**端点**：`GET /api/projects/[projectId]/export/epub`

**响应**：
- Content-Type: `application/epub+zip`
- 文件名: `{project-title}.epub`

---

## 统计 API

### 项目统计

**端点**：`GET /api/projects/[projectId]/stats`

**响应示例**：
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalWords": 150000,
      "chapterCount": 50,
      "characterCount": 20,
      "worldElementCount": 15,
      "averageChapterWords": 3000,
      "totalCost": 5.50,
      "totalGenerations": 100,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "lastUpdatedAt": "2025-01-04T12:00:00.000Z"
    }
  }
}
```

---

## 流式输出说明

### Server-Sent Events (SSE)

**连接**：
```javascript
const eventSource = new EventSource('/api/ai/generate/chapter')

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)

  switch (data.type) {
    case 'token':
      // 追加文本
      appendContent(data.content)
      break
    case 'progress':
      // 更新进度
      updateProgress(data.scene, data.totalScenes)
      break
    case 'done':
      // 完成
      eventSource.close()
      break
    case 'error':
      // 错误处理
      handleError(data.error)
      break
  }
}
```

**错误处理**：
```javascript
eventSource.onerror = (error) => {
  console.error('SSE error:', error)
  eventSource.close()
}
```

---

## 速率限制

### 规则

| 端点类型 | 限制 |
|---------|------|
| AI 生成 | 10 次/分钟 |
| CRUD 操作 | 100 次/分钟 |
| 导出 | 5 次/分钟 |

### 响应头

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704350400
```

### 超限响应

**状态码**：429 Too Many Requests

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "请求过于频繁，请稍后再试",
    "retryAfter": 60
  }
}
```

---

## 数据验证

### Zod Schemas

```typescript
// 项目创建
const CreateProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  genre: z.enum(['玄幻', '科幻', '都市', '言情', '武侠', '其他']),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'writing', 'completed']).optional()
})

// 章节创建
const CreateChapterSchema = z.object({
  chapterNumber: z.number().int().positive(),
  title: z.string().min(1).max(200),
  content: z.string().optional(),
  summary: z.string().optional()
})
```

---

## WebSocket 支持（未来）

### 连接

```javascript
const ws = new WebSocket('ws://localhost:3000/ws')

ws.onopen = () => {
  console.log('WebSocket connected')
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  // 处理消息
}
```

### 消息格式

```json
{
  "type": "generation.progress",
  "data": {
    "chapterId": "clx1111111111",
    "progress": 50,
    "currentContent": "..."
  }
}
```

---

## 伏笔管理 API

### 创建伏笔

**请求**：
- 方法：`POST`
- 路径：`/api/foreshadowings`

**请求体**：
```json
{
  "projectId": "clx1234567890",
  "title": "主角身世之谜",
  "description": "主角的真实身份是上古大能的转世",
  "type": "mystery",
  "importance": "high",
  "plantChapterId": "clx1111111111",
  "targetResolveChapter": 50,
  "tags": ["身世", "转世", "上古"]
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "foreshadowing": {
      "id": "clx5555555555",
      "projectId": "clx1234567890",
      "title": "主角身世之谜",
      "description": "主角的真实身份是上古大能的转世",
      "type": "mystery",
      "importance": "high",
      "status": "planned",
      "plantChapterId": "clx1111111111",
      "targetResolveChapter": 50,
      "tags": "[\"身世\",\"转世\",\"上古\"]",
      "createdAt": "2025-01-04T16:00:00.000Z",
      "updatedAt": "2025-01-04T16:00:00.000Z"
    }
  }
}
```

**示例**：
```typescript
const response = await fetch('/api/foreshadowings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'clx1234567890',
    title: '主角身世之谜',
    description: '主角的真实身份是上古大能的转世',
    type: 'mystery',
    importance: 'high',
    plantChapterId: 'clx1111111111',
    targetResolveChapter: 50,
    tags: ['身世', '转世', '上古']
  })
});
```

---

### 获取项目所有伏笔

**请求**：
- 方法：`GET`
- 路径：`/api/projects/:projectId/foreshadowings`

**路径参数**：
- `projectId`: 项目 ID

**查询参数**：
- `status`: 状态筛选（planned/planted/resolved/abandoned）（可选）
- `type`: 类型筛选（mystery/conflict/prophecy/item/relationship/other）（可选）
- `importance`: 重要性筛选（low/medium/high）（可选）

**响应**：
```json
{
  "success": true,
  "data": {
    "foreshadowings": [
      {
        "id": "clx5555555555",
        "title": "主角身世之谜",
        "description": "主角的真实身份是上古大能的转世",
        "type": "mystery",
        "importance": "high",
        "status": "planted",
        "plantChapterId": "clx1111111111",
        "plantChapterNumber": 1,
        "targetResolveChapter": 50,
        "resolveChapterId": null,
        "tags": "[\"身世\",\"转世\",\"上古\"]",
        "createdAt": "2025-01-04T16:00:00.000Z"
      }
    ]
  }
}
```

**示例**：
```typescript
// 获取所有待回收的伏笔
const response = await fetch('/api/projects/clx1234567890/foreshadowings?status=planted');
const data = await response.json();
```

---

### 获取单个伏笔

**请求**：
- 方法：`GET`
- 路径：`/api/foreshadowings/:id`

**路径参数**：
- `id`: 伏笔 ID

**响应**：
```json
{
  "success": true,
  "data": {
    "foreshadowing": {
      "id": "clx5555555555",
      "projectId": "clx1234567890",
      "title": "主角身世之谜",
      "description": "主角的真实身份是上古大能的转世",
      "type": "mystery",
      "importance": "high",
      "status": "planted",
      "plantChapterId": "clx1111111111",
      "plantChapterNumber": 1,
      "plantContent": "老者看着主角，眼中闪过一丝异样...",
      "targetResolveChapter": 50,
      "resolveChapterId": null,
      "resolveChapterNumber": null,
      "resolveContent": null,
      "tags": "[\"身世\",\"转世\",\"上古\"]",
      "notes": "需要在第30章左右开始铺垫",
      "createdAt": "2025-01-04T16:00:00.000Z",
      "updatedAt": "2025-01-04T16:30:00.000Z"
    }
  }
}
```

**示例**：
```typescript
const response = await fetch('/api/foreshadowings/clx5555555555');
const data = await response.json();
```

---

### 更新伏笔

**请求**：
- 方法：`PUT`
- 路径：`/api/foreshadowings/:id`

**路径参数**：
- `id`: 伏笔 ID

**请求体**：
```json
{
  "title": "主角身世之谜（更新）",
  "description": "更新后的描述",
  "importance": "high",
  "targetResolveChapter": 55,
  "notes": "调整回收章节"
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "foreshadowing": {
      "id": "clx5555555555",
      "title": "主角身世之谜（更新）",
      "description": "更新后的描述",
      "importance": "high",
      "targetResolveChapter": 55,
      "notes": "调整回收章节",
      "updatedAt": "2025-01-04T17:00:00.000Z"
    }
  }
}
```

**示例**：
```typescript
const response = await fetch('/api/foreshadowings/clx5555555555', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    targetResolveChapter: 55,
    notes: '调整回收章节'
  })
});
```

---

### 删除伏笔

**请求**：
- 方法：`DELETE`
- 路径：`/api/foreshadowings/:id`

**路径参数**：
- `id`: 伏笔 ID

**响应**：
```json
{
  "success": true,
  "data": {
    "deleted": true,
    "message": "伏笔已删除"
  }
}
```

**示例**：
```typescript
const response = await fetch('/api/foreshadowings/clx5555555555', {
  method: 'DELETE'
});
```

---

### 埋设伏笔

**请求**：
- 方法：`POST`
- 路径：`/api/foreshadowings/:id/plant`

**路径参数**：
- `id`: 伏笔 ID

**请求体**：
```json
{
  "plantChapterId": "clx1111111111",
  "plantContent": "老者看着主角，眼中闪过一丝异样的光芒，似乎看出了什么..."
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "foreshadowing": {
      "id": "clx5555555555",
      "status": "planted",
      "plantChapterId": "clx1111111111",
      "plantChapterNumber": 1,
      "plantContent": "老者看着主角，眼中闪过一丝异样的光芒，似乎看出了什么...",
      "updatedAt": "2025-01-04T18:00:00.000Z"
    }
  }
}
```

**示例**：
```typescript
const response = await fetch('/api/foreshadowings/clx5555555555/plant', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    plantChapterId: 'clx1111111111',
    plantContent: '老者看着主角，眼中闪过一丝异样的光芒...'
  })
});
```

---

### 回收伏笔

**请求**：
- 方法：`POST`
- 路径：`/api/foreshadowings/:id/resolve`

**路径参数**：
- `id`: 伏笔 ID

**请求体**：
```json
{
  "resolveChapterId": "clx6666666666",
  "resolveContent": "原来主角正是千年前那位上古大能的转世，一切谜团终于揭开..."
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "foreshadowing": {
      "id": "clx5555555555",
      "status": "resolved",
      "resolveChapterId": "clx6666666666",
      "resolveChapterNumber": 50,
      "resolveContent": "原来主角正是千年前那位上古大能的转世，一切谜团终于揭开...",
      "updatedAt": "2025-01-04T19:00:00.000Z"
    }
  }
}
```

**示例**：
```typescript
const response = await fetch('/api/foreshadowings/clx5555555555/resolve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    resolveChapterId: 'clx6666666666',
    resolveContent: '原来主角正是千年前那位上古大能的转世...'
  })
});
```

---

### 获取待回收伏笔

**请求**：
- 方法：`GET`
- 路径：`/api/projects/:projectId/foreshadowings/pending`

**路径参数**：
- `projectId`: 项目 ID

**查询参数**：
- `currentChapter`: 当前章节号（可选，用于筛选应该在当前章节回收的伏笔）

**响应**：
```json
{
  "success": true,
  "data": {
    "pending": [
      {
        "id": "clx5555555555",
        "title": "主角身世之谜",
        "description": "主角的真实身份是上古大能的转世",
        "type": "mystery",
        "importance": "high",
        "status": "planted",
        "plantChapterId": "clx1111111111",
        "plantChapterNumber": 1,
        "targetResolveChapter": 50,
        "shouldResolveNow": true,
        "overdue": false,
        "chaptersPlanted": 49
      }
    ]
  }
}
```

**示例**：
```typescript
// 获取当前应该回收的伏笔
const response = await fetch('/api/projects/clx1234567890/foreshadowings/pending?currentChapter=50');
const data = await response.json();
```

---

### 获取伏笔提醒

**请求**：
- 方法：`GET`
- 路径：`/api/projects/:projectId/foreshadowings/reminders`

**路径参数**：
- `projectId`: 项目 ID

**查询参数**：
- `currentChapter`: 当前章节号（必填）
- `lookAhead`: 提前提醒的章节数（可选，默认 5）

**响应**：
```json
{
  "success": true,
  "data": {
    "reminders": [
      {
        "id": "clx5555555555",
        "title": "主角身世之谜",
        "type": "mystery",
        "importance": "high",
        "status": "planted",
        "targetResolveChapter": 50,
        "currentChapter": 45,
        "chaptersUntilResolve": 5,
        "reminderType": "upcoming",
        "message": "还有 5 章需要回收伏笔：主角身世之谜"
      },
      {
        "id": "clx7777777777",
        "title": "神秘宝物",
        "type": "item",
        "importance": "medium",
        "status": "planted",
        "targetResolveChapter": 40,
        "currentChapter": 45,
        "chaptersUntilResolve": -5,
        "reminderType": "overdue",
        "message": "伏笔已超期 5 章未回收：神秘宝物"
      }
    ]
  }
}
```

**示例**：
```typescript
// 获取当前章节的伏笔提醒
const response = await fetch('/api/projects/clx1234567890/foreshadowings/reminders?currentChapter=45&lookAhead=5');
const data = await response.json();
```

---

### 放弃伏笔

**请求**：
- 方法：`POST`
- 路径：`/api/foreshadowings/:id/abandon`

**路径参数**：
- `id`: 伏笔 ID

**请求体**：
```json
{
  "reason": "剧情调整，该伏笔不再需要"
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "foreshadowing": {
      "id": "clx5555555555",
      "status": "abandoned",
      "notes": "剧情调整，该伏笔不再需要",
      "updatedAt": "2025-01-04T20:00:00.000Z"
    }
  }
}
```

**示例**：
```typescript
const response = await fetch('/api/foreshadowings/clx5555555555/abandon', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reason: '剧情调整，该伏笔不再需要'
  })
});
```

---

## 角色快照 API

### 创建角色快照

**请求**：
- 方法：`POST`
- 路径：`/api/character-snapshots`

**请求体**：
```json
{
  "characterId": "clx1111111111",
  "chapterId": "clx2222222222",
  "age": 17,
  "appearance": "少年模样，眼神更加坚毅",
  "personality": "经历磨难后变得更加成熟",
  "abilities": "筑基初期，掌握基础剑法",
  "relationships": "与师父关系融洽，结识了几位同门",
  "goals": "突破到筑基中期",
  "status": "在宗门修炼中",
  "notes": "第10章结束时的状态"
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "snapshot": {
      "id": "clx8888888888",
      "characterId": "clx1111111111",
      "chapterId": "clx2222222222",
      "chapterNumber": 10,
      "age": 17,
      "appearance": "少年模样，眼神更加坚毅",
      "personality": "经历磨难后变得更加成熟",
      "abilities": "筑基初期，掌握基础剑法",
      "relationships": "与师父关系融洽，结识了几位同门",
      "goals": "突破到筑基中期",
      "status": "在宗门修炼中",
      "notes": "第10章结束时的状态",
      "createdAt": "2025-01-04T21:00:00.000Z"
    }
  }
}
```

**示例**：
```typescript
const response = await fetch('/api/character-snapshots', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    characterId: 'clx1111111111',
    chapterId: 'clx2222222222',
    age: 17,
    appearance: '少年模样，眼神更加坚毅',
    personality: '经历磨难后变得更加成熟',
    abilities: '筑基初期，掌握基础剑法',
    relationships: '与师父关系融洽，结识了几位同门',
    goals: '突破到筑基中期',
    status: '在宗门修炼中'
  })
});
```

---

### 获取角色所有快照

**请求**：
- 方法：`GET`
- 路径：`/api/characters/:characterId/snapshots`

**路径参数**：
- `characterId`: 角色 ID

**查询参数**：
- `orderBy`: 排序字段（chapterNumber/createdAt）（可选，默认 chapterNumber）
- `order`: 排序方向（asc/desc）（可选，默认 asc）

**响应**：
```json
{
  "success": true,
  "data": {
    "snapshots": [
      {
        "id": "clx8888888888",
        "characterId": "clx1111111111",
        "chapterId": "clx2222222222",
        "chapterNumber": 10,
        "age": 17,
        "appearance": "少年模样，眼神更加坚毅",
        "personality": "经历磨难后变得更加成熟",
        "abilities": "筑基初期，掌握基础剑法",
        "relationships": "与师父关系融洽，结识了几位同门",
        "goals": "突破到筑基中期",
        "status": "在宗门修炼中",
        "createdAt": "2025-01-04T21:00:00.000Z"
      },
      {
        "id": "clx9999999999",
        "characterId": "clx1111111111",
        "chapterId": "clx3333333333",
        "chapterNumber": 20,
        "age": 18,
        "appearance": "身形更加挺拔，气质不凡",
        "personality": "沉稳内敛，处事果断",
        "abilities": "筑基后期，剑法大成",
        "relationships": "成为核心弟子，与长老关系密切",
        "goals": "冲击金丹期",
        "status": "准备闭关突破",
        "createdAt": "2025-01-05T10:00:00.000Z"
      }
    ]
  }
}
```

**示例**：
```typescript
// 获取角色的所有快照，按章节号升序排列
const response = await fetch('/api/characters/clx1111111111/snapshots?orderBy=chapterNumber&order=asc');
const data = await response.json();
```

---

### 获取章节的所有角色快照

**请求**：
- 方法：`GET`
- 路径：`/api/chapters/:chapterId/snapshots`

**路径参数**：
- `chapterId`: 章节 ID

**响应**：
```json
{
  "success": true,
  "data": {
    "snapshots": [
      {
        "id": "clx8888888888",
        "characterId": "clx1111111111",
        "characterName": "张三",
        "chapterId": "clx2222222222",
        "chapterNumber": 10,
        "age": 17,
        "appearance": "少年模样，眼神更加坚毅",
        "abilities": "筑基初期，掌握基础剑法",
        "status": "在宗门修炼中",
        "createdAt": "2025-01-04T21:00:00.000Z"
      },
      {
        "id": "clx0000000000",
        "characterId": "clx4444444444",
        "characterName": "李四",
        "chapterId": "clx2222222222",
        "chapterNumber": 10,
        "age": 18,
        "appearance": "俊朗青年，气质儒雅",
        "abilities": "筑基中期，擅长符箓",
        "status": "外出历练",
        "createdAt": "2025-01-04T21:30:00.000Z"
      }
    ]
  }
}
```

**示例**：
```typescript
// 获取某章节所有角色的快照
const response = await fetch('/api/chapters/clx2222222222/snapshots');
const data = await response.json();
```

---

### 获取单个快照

**请求**：
- 方法：`GET`
- 路径：`/api/character-snapshots/:id`

**路径参数**：
- `id`: 快照 ID

**响应**：
```json
{
  "success": true,
  "data": {
    "snapshot": {
      "id": "clx8888888888",
      "characterId": "clx1111111111",
      "characterName": "张三",
      "chapterId": "clx2222222222",
      "chapterNumber": 10,
      "chapterTitle": "第十章 初试锋芒",
      "age": 17,
      "appearance": "少年模样，眼神更加坚毅",
      "personality": "经历磨难后变得更加成熟",
      "abilities": "筑基初期，掌握基础剑法",
      "relationships": "与师父关系融洽，结识了几位同门",
      "goals": "突破到筑基中期",
      "status": "在宗门修炼中",
      "notes": "第10章结束时的状态",
      "createdAt": "2025-01-04T21:00:00.000Z",
      "updatedAt": "2025-01-04T21:00:00.000Z"
    }
  }
}
```

**示例**：
```typescript
const response = await fetch('/api/character-snapshots/clx8888888888');
const data = await response.json();
```

---

### 更新快照

**请求**：
- 方法：`PUT`
- 路径：`/api/character-snapshots/:id`

**路径参数**：
- `id`: 快照 ID

**请求体**：
```json
{
  "age": 17,
  "appearance": "少年模样，眼神更加坚毅（修订）",
  "personality": "经历磨难后变得更加成熟稳重",
  "abilities": "筑基初期，掌握基础剑法和身法",
  "notes": "补充了身法技能"
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "snapshot": {
      "id": "clx8888888888",
      "age": 17,
      "appearance": "少年模样，眼神更加坚毅（修订）",
      "personality": "经历磨难后变得更加成熟稳重",
      "abilities": "筑基初期，掌握基础剑法和身法",
      "notes": "补充了身法技能",
      "updatedAt": "2025-01-04T22:00:00.000Z"
    }
  }
}
```

**示例**：
```typescript
const response = await fetch('/api/character-snapshots/clx8888888888', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    abilities: '筑基初期，掌握基础剑法和身法',
    notes: '补充了身法技能'
  })
});
```

---

### 删除快照

**请求**：
- 方法：`DELETE`
- 路径：`/api/character-snapshots/:id`

**路径参数**：
- `id`: 快照 ID

**响应**：
```json
{
  "success": true,
  "data": {
    "deleted": true,
    "message": "快照已删除"
  }
}
```

**示例**：
```typescript
const response = await fetch('/api/character-snapshots/clx8888888888', {
  method: 'DELETE'
});
```

---

### 对比快照

**请求**：
- 方法：`GET`
- 路径：`/api/characters/:characterId/snapshots/compare`

**路径参数**：
- `characterId`: 角色 ID

**查询参数**：
- `fromSnapshotId`: 起始快照 ID（必填）
- `toSnapshotId`: 结束快照 ID（必填）

**响应**：
```json
{
  "success": true,
  "data": {
    "comparison": {
      "characterId": "clx1111111111",
      "characterName": "张三",
      "fromSnapshot": {
        "id": "clx8888888888",
        "chapterNumber": 10,
        "chapterTitle": "第十章 初试锋芒"
      },
      "toSnapshot": {
        "id": "clx9999999999",
        "chapterNumber": 20,
        "chapterTitle": "第二十章 崭露头角"
      },
      "changes": {
        "age": {
          "from": 17,
          "to": 18,
          "changed": true
        },
        "appearance": {
          "from": "少年模样，眼神更加坚毅",
          "to": "身形更加挺拔，气质不凡",
          "changed": true
        },
        "personality": {
          "from": "经历磨难后变得更加成熟",
          "to": "沉稳内敛，处事果断",
          "changed": true
        },
        "abilities": {
          "from": "筑基初期，掌握基础剑法",
          "to": "筑基后期，剑法大成",
          "changed": true
        },
        "relationships": {
          "from": "与师父关系融洽，结识了几位同门",
          "to": "成为核心弟子，与长老关系密切",
          "changed": true
        },
        "goals": {
          "from": "突破到筑基中期",
          "to": "冲击金丹期",
          "changed": true
        },
        "status": {
          "from": "在宗门修炼中",
          "to": "准备闭关突破",
          "changed": true
        }
      },
      "summary": "从第10章到第20章，角色经历了显著成长：年龄增长1岁，修为从筑基初期提升到筑基后期，地位从普通弟子晋升为核心弟子。"
    }
  }
}
```

**示例**：
```typescript
// 对比角色在两个章节的变化
const response = await fetch('/api/characters/clx1111111111/snapshots/compare?fromSnapshotId=clx8888888888&toSnapshotId=clx9999999999');
const data = await response.json();
```

---

## 渐进式大纲 API

### 切换大纲模式

**请求**：
- 方法：`PUT`
- 路径：`/api/projects/:projectId/outline-mode`

**路径参数**：
- `projectId`: 项目 ID

**请求体**：
```json
{
  "outlineMode": "progressive",
  "planningWindow": 10
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "clx1234567890",
      "outlineMode": "progressive",
      "planningWindow": 10,
      "currentPlanningStart": 1,
      "currentPlanningEnd": 10,
      "updatedAt": "2025-01-04T23:00:00.000Z"
    }
  }
}
```

**字段说明**：
- `outlineMode`: 大纲模式
  - `full`: 全量大纲模式（一次性规划所有章节）
  - `progressive`: 渐进式大纲模式（分批规划章节）
- `planningWindow`: 规划窗口大小（每次规划的章节数，仅在渐进式模式下有效）

**示例**：
```typescript
// 切换到渐进式大纲模式，每次规划10章
const response = await fetch('/api/projects/clx1234567890/outline-mode', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    outlineMode: 'progressive',
    planningWindow: 10
  })
});
```

---

### 获取当前规划范围

**请求**：
- 方法：`GET`
- 路径：`/api/projects/:projectId/planning-range`

**路径参数**：
- `projectId`: 项目 ID

**响应**：
```json
{
  "success": true,
  "data": {
    "planningRange": {
      "projectId": "clx1234567890",
      "outlineMode": "progressive",
      "planningWindow": 10,
      "currentPlanningStart": 1,
      "currentPlanningEnd": 10,
      "completedChapters": 8,
      "totalPlannedChapters": 10,
      "canGenerateNext": true,
      "nextPlanningStart": 11,
      "nextPlanningEnd": 20
    }
  }
}
```

**字段说明**：
- `currentPlanningStart`: 当前规划范围的起始章节号
- `currentPlanningEnd`: 当前规划范围的结束章节号
- `completedChapters`: 当前范围内已完成的章节数
- `totalPlannedChapters`: 当前范围内已规划的章节总数
- `canGenerateNext`: 是否可以生成下一批大纲（当前范围完成度 >= 80%）
- `nextPlanningStart`: 下一批规划的起始章节号
- `nextPlanningEnd`: 下一批规划的结束章节号

**示例**：
```typescript
const response = await fetch('/api/projects/clx1234567890/planning-range');
const data = await response.json();

if (data.data.planningRange.canGenerateNext) {
  console.log('可以生成下一批大纲了！');
}
```

---

### 更新规划范围

**请求**：
- 方法：`PUT`
- 路径：`/api/projects/:projectId/planning-range`

**路径参数**：
- `projectId`: 项目 ID

**请求体**：
```json
{
  "currentPlanningStart": 11,
  "currentPlanningEnd": 20
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "clx1234567890",
      "currentPlanningStart": 11,
      "currentPlanningEnd": 20,
      "updatedAt": "2025-01-05T00:00:00.000Z"
    }
  }
}
```

**示例**：
```typescript
// 手动调整规划范围
const response = await fetch('/api/projects/clx1234567890/planning-range', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    currentPlanningStart: 11,
    currentPlanningEnd: 20
  })
});
```

---

### 生成下一批大纲

**请求**：
- 方法：`POST`
- 路径：`/api/projects/:projectId/outlines/generate-next`

**路径参数**：
- `projectId`: 项目 ID

**请求体**：
```json
{
  "model": "gpt-4o-mini",
  "autoAdvanceRange": true
}
```

**响应**：流式输出（Server-Sent Events）

```typescript
// 事件格式
data: {"type": "start", "message": "开始生成第11-20章大纲"}
data: {"type": "progress", "current": 11, "total": 10}
data: {"type": "chapter", "chapterNumber": 11, "title": "第十一章 新的征程"}
data: {"type": "done", "outlines": [...]}
```

**完整响应示例**：
```json
{
  "success": true,
  "data": {
    "outlines": [
      {
        "id": "clx1111111111",
        "projectId": "clx1234567890",
        "type": "chapter",
        "order": 11,
        "title": "第十一章 新的征程",
        "content": "主角离开宗门，开始历练之旅",
        "metadata": "{\"keyEvents\":[\"离开宗门\",\"遇到强敌\"],\"estimatedWords\":3000}"
      },
      {
        "id": "clx2222222222",
        "projectId": "clx1234567890",
        "type": "chapter",
        "order": 12,
        "title": "第十二章 初遇危机",
        "content": "主角在历练中遇到生死危机",
        "metadata": "{\"keyEvents\":[\"遭遇埋伏\",\"突破境界\"],\"estimatedWords\":3000}"
      }
    ],
    "planningRange": {
      "currentPlanningStart": 11,
      "currentPlanningEnd": 20,
      "nextPlanningStart": 21,
      "nextPlanningEnd": 30
    },
    "generationId": "clx9999999999",
    "tokensUsed": {
      "promptTokens": 3000,
      "completionTokens": 2000,
      "totalTokens": 5000
    },
    "cost": 0.01
  }
}
```

**字段说明**：
- `autoAdvanceRange`: 是否自动推进规划范围（默认 true）
  - `true`: 生成成功后自动将规划范围推进到下一批
  - `false`: 保持当前规划范围不变

**示例**：
```typescript
// 生成下一批大纲（第11-20章）
const response = await fetch('/api/projects/clx1234567890/outlines/generate-next', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    autoAdvanceRange: true
  })
});

// 使用 EventSource 接收流式输出
const eventSource = new EventSource('/api/projects/clx1234567890/outlines/generate-next');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'start':
      console.log(data.message);
      break;
    case 'progress':
      console.log(`生成进度: ${data.current}/${data.total}`);
      break;
    case 'chapter':
      console.log(`生成章节: ${data.title}`);
      break;
    case 'done':
      console.log('生成完成！');
      eventSource.close();
      break;
  }
};
```

---

## 章节分析 API

### 分析章节节奏

**请求**：
- 方法：`GET`
- 路径：`/api/projects/:projectId/chapters/rhythm-analysis`

**路径参数**：
- `projectId`: 项目 ID

**查询参数**：
- `startChapter`: 起始章节号（可选，默认 1）
- `endChapter`: 结束章节号（可选，默认最后一章）

**响应**：
```json
{
  "success": true,
  "data": {
    "rhythmAnalysis": {
      "projectId": "clx1234567890",
      "startChapter": 1,
      "endChapter": 20,
      "totalChapters": 20,
      "chapters": [
        {
          "chapterNumber": 1,
          "title": "第一章 初入仙门",
          "wordCount": 3000,
          "rhythm": "slow",
          "intensity": 3,
          "emotionalTone": "平静",
          "keyEvents": ["测试天赋", "拜入宗门"],
          "pacing": "铺垫"
        },
        {
          "chapterNumber": 2,
          "title": "第二章 奇遇",
          "wordCount": 3500,
          "rhythm": "medium",
          "intensity": 5,
          "emotionalTone": "紧张",
          "keyEvents": ["遭遇危险", "获得宝物"],
          "pacing": "发展"
        },
        {
          "chapterNumber": 3,
          "title": "第三章 生死一线",
          "wordCount": 4000,
          "rhythm": "fast",
          "intensity": 8,
          "emotionalTone": "激烈",
          "keyEvents": ["生死战斗", "突破境界"],
          "pacing": "高潮"
        }
      ],
      "rhythmPattern": [3, 5, 8, 6, 4, 5, 7, 9, 5, 3],
      "averageIntensity": 5.5,
      "peakChapters": [3, 8],
      "valleyChapters": [1, 10],
      "suggestions": [
        "第1-3章节奏递增合理，形成良好的开篇",
        "第8章是情节高潮，建议在第6-7章加强铺垫",
        "第10章节奏较慢，可以考虑增加一些冲突"
      ]
    }
  }
}
```

**字段说明**：
- `rhythm`: 节奏类型
  - `slow`: 慢节奏（铺垫、日常、回忆）
  - `medium`: 中等节奏（发展、探索、对话）
  - `fast`: 快节奏（战斗、追逐、高潮）
- `intensity`: 强度值（1-10）
  - 1-3: 低强度（平静、日常）
  - 4-6: 中等强度（冲突、发展）
  - 7-10: 高强度（战斗、高潮）
- `pacing`: 节奏定位
  - `铺垫`: 情节铺垫阶段
  - `发展`: 情节发展阶段
  - `高潮`: 情节高潮阶段
  - `缓和`: 情节缓和阶段

**示例**：
```typescript
// 分析前20章的节奏
const response = await fetch('/api/projects/clx1234567890/chapters/rhythm-analysis?startChapter=1&endChapter=20');
const data = await response.json();

// 可视化节奏曲线
const rhythmPattern = data.data.rhythmAnalysis.rhythmPattern;
console.log('节奏曲线:', rhythmPattern);
```

---

### 获取情节分布

**请求**：
- 方法：`GET`
- 路径：`/api/projects/:projectId/chapters/plot-distribution`

**路径参数**：
- `projectId`: 项目 ID

**查询参数**：
- `startChapter`: 起始章节号（可选，默认 1）
- `endChapter`: 结束章节号（可选，默认最后一章）

**响应**：
```json
{
  "success": true,
  "data": {
    "plotDistribution": {
      "projectId": "clx1234567890",
      "startChapter": 1,
      "endChapter": 20,
      "totalChapters": 20,
      "plotLines": [
        {
          "id": "main",
          "name": "主线剧情",
          "type": "main",
          "description": "主角的修仙成长之路",
          "chapters": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
          "coverage": 100,
          "status": "ongoing"
        },
        {
          "id": "romance",
          "name": "感情线",
          "type": "subplot",
          "description": "主角与女主的感情发展",
          "chapters": [5, 8, 12, 15, 18],
          "coverage": 25,
          "status": "ongoing"
        },
        {
          "id": "mystery",
          "name": "身世之谜",
          "type": "subplot",
          "description": "主角的真实身份",
          "chapters": [1, 10, 20],
          "coverage": 15,
          "status": "unresolved"
        }
      ],
      "distribution": {
        "mainPlot": 60,
        "subPlots": 30,
        "worldBuilding": 10
      },
      "balance": {
        "score": 8.5,
        "evaluation": "良好",
        "suggestions": [
          "主线剧情占比合理，推进稳定",
          "感情线分布较为均匀，建议在第20章增加一次重要互动",
          "身世之谜铺垫较少，建议在第15章左右增加线索"
        ]
      }
    }
  }
}
```

**字段说明**：
- `plotLines`: 情节线列表
  - `type`: 情节线类型
    - `main`: 主线剧情
    - `subplot`: 支线剧情
    - `background`: 背景剧情
  - `coverage`: 覆盖率（占总章节数的百分比）
  - `status`: 状态
    - `ongoing`: 进行中
    - `resolved`: 已解决
    - `unresolved`: 未解决
    - `abandoned`: 已放弃
- `distribution`: 内容分布
  - `mainPlot`: 主线剧情占比（%）
  - `subPlots`: 支线剧情占比（%）
  - `worldBuilding`: 世界观构建占比（%）
- `balance`: 平衡性评估
  - `score`: 平衡性评分（1-10）
  - `evaluation`: 评价（优秀/良好/一般/较差）

**示例**：
```typescript
// 获取前20章的情节分布
const response = await fetch('/api/projects/clx1234567890/chapters/plot-distribution?startChapter=1&endChapter=20');
const data = await response.json();

// 分析情节线覆盖率
const plotLines = data.data.plotDistribution.plotLines;
plotLines.forEach(line => {
  console.log(`${line.name}: 覆盖率 ${line.coverage}%`);
});

// 查看平衡性建议
const suggestions = data.data.plotDistribution.balance.suggestions;
console.log('优化建议:', suggestions);
```

---

**文档维护**：API 文档随代码变更同步更新

**最后更新**：2025-01-04
