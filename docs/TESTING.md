# 测试文档总览

> 最后更新：2026-07-29  
> 环境：本地 `next dev`（localhost:3000）  
> 方式：Playwright CLI 浏览器走查 + REST/SSE API 脚本  
> **无 CI 自动化套件**；脚本与截图在 `tmp/`（默认不入库）

---

## 1. 文档索引

| 文档 | 日期 | 内容 |
|------|------|------|
| **[TESTING.md](./TESTING.md)**（本文） | 2026-07-29 | 总览、已测/未测清单、缺陷优先级、复跑方式 |
| [SMOKE_TEST_2026-07-28.md](./SMOKE_TEST_2026-07-28.md) | 2026-07-28 | 用户主路径冒烟、设计/UI 问题 |
| [SMOKE_TEST_CRUD_2026-07-28.md](./SMOKE_TEST_CRUD_2026-07-28.md) | 2026-07-28 | 领域增删改查矩阵（API + UI） |
| [SMOKE_TEST_EXT_2026-07-29.md](./SMOKE_TEST_EXT_2026-07-29.md) | 2026-07-29 | Agent / AI 流 / Change-set / 大纲 UI |

进度页摘要见 [PROGRESS.md](./PROGRESS.md)「测试文档索引」。

### 本地产物（不入库）

| 目录 | 说明 |
|------|------|
| `tmp/smoke-2026-07-28/` | 主路径截图 / YAML |
| `tmp/smoke-crud-2026-07-28/` | CRUD 脚本与结果（含 `run_api_crud.py`） |
| `tmp/smoke-ext-2026-07-29/` | 扩展脚本与结果（含 `run_ext_tests.py`） |

---

## 2. 结论一句话

| 维度 | 结论 |
|------|------|
| 主路径 | **可用**（首页 → 创意 → Studio → 设置 → 空项目写作） |
| 领域 CRUD | **基本可用**（项目/章/角/世界/创意 API+UI；大纲刷新有问题） |
| AI 能力 | **大部分可用**（模型测试、共创、rewrite/continue、generate 角色/世界观） |
| 数据质量 | **API 回归通过**（init 去重、导出 personality；真实 onboarding 全链路仍建议抽测） |
| 测试完备度 | **约 55%** — 高成本 AI 全管线与部分 UI 仍未测 |

---

## 3. 已覆盖清单

### 3.1 用户主路径（冒烟）

- [x] 首页 / 项目列表
- [x] 创意中心列表、详情、评分、评论
- [x] 创意共创（AI 回复）
- [x] 从创意进入「创建项目」配置页（未跑完全量初始化）
- [x] 进入既有项目 Studio（章节阅读、大纲/角色/世界观切换）
- [x] 系统设置 AI / Agent 页、模型连通测试
- [x] 空项目创建、新建章节、编辑器保存
- [x] 右侧协作 / 上下文 / 生成面板
- [x] 专注写作（部分）、更多菜单
- [x] 一致性检查 API、随机创意 API

### 3.2 领域 CRUD

| 领域 | API L/C/R/U/D | UI L/C/R/U/D | 备注 |
|------|:-------------:|:------------:|------|
| 项目 | ✅ | ✅ | 含卡片删除 |
| 章节 | ✅ | ✅ | UI 改标题入口弱 |
| 角色 | ✅ | ✅ | |
| 世界观 | ✅ | ✅ | |
| 大纲 | ✅ | ⚠️ | 创建/更新后侧栏刷新差；删除无确认 |
| 创意 | ✅ | ⚠️ | 评分/评论/删除已测；纯表单新建未测 |
| 设置 | ✅ 读/幂等写 | ⚠️ 打开+模型测试 | 未系统改全量配置项 |
| 导出 | ✅ API | ❌ 无入口 | md+角色 personality 字符串已修复；UI 仍无入口 |
| 上下文 | ✅ 需 chapterId | ✅ 面板打开 | |
| Agents list | ✅ | ✅ | |

### 3.3 扩展能力

- [x] Agent 提示词 PUT / DELETE reset（写路径）
- [x] Agent runtime PUT / 清除 / 未知 404
- [x] Change-set：analyze → patch → handoff
- [x] init-progress GET/PUT（`doneSteps`）
- [x] idea convert（bootstrap payload）
- [x] Onboarding 空/非法 body 探测
- [x] AI rewrite SSE、continue SSE、summarize
- [x] AI generate character / world-element（201 JSON）
- [x] AI chat（UIMessage + parts）
- [x] agents/run consistency、random-story-idea、models test
- [x] 大纲 UI：打开预置节点、改标题描述、删除

---

## 4. 未测试项（待办清单）

按优先级与成本排列，便于下轮排期。

### 4.1 P0 级场景（影响正确性 / 数据安全）— 建议优先补测或直接修缺陷后回归

| ID | 未测/未充分项 | 说明 | 建议 |
|----|----------------|------|------|
| U-01 | **Onboarding 全量 AI 初始化** | bootstrap → 多步生成 → finalize 落库 | 单独长场景；可取消；控制字数/模型 |
| U-02 | **从创意「开始创作」完整开书** | 配置页之后的真正创建+初始化 | 与 U-01 合并 |
| U-03 | **AI 生成整章正文并落库** | `/api/ai/generate/chapter` + 前端「AI生成章节」 | 短 targetWords 专项 |
| U-04 | **AI 生成大纲 / 分卷 / 架构全管线** | outline、volume-plan、architecture 等 | 专项；注意重复写入 |
| U-05 | **AI 生成去重回归** | onboarding 与聊天工具会在创建前判断/合并同名角色和世界观；需以真实 AI 流程复验 | 本轮已实现，待 AI 回归 |
| U-06 | **章节创建标题预填与正文无 H1 回归** | 创建时自动继承同章号大纲标题；用户后续可独立修改；AI 正文不应含 H1 | 本轮已实现，待 AI/UI 回归 |

### 4.2 功能未测（中优先级）

| ID | 未测项 | 说明 |
|----|--------|------|
| U-10 | AI 生成伏笔 foreshadowings | API 存在，未调 |
| U-11 | AI 生成 style-anchor | API 存在，未调 |
| U-12 | AI 生成 world-plan | API 存在，未调 |
| U-13 | 顶栏「AI 续写」完整 UI | 仅 API continue SSE |
| U-14 | 编辑器 BubbleMenu 局部改写 | 接受/拒绝/撤销 UI 未测 |
| U-15 | 创意 UI「纯表单新建」（非共创） | 若产品仅共创可标 N/A |
| U-16 | 创意共创「保存创意卡」写回 | 共创对话测过，保存落库未单独断言 |
| U-17 | 章节 UI 改标题 | API 可改；UI 入口未找到/未测 |
| U-18 | 导出 UI 入口 | API 有；更多菜单无入口 |
| U-19 | Change-set **前端入口与交互** | 仅 API；UI 是否可达未确认 |
| U-20 | Agent runtime UI「按 Agent 测试模型」 | 全局模型测试已测 |
| U-21 | Agent 提示词 UI 全槽位切换保存 | 仅 system 槽位 |
| U-22 | 设置「编辑器 / 项目默认值」Tab | 打开结构未深测 |
| U-23 | 项目导出 markdown 全选项组合 | 角色 personality bug 阻断；其它组合未穷尽 |
| U-24 | 上下文「预览 AI 所见」完整内容校验 | 按钮存在，内容未断言 |
| U-25 | 一致性检查 **前端报告弹窗** | API 测过，UI 弹窗未点 |
| U-26 | 项目统计页/stats 展示 | API stats 测过，UI 未测 |
| U-27 | agent-conversations 持久会话 | API 目录存在，未系统测 |
| U-28 | draft co-creation / outline co-creation 全流程保存 | 部分入口点过，未闭环 |

### 4.3 质量与非功能（低优先级 / 长期）

| ID | 未测项 | 说明 |
|----|--------|------|
| U-40 | 鉴权 / 多用户 / 权限 | 当前本地单用户模型 |
| U-41 | 并发写入、乐观锁 | |
| U-42 | 大数据量（百章、长上下文） | |
| U-43 | 弱网 / 中断 SSE / 取消生成 | AbortSignal 代码有，未系统测 |
| U-44 | 移动端 / 窄屏完整布局 | 仅桌面 1440×900 |
| U-45 | 无障碍全量（键盘、读屏） | 仅发现创意卡 a11y 问题 |
| U-46 | 生产 build + start 冒烟 | 仅 dev |
| U-47 | E2E 自动化入库（Playwright test） | 仅 CLI 手工 + 临时脚本 |
| U-48 | 单元测试 / 组件测试 | 基本无 |
| U-49 | 国际化边界、极端输入 XSS | |
| U-50 | 费用/Token 上限真实熔断 | 配置值过大已记录，未压测 |

### 4.4 已知缺陷待回归（测过发现问题，修后需复测）

详见各分报告；汇总优先级：

| 优先级 | 缺陷 | 来源 |
|--------|------|------|
| P0（API 回归通过） | AI/init 角色世界观去重：同名跳过、同批合并 | 冒烟 |
| 设计决策（API+单元通过） | 章节标题可独立于大纲；正文 H1 剥离单元 4/4 | 用户确认 / 本轮修复 |
| P0（API 回归通过） | 导出 Markdown + 角色 `personality` 字符串/数组兼容 | CRUD |
| P0/P1（API 回归通过） | Agent 提示词缓存改挂 `globalThis`，保存后立即读新值 | EXT |
| P1（store 代码+API 通过，UI 建议目视） | 大纲 create/update 后 `force` 刷新不再被 `isLoading` 短路 | CRUD/EXT |
| P1（已修） | 根级新建大纲默认 type=volume；编辑页删除需确认（侧栏树原有确认） | CRUD/EXT |
| P1（已修） | 创意卡片：并列 button + `打开创意`/`删除创意` accessible name | 冒烟 |
| P1（已修） | 右栏 overflow/z-index 隔离，避免中栏叠层挡点击 | 冒烟 |
| P1（已修） | 聊天 UI 中文化（composer/按钮/附件/操作栏） | 冒烟 |
| P1（已修 API 回归） | ideas `sortBy=updatedAt` 已支持 | 冒烟 |
| P1（已修 API 回归） | `contextMaxTokens`≤2e6、`maxTokens`≤2e5；读写侧钳制 | 冒烟 |
| P2（已修） | Onboarding/settings 等 ZodError/非法 JSON 统一 400 | EXT |
| P2（已修） | Chat 校验 messages；裸 content 归一化 parts；坏格式 400 | EXT |
| P2 | 专注模式不完整；更多菜单过瘦；评论无 DELETE | 冒烟 |

---

### 4.5 最近修复的验证记录（2026-07-29）

| 项目 | 结果 | 备注 |
|------|------|------|
| **全量已修项回归** | ✅ **38/38 PASS** | 报告 `tmp/regression-2026-07-29/REPORT.md` |
| 单元：H1 剥离 | ✅ 4/4 | `stripLeadingChapterHeading` |
| 单元：名称去重 | ✅ | `dedupeGeneratedEntities` 空格/同名合并 |
| init 去重 | ✅ | 已有「测人设/天网」不重复；同批「新角色甲」「云端区」各 1 |
| 导出 md + 角色/世界 | ✅ 200 | personality 字符串正常 |
| 大纲 C/U + list | ✅ | 卷/章创建与改标题后 list 正确 |
| 章节标题可独立改 | ✅ | 章标题改后大纲标题不变 |
| ideas sortBy | ✅ | updatedAt / createdAt |
| token 上限 | ✅ | 超限 400 / 合法 200 |
| Agent 提示词缓存 | ✅ | PUT 后立刻 GET 见 marker |
| 非法 body 400 | ✅ | finalize/idea-extract/chat |
| chat content 字符串 | ✅ 200 stream | 非 500 |
| 静态：i18n/a11y/布局/大纲 UX | ✅ | 源码断言 |
| 真实 onboarding 全量 AI 开书 | ⏳ 未跑 | U-01/U-02/U-03 仍建议专项 |

---

## 5. 复跑命令

```bash
# 需已启动：npm run dev

# 已修项综合回归（约 30s，自建自删；含 API + 单元静态断言）
# 产物：tmp/regression-2026-07-29/REPORT.md

# 领域 CRUD API（约 1 分钟，自建自删）
python3 tmp/smoke-crud-2026-07-28/run_api_crud.py

# 扩展 API（含 AI 调用，约 1–3 分钟，消耗额度）
python3 tmp/smoke-ext-2026-07-29/run_ext_tests.py
```

浏览器主路径 / UI CRUD 目前为 Playwright CLI 手工步骤，截图见对应 `tmp/smoke-*/` 目录。

---

## 6. 下轮建议顺序

1. **UI 目视**：右栏协作/发送可点、聊天中文文案、大纲侧栏刷新
2. **真实 AI 回归 U-05/U-06**，并补 **U-01/U-02/U-03**（可降模型、限步）
3. **导出 UI 入口 / 更多菜单**
4. **专注模式完善**
5. **沉淀正式 Playwright test 到仓库**

---

## 7. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-07-29 | 建立总览；汇总三份报告的已测/未测/缺陷优先级 |
| 2026-07-29 | 实现 AI 创建前重复拦截（提示词自检、生成结果合并、聊天工具复用）；章节创建自动预填同章号大纲标题，AI 生成/续写入库前剥离正文 H1。相关真实 AI/UI 回归仍列为 U-05/U-06。 |
| 2026-07-29 | 修复：导出 personality 兼容字符串/数组；Agent 提示词缓存改 globalThis；大纲 store force 刷新不再被 isLoading 短路。API 回归通过。 |
| 2026-07-29 | 修复：settings token 上限；ideas sortBy=updatedAt；根级大纲默认 volume + 编辑删除确认；创意卡 a11y 并列按钮。 |
| 2026-07-29 | 修复：聊天 UI 中文化；右栏 overflow/z-index 防叠层；withErrorHandler 捕获 ZodError；chat messages 校验与 content→parts 归一化。 |
| 2026-07-29 | **回归 38/38 PASS**（export/init 去重/大纲/token/提示词缓存/chat 400/i18n 静态）；产物 `tmp/regression-2026-07-29/`。 |
