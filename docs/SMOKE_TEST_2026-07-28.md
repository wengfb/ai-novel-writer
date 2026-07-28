# AI Novel Writer 用户视角冒烟测试报告

> 总览与未测清单：[TESTING.md](./TESTING.md)

| 项 | 内容 |
|----|------|
| 日期 | 2026-07-28 |
| 视角 | 终端用户（作者）全流程走查 |
| 环境 | `localhost:3000`（`next dev`） |
| 模型 | `gemini-3-flash`（openai-compatible） |
| 方法 | Playwright CLI 浏览器操作 + REST API 探测 |
| 截图/快照 | `tmp/smoke-2026-07-28/`（约 25 张 PNG + YAML） |

---

## 1. 总览

| 维度 | 结论 |
|------|------|
| 核心链路可用性 | **可用** — 首页、创意、项目 Studio、设置、空项目创建、保存均通 |
| AI 能力 | **可用** — 模型测试、创意共创回复、一致性检查、随机创意均通 |
| 数据质量 | **差** — 角色/世界观严重重复，章节标题不一致 |
| UI/UX 打磨 | **中等** — 中英文混杂、a11y、层叠点击、专注模式不完整 |
| 功能完整度 | **有缺口** — 导出无入口、更多菜单过瘦、排序参数不全 |

**结论**：产品主路径可跑通，AI 与 Studio 架构方向正确；当前最大风险是**设定数据重复与章节标题不同步**，应优先于新功能治理。

---

## 2. 覆盖范围

| 场景 | 结果 | 备注 |
|------|------|------|
| 首页 / 项目列表 | PASS | 卡片、字数、进度条可见 |
| 创意中心列表/搜索/筛选 UI | PASS | 共 18 个创意 |
| 创意详情 + 评分 + 评论 | PASS | 5 星与评论均落库 |
| 创意共创（AI 回复） | PASS | 自动开场 + 补强建议 |
| 从创意创建项目配置页 | PASS | 未跑完全量 AI 初始化 |
| 进入既有项目 Studio | PASS | 「神格觉醒」 |
| 章节列表 / 编辑器 / 保存 | PASS | 未保存 → 已保存时间戳 |
| 大纲树 | PASS | 有分卷与节点 |
| 角色列表 | PASS | **数据有重复** |
| 世界观列表 | PASS | **数据有重复** |
| 系统设置 AI / Agent | PASS | 分 Tab 配置完整 |
| 模型连通性测试 | PASS | UI + API 均「连接成功」 |
| 空项目创建 | PASS | 默认题材「玄幻」 |
| 新建章节 | PASS | 一键「新章节」 |
| 右侧 协作 / 上下文 / 生成 | PASS | 聊天发送有点击遮挡 |
| 专注写作 | PARTIAL | 更像折叠助手 |
| 更多菜单 | PASS | 功能偏少 |
| 一致性检查 API | PASS | 正确报出重复设定 |
| 随机创意 API | PASS | 返回 cards |
| 导出 API | FAIL | GET 405，需 POST；UI 无入口 |
| Ideas `sortBy=updatedAt` | FAIL | 仅允许 `createdAt` \| `rating` |
| 清理测试数据 | PASS | 冒烟项目/临时实体已删 |

---

## 3. 严重问题（P0 / P1）

### P0-1 角色与世界观大量重复

- **现象**（项目「神格觉醒」）：
  - 角色：李燃 ×2、夏冰 ×2、织女 ×2（定位冲突：supporting vs antagonist）
  - 世界观：天网公司 ×3、底层区与云端区 ×2
- **佐证**：`POST /api/ai/consistency-check` 报告明确指出重复与冲突
- **影响**：AI 上下文膨胀、设定互相打架、用户列表难用、token 浪费
- **根因推测**：多次 onboarding / 初始化或 AI 工具重复写入，缺少幂等与按名称去重

### P0-2 章节标题与正文标题不一致

- 侧栏章节名：第 2 章「**吞噬初醒**」
- 正文开头：`# 第2章 第一次吞噬`
- 大纲节点名：也是「第一次吞噬」
- **影响**：导航信任度下降；导出与 AI 引用章节时混乱

### P1-1 右侧面板点击被中心 header / 滚动条拦截

- Playwright 点击「协作」「Send message」时，`center` 区 header 或 scrollbar 拦截 pointer events
- 窄屏下用户也可能点不到发送按钮
- **类型**：布局 / 层叠（z-index、overflow、panel 几何）

### P1-2 创意卡片无障碍名称错误

- 整张卡片 button 的 accessible name 以「删除创意：xxx」开头
- 删除按钮嵌套在卡片按钮内（**button in button**）
- **影响**：读屏、自动化、误触删除

### P1-3 ideas API 不支持 `sortBy=updatedAt`

```http
GET /api/ideas?sortBy=updatedAt
→ INVALID_PARAMS
允许值: createdAt | rating
```

若前端仍暴露「按更新时间」排序会直接失败。

### P1-4 设置项 token 上限不合理

- `ai.contextMaxTokens = 100000000`（1 亿）
- `ai.maxTokens = 100000`
- **风险**：费用与内存失控；应做服务端上限校验与 UI 提示

---

## 4. 中等问题（P2）

### P2-1 聊天 UI 中英文混杂

- placeholder：`Send a message...`
- 控件文案：`Add Attachment` / `Message input` / `Stop generating` / `Scroll to bottom`
- 产品其余界面均为中文

### P2-2 专注写作体验不完整

- 按钮变为「显示助手」，左侧项目树仍在
- 无明确「退出专注」文案
- 更像「折叠右侧助手」，而非真正专注模式

### P2-3 更多菜单能力不足

当前仅有：

- 编辑项目
- 系统设置
- 全部项目

缺少：导出、删除项目、统计、初始化入口等。

### P2-4 导出能力难发现

- API：`POST /api/projects/[projectId]/export`（GET → 405）
- UI 更多菜单无导出入口

### P2-5 上下文 API 必须 chapterId

- 仅 `projectId` 时 400「缺少必要参数」
- 项目级上下文预览能力弱

### P2-6 统计 completionRate = 0

- `completedChapters = 2`、有正文，但 `completionRate` 仍为 0
- 首页进度条语义不清晰（是否相对目标总字数？）

### P2-7 空项目创建时类型 Select 难点

- native select 被 label 拦截点击（Radix/shadcn 常见问题）
- 未选手动类型时默认「玄幻」可创建成功，但表单交互体验差

### P2-8 章节 status 字段为 null

- API 返回 `status: null`，状态机未落地

### P2-9 初始化提示与可写边界模糊

- 空项目横幅「项目初始化未完成」合理
- 但允许直接写章节 + AI 生成，提示与能力边界略糊

---

## 5. 设计合理性观察

### 5.1 做得好

1. 三栏 Studio 结构清晰：左资料 / 中编辑 / 右 AI
2. 新建项目路径选择器优秀：AI 共创 / 已有创意 / 空项目
3. 创意共创 shell 完整：对话 + 右侧可编辑创意卡 + 显式保存门槛
4. Agent 可按功能覆盖模型、温度、最大 Token、提示词
5. 模型测试反馈明确（连接成功 + 回复摘要）
6. 一致性检查能发现真实数据问题
7. 保存状态「未保存 / 已保存 + 时间」清晰
8. 从创意创建项目时的字数 / 节奏 / 视角配置专业

### 5.2 可改进

1. **数据质量治理**（去重、标题同步）优先于新功能
2. 导出、删除、统计应在 UI 可达
3. 聊天组件 i18n 全面中文化
4. 专注模式应真正隐藏侧栏
5. 创意卡 a11y 结构重做（`article` + 独立删除按钮，禁止 button 嵌套）
6. 进度百分比需要明确基准（目标总字数）
7. onboarding / 初始化应避免重复写入角色与世界观（幂等）

---

## 6. 已验证的关键用户路径

1. 打开首页 → 看到项目卡片与字数进度
2. 创意中心浏览 → 打开详情 → 五星评分 → 发表评论
3. 继续共创 → AI 给出主角筹码 / 冲突张力建议
4. 进入「神格觉醒」→ 读第 2 章正文 → 大纲 / 角色 / 世界观可切换
5. 设置 → 模型测试成功（`gemini-3-flash`）
6. 新建空项目 → 初始化提示 → 新建章节 → 写入正文 → 保存成功
7. 从创意「心声风暴」点创建项目 → 进入字数 / 节奏 / 视角配置页
8. 一致性检查 API 返回有效报告

---

## 7. API 探测摘要

| 接口 | 结果 |
|------|------|
| `GET /api/projects` | OK |
| `GET /api/ideas` | OK（18 条） |
| `GET /api/settings` | OK |
| `POST /api/ai/models` `action=list` | OK |
| `POST /api/ai/models` `action=test` | OK，`连接成功` |
| `GET /api/ai/agents` | OK，10 个 agent |
| `POST /api/projects/:id/chapters` | OK |
| `DELETE` 章节 / 角色 / 世界观 / 项目 | OK |
| `POST /api/world-elements`（错误 schema） | 校验失败（符合预期） |
| `POST /api/world-elements`（正确 type/category） | OK |
| `GET /api/ideas?sortBy=updatedAt` | FAIL |
| `GET /api/projects/:id/export` | 405 |
| `GET /api/ai/context` 缺 chapterId | 400 |
| `POST /api/ai/consistency-check` | OK，发现重复设定 |
| `POST /api/ai/random-story-idea` | OK |

---

## 8. 建议修复优先级

| 优先级 | 项 |
|--------|----|
| **立即** | 角色 / 世界观去重工具 + 初始化幂等 |
| **立即** | 章节 `title` 与正文 H1 / 大纲节点同步策略 |
| **本周** | 创意卡片 a11y、聊天中文化、右侧面板层叠 |
| **本周** | 导出入口、更多菜单补齐、`sortBy` 对齐 |
| **随后** | 专注模式、进度语义、chapter status 状态机、token 上限校验 |

---

## 9. 截图索引

路径前缀：`tmp/smoke-2026-07-28/`

| 文件 | 说明 |
|------|------|
| `01-home.png` | 首页项目列表 |
| `02-ideas.png` | 创意中心 |
| `03-idea-detail.png` | 创意详情 |
| `04-commented.png` | 评分 + 评论后 |
| `05-cocreate.png` / `05-cocreate-reply.png` | 创意共创与 AI 回复 |
| `07-project-studio.png` | 项目写作主界面 |
| `08-outline.png` | 剧情大纲 |
| `09-characters.png` | 角色设定（可见重复） |
| `10-world.png` | 世界观（可见重复） |
| `11-settings.png` | 系统设置 AI |
| `12-agents.png` | Agent 配置 |
| `13-model-test2.png` | 模型测试成功 |
| `14-new-project.png` | 开书路径选择 |
| `15-empty-project-form.png` | 创建空项目表单 |
| `16-after-create.png` | 空项目进入 Studio |
| `21-context.png` | 右侧上下文 |
| `22-generate.png` | 右侧生成 |
| `25-focus2.png` | 专注 / 显示助手 |
| `27-create-from-idea.png` | 从创意创建项目配置 |
| `99-final.png` | 收尾状态 |

对应 YAML 快照同名（`.yml`），便于回归对比。

---

## 10. 复测建议

1. 修复 P0 后，对「神格觉醒」跑一次去重脚本 + 一致性检查，确认报告清零。
2. 回归：创意卡片读屏名称、右侧发送按钮点击、ideas 排序、导出 UI。
3. 可选：补一条 Playwright 冒烟脚本固化本报告中的 PASS 路径。

---

## 11. 后续测试文档

主路径冒烟之后已继续补测：

| 文档 | 内容 |
|------|------|
| [SMOKE_TEST_CRUD_2026-07-28.md](./SMOKE_TEST_CRUD_2026-07-28.md) | 领域 CRUD 矩阵 |
| [SMOKE_TEST_EXT_2026-07-29.md](./SMOKE_TEST_EXT_2026-07-29.md) | Agent / AI 流 / Change-set / 大纲 UI |

---

## 12. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | 首次全量用户视角冒烟；文档落盘 |
| 2026-07-28 | 补 CRUD 矩阵，见 `SMOKE_TEST_CRUD_2026-07-28.md` |
| 2026-07-29 | 扩展测试，见 `SMOKE_TEST_EXT_2026-07-29.md` |
