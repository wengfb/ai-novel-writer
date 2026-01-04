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
  "model": "gemini-2.5-flash"
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
// 实时流式输出
data: {"type": "start", "chapterId": "clx1111111111"}
data: {"type": "token", "content": "# 第一章 初入仙门\n\n"}
data: {"type": "token", "content": "清晨，"}
data: {"type": "token", "content": "阳光洒在..."}
data: {"type": "progress", "scene": 1, "totalScenes": 3}
data: {"type": "done", "wordCount": 3200}
```

**响应字段**：
- `type`: 事件类型
  - `start`: 开始生成
  - `token`: 文本片段
  - `progress`: 进度更新
  - `done`: 生成完成
  - `error`: 生成失败

**完整生成后的数据**：
```json
{
  "success": true,
  "data": {
    "chapterId": "clx1111111111",
    "content": "# 第一章 初入仙门\n\n完整内容...",
    "wordCount": 3200,
    "summary": "自动生成的摘要",
    "generationId": "clx9999999999",
    "tokensUsed": {
      "promptTokens": 5000,
      "completionTokens": 3000,
      "totalTokens": 8000
    },
    "cost": 0.05,
    "duration": 30000
  }
}
```

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
  "model": "gemini-2.5-flash"
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

**文档维护**：API 文档随代码变更同步更新

**最后更新**：2025-01-04
