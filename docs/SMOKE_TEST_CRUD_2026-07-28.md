# CRUD 矩阵测试报告

> 总览与未测清单：[TESTING.md](./TESTING.md)

| 项 | 内容 |
|----|------|
| 日期 | 2026-07-28 |
| 前置 | [用户视角冒烟](./SMOKE_TEST_2026-07-28.md)（主路径） |
| 环境 | `localhost:3000`（`next dev`） |
| 方法 | API 脚本全量 CRUD + Playwright UI 增删改查 |
| API 产物 | `tmp/smoke-crud-2026-07-28/api-crud-results.md` / `.json` |
| UI 产物 | `tmp/smoke-crud-2026-07-28/ui-*.png` / `ui-*.yml` |
| 脚本 | `tmp/smoke-crud-2026-07-28/run_api_crud.py`（可复跑） |

---

## 1. 总览

| 层 | 合计 | PASS | FAIL | 说明 |
|----|------|------|------|------|
| **API CRUD** | 62 | **61** | **1** | 唯一失败：带角色的 Markdown 导出 500 |
| **UI CRUD** | 见矩阵 | 大部分通过 | 2 个体验/刷新问题 | 大纲创建后列表不刷新；新建大纲默认 type=chapter |

**结论**：核心领域（项目 / 章节 / 角色 / 世界观 / 创意）的 API 与 UI **增删改查均已覆盖且基本可用**；导出含角色时崩溃、大纲 UI 刷新是本轮新确认的缺陷。

---

## 2. API CRUD 矩阵

图例：✅ 通过 · ❌ 失败 · ➖ 无此接口/不适用 · ℹ️ 行为已文档化

| 领域 | List | Create | Read | Update | Delete | 备注 |
|------|:----:|:------:|:----:|:------:|:------:|------|
| **项目** | ✅ | ✅ | ✅ | ✅ 标题/简介/题材/状态 | ✅ + 验证 404 | stats ✅ |
| **章节** | ✅ | ✅ | ✅ | ✅ 标题/正文/摘要/备注 | ✅ + 验证 404 | |
| **角色** | ✅ | ✅ | ✅ | ✅ 名称/性格/外貌 | ✅ | |
| **世界观** | ✅ | ✅ | ✅ | ✅ 名称/描述/分类 | ✅ | 非法 schema 正确 400 |
| **大纲** | ✅ | ✅ volume/chapter/scene | ✅ | ✅ 标题/状态/张力 | ✅ scene | |
| **创意** | ✅ | ✅ | ✅ | ✅ 标题/status=favorited | ✅ + 验证 404 | |
| **创意评分** | ➖ | ✅ `score` 字段 | ✅ | ✅ 重评覆盖 | ➖ | 误用 `rating` 字段正确 400 |
| **创意评论** | ✅ | ✅ | ➖ | ➖ | ℹ️ **无 DELETE API**（404） | |
| **设置** | ➖ | ➖ | ✅ | ✅ PUT 幂等写回 model | ➖ | |
| **导出** | ➖ | ⚠️ txt ✅ / md+角色 ❌ | ➖ | ➖ | ➖ | GET 正确 405 |
| **上下文** | ➖ | ➖ | ✅ 需 chapterId | ➖ | ➖ | 缺 chapterId → 400 |
| **Agents** | ✅ | ➖ | ➖ | 未改写 prompts | ➖ | 本轮只 list |

### 2.1 API 唯一失败（Bug）

**导出 Markdown 且 `includeCharacters: true` → HTTP 500**

```
SERVER_ERROR: char.personality.join is not a function
```

- **复现**：项目内存在 `personality` 为**字符串**的角色时，`POST /api/projects/:id/export` + `format=markdown` + `includeCharacters=true`
- **对照**：`includeCharacters=false` 的 txt/md 导出 **成功**
- **根因**：导出生成器把 `personality` 当数组调用 `.join`，与创建接口写入的 string 不一致
- **位置**：`src/app/api/projects/[projectId]/export/route.ts` 内 `generateMarkdown`（或同类 helper）

### 2.2 API 行为说明（非失败）

| 行为 | 说明 |
|------|------|
| `GET /api/ideas?sortBy=updatedAt` | 400，仅允许 `createdAt` \| `rating`（产品缺口，校验符合当前 schema） |
| `POST /api/ideas/:id/rate` body | 字段名是 **`score`**，不是 `rating` |
| 评论删除 | 无路由，DELETE → 404 HTML |
| `GET .../export` | 405，仅 POST |
| 删除后 Read | 统一 404 + 业务错误码 |

---

## 3. UI CRUD 矩阵

测试项目：`UI-CRUD测试项目`（测完已从 UI 删除）

| 领域 | List | Create | Read/打开 | Update | Delete | 结果 |
|------|:----:|:------:|:---------:|:------:|:------:|------|
| **项目** | ✅ 卡片列表 | ✅（本轮用 API 建后 UI 编辑；空项目创建见前序冒烟） | ✅ 进 Studio | ✅ 编辑项目名称/简介 | ✅ 卡片图标 → 确认删除 | **全通** |
| **章节** | ✅ | ✅ 一键「新建章节」 | ✅ 编辑器 | ✅ 改正文 + 顶栏保存 | ✅ 侧栏删除 + 确认框 | **全通**（标题仍默认「新章节」，无 UI 改标题） |
| **角色** | ✅ | ✅ 新建角色表单 | ✅ 详情编辑页 | ✅ 改名/外貌 + 保存 | ✅ 详情「删除」 | **全通**（默认角色类型显示「配」） |
| **世界观** | ✅ | ✅ 新建世界观表单 | ✅ 详情 | ✅ 改名 + 保存 | ✅ 详情「删除」 | **全通** |
| **大纲** | ⚠️ | ⚠️ 表单提交 API 成功 | ⚠️ | ❌ 本轮未在 UI 完成 | ❌ 本轮未在 UI 完成 | **见缺陷** |
| **创意** | ✅ | ⚠️ 本轮 Create 走 API；UI 有「开始共创」 | ✅ 详情 | ✅ 前序冒烟评分/评论 | ✅ 卡片删除确认 | **删/读/评通**；手动新建表单未单独走 |

### 3.1 UI 缺陷

#### BUG-UI-1 大纲创建成功后侧栏/中区不刷新

- **现象**：UI 填写「UI第一卷」并点创建 → toast/返回后中区仍「开始规划故事」，侧栏树无节点
- **API 核实**：`GET /outlines` 已有节点（`title=UI第一卷`，但 `type=chapter` 而非 volume）
- **切换章节↔大纲后仍不显示**（至少在本轮操作路径下）
- **影响**：用户以为创建失败，重复提交

#### BUG-UI-2 新建大纲默认类型为 chapter

- 表单文案支持 卷/章/场景，但未改类型时提交为 `type: "chapter"`
- 标题填「UI第一卷」造成语义错位

#### BUG-UI-3 角色创建默认「配」角

- 未选手动类型时列表徽章为「配」（supporting）
- 可接受，但「主角」场景需用户显式选择（表单有角色类型 combobox）

#### BUG-UI-4 章节 UI 无便捷改标题

- 新建后标题固定「新章节」，本轮未找到标题编辑入口（可能在更多菜单/双击，未覆盖）
- API Update title 正常

#### 其他（与前序冒烟一致）

- 创意卡片 button 嵌套 / accessible name 带「删除创意」
- 聊天英文文案
- 右侧面板层叠点击

---

## 4. 与前序冒烟的合并优先级

| 优先级 | 项 | 来源 |
|--------|----|------|
| **P0** | 角色/世界观历史数据重复 + 初始化幂等 | 冒烟 |
| **P0** | 章节 title ↔ 正文 H1 ↔ 大纲同步 | 冒烟 |
| **P0** | 导出 Markdown `personality.join` 崩溃 | **本轮 CRUD** |
| **P1** | 大纲创建后 UI 列表不刷新 | **本轮 CRUD** |
| **P1** | 大纲默认 type / 表单类型选择 | **本轮 CRUD** |
| **P1** | 创意 a11y、聊天 i18n、右侧层叠 | 冒烟 |
| **P2** | 评论无删除 API；ideas sortBy；token 上限；专注模式 | 冒烟 |
| **P2** | 章节 UI 改标题入口 | **本轮 CRUD** |

---

## 5. 仍未覆盖（部分已在扩展测试补）

> 2026-07-29 扩展测试见 **[SMOKE_TEST_EXT_2026-07-29.md](./SMOKE_TEST_EXT_2026-07-29.md)**。

| 项 | 状态 |
|----|------|
| 大纲 UI U/D | ✅ 扩展已测（侧栏刷新仍有 bug） |
| Agent 提示词 / runtime | ✅ 扩展已测（发现缓存失效） |
| Change-set / handoff | ✅ API 已测 |
| rewrite / continue API | ✅ SSE 已测 |
| generate character / world | ✅ 已测 |
| 创意 UI 纯表单新建 | 仍可选 |
| Onboarding 全量 AI 写库 | 仍未测（成本高） |
| generate chapter / outline 全量 | 仍未测 |
| rewrite BubbleMenu UI | 仍未测 |
| 并发 / 权限 | 仍未测 |

---

## 6. 复跑方式

```bash
# API 矩阵（约 1 分钟，自建自删数据）
python3 tmp/smoke-crud-2026-07-28/run_api_crud.py
# 结果：tmp/smoke-crud-2026-07-28/api-crud-results.md
```

UI 矩阵目前为 Playwright CLI 手工脚本路径，关键截图见 `tmp/smoke-crud-2026-07-28/ui-*.png`。

---

## 7. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | 首轮 API 62 项 + UI 全领域 CRUD；文档落盘 |
| 2026-07-29 | 交叉链接扩展测试 `SMOKE_TEST_EXT_2026-07-29.md` |
