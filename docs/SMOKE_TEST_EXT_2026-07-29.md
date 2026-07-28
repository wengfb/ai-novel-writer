# 扩展测试报告（Agent / AI 流 / Change-set / 大纲 UI）

> 总览与未测清单：[TESTING.md](./TESTING.md)

| 项 | 内容 |
|----|------|
| 日期 | 2026-07-29 |
| 前置 | [主路径冒烟](./SMOKE_TEST_2026-07-28.md) · [CRUD 矩阵](./SMOKE_TEST_CRUD_2026-07-28.md) |
| 环境 | `localhost:3000`（`next dev`） |
| 产物 | `tmp/smoke-ext-2026-07-29/` |
| 脚本 | `tmp/smoke-ext-2026-07-29/run_ext_tests.py` |

---

## 1. 总览

本轮补测上次矩阵中标记为「未覆盖」的能力：

| 类别 | 结果摘要 |
|------|----------|
| Agent 提示词 / runtime | **保存写库成功，但列表读路径最多 15s 读不到新值**（缓存失效缺陷） |
| Change-set 分析 / 交接 | ✅ analyze + handoff；patch 需正确 body（勿传 `itemStatuses: null`） |
| init-progress | ✅ GET/PUT（body: `{ doneSteps: string[] }`） |
| idea convert | ✅ 返回 bootstrap 用 ideaCard |
| Onboarding 空 body | bootstrap 正确 400；finalize/extract/idea-extract 空 body 易 **500**（校验异常未包装） |
| AI rewrite / continue | ✅ SSE 流式可用 |
| AI summarize | ✅（已有摘要则跳过） |
| AI generate character/world | ✅ HTTP 201 JSON 落库（非 SSE） |
| AI studio chat | ✅ 需 **UIMessage** 格式（`parts`）；裸 `{role,content}` → 500 |
| agents/run consistency | ✅ |
| 大纲 UI Update/Delete | ✅ 保存写库成功；**侧栏标题不即时刷新**；删除成功 |

---

## 2. API 扩展结果（校正后）

脚本首跑 33 项中有 6 个 FAIL，经人工复测后重分类如下。

### 2.1 真实缺陷

#### BUG-EXT-1 Agent 提示词保存后列表不立即可见（P0/P1）

- **现象**  
  - `PUT /api/ai/agents/studio-chat/prompts` → `success`，响应体内 `slot.content` 含新内容、`isCustom=true`  
  - 紧接着 `GET /api/ai/agents` → 仍为默认 content、`isCustom=false`  
  - **约 15s 后**（`CACHE_TTL`）再 GET → 可见新内容  
- **影响**  
  - 设置页保存后刷新/重开可能仍显示旧提示词  
  - 依赖 catalog 读路径的逻辑在 15s 内用旧 system prompt  
- **根因推测**  
  - `prompt-store.ts` 进程内缓存 + `clearPromptCache()`  
  - Next.js dev/多 bundle 下 **PUT 与 GET 可能不共享同一模块实例的 cache 变量**，导致 clear 打在 A 实例、读走 B 实例，只能等 B 的 15s TTL  
- **代码**  
  - `src/lib/ai/agents/prompt-store.ts`（`CACHE_TTL = 15_000`，`clearPromptCache`）  
  - `src/app/api/ai/agents/[agentId]/prompts/route.ts`

#### BUG-EXT-2 Onboarding 校验失败返回 500（P2）

- `POST /api/onboarding/finalize` 空 body → `SERVER_ERROR` + Zod 原始 message  
- `POST /api/onboarding/idea-extract` / `extract` 非法输入类似  
- `POST /api/onboarding/bootstrap` 空 body → 正确 `INVALID_PARAMS` 400  
- **期望**：统一 400 + `INVALID_PARAMS`，勿 500

#### BUG-EXT-3 Chat 请求体格式脆弱（P2 / 文档）

- 仅 `{ messages: [{ role, content }] }` → **500 服务器错误**  
- 使用 AI SDK UIMessage（含 `parts: [{type:'text', text}]`）→ **200 SSE 正常**  
- 前端 assistant-ui 路径正常；裸 API/第三方调用易踩坑  
- **建议**：校验失败返回 400，并在 API.md 写明 UIMessage 形状

#### （已有）导出 personality.join — 见 CRUD 报告 P0

### 2.2 脚本误判（实为通过）

| 用例 | 说明 |
|------|------|
| generate character/world | HTTP **201** + JSON 落库，脚本只认 200/SSE → 误 FAIL |
| init-progress PUT | 正确字段为 `doneSteps`，非 `phase` |
| changeset patch | 不可传 `itemStatuses: null`；省略或传数组则 200 |
| prompt verify | 实为 BUG-EXT-1，不是「保存失败」 |

### 2.3 通过的能力

| 能力 | 结果 |
|------|------|
| Agent runtime PUT / 清除 / 未知 agent 404 | ✅ |
| Agent prompt PUT + DELETE reset | ✅ 写路径 |
| Change-set analyze | ✅（items 可为空） |
| Change-set handoff → chapter agent | ✅ 创建 conversation |
| Idea convert | ✅ |
| init-progress GET/PUT | ✅ |
| rewrite SSE | ✅ 有 progress chunk |
| continue SSE | ✅ |
| summarize | ✅ |
| agents/run consistency | ✅ 返回 JSON 文本 |
| random-story-idea / models test | ✅ |

---

## 3. UI 扩展结果

| 场景 | 结果 | 备注 |
|------|------|------|
| API 预置大纲后打开「剧情大纲」 | ✅ 侧栏可见「EXT第一卷」 | 与「创建后不刷新」对照：读路径在进页时正常 |
| 大纲节点打开详情 | ✅ | |
| 大纲改标题/描述并保存 | ✅ API 已是「EXT第一卷-已改」 | **侧栏仍显示旧标题**（刷新/状态未同步） |
| 大纲删除 | ✅ toast「大纲删除成功」 | 无二次确认（角色/章节有确认框，体验不一致） |
| Agent 配置页编辑提示词 | ⚠️ | 受控 textarea 需 React 方式改值；点保存后 toast「提示词已保存」 |
| Agent 保存后 API 立即 list | ❌ | 同 BUG-EXT-1；16s 后可见 |

### UI 缺陷补充

#### BUG-UI-5 大纲保存后侧栏树不更新标题

- 详情保存成功，API 已更新  
- 左侧树节点文案仍为旧标题  
- 与 CRUD 报告「创建后不刷新」同属 **outline store 未 invalidate/乐观更新**

#### BUG-UI-6 大纲删除无确认对话框

- 点「删除」直接删并 toast  
- 章节/项目/创意有 `alertdialog`，大纲不一致，误触风险

---

## 4. 请求契约备忘（测试中踩坑）

| 接口 | 正确要点 |
|------|----------|
| `POST /api/ideas/:id/rate` | body: `{ "score": 1-5 }` |
| `PUT .../init-progress` | `{ "doneSteps": ["architecture", ...] }` |
| `PATCH /api/change-sets/:id` | 不要传 `itemStatuses: null`；无更新则省略该字段 |
| `POST /api/ai/chat` | `messages` 为 UIMessage 数组（建议含 `parts`） |
| `POST .../export` | 仅 POST；`includeCharacters:true` 时 personality 必须兼容 string/array |
| generate character/world | 成功可能是 **201** JSON，不是 SSE |

---

## 5. 仍未覆盖 / 建议下轮

| 项 | 说明 |
|----|------|
| Onboarding bootstrap/finalize **完整 AI 管线** | 耗时长、成本高，建议单独场景 + 可取消 |
| AI generate chapter / outline / volume-plan 全量 | 同上 |
| rewrite 前端 BubbleMenu 接受/拒绝 | 仅测了 API SSE |
| continue 顶栏按钮 UI | 仅 API |
| Change-set 前端入口 | 仅 API；UI 是否有入口未确认 |
| Agent runtime UI「测试模型」按 agent | 全局测试已覆盖 |
| 多用户/并发/权限 | 单机本地无鉴权模型 |

---

## 6. 合并缺陷优先级（三份报告合计）

| 优先级 | ID | 问题 |
|--------|-----|------|
| P0 | 冒烟 | 角色/世界观重复 + 初始化幂等 |
| P0 | 冒烟 | 章节 title ↔ 正文 H1 ↔ 大纲同步 |
| P0 | CRUD | 导出 MD + 角色 `personality.join` 崩溃 |
| P0/P1 | **EXT** | **Agent 提示词缓存跨路由不失效，列表最多 15s 旧值** |
| P1 | CRUD/EXT | 大纲创建/更新后侧栏不刷新 |
| P1 | CRUD | 大纲默认 type、创意 a11y、聊天 i18n、右侧层叠 |
| P2 | EXT | Onboarding 非法输入 500 |
| P2 | EXT | Chat 非 UIMessage → 500 |
| P2 | EXT | 大纲删除无确认 |
| P2 | 冒烟 | sortBy、token 上限、专注模式、评论无 DELETE |

---

## 7. 复跑

```bash
# 扩展 API（含 AI 流，约 1–3 分钟，消耗模型额度）
python3 tmp/smoke-ext-2026-07-29/run_ext_tests.py

# CRUD API
python3 tmp/smoke-crud-2026-07-28/run_api_crud.py
```

注意：`run_ext_tests.py` 对 201/缓存延迟的判定偏严，以本文「校正后」结论为准；后续可改脚本容忍 201 与「保存响应内校验」。

---

## 8. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-07-29 | 扩展测试首轮：Agent/AI 流/Change-set/大纲 UI；文档落盘 |
