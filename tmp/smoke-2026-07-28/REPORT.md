# AI Novel Writer 用户视角冒烟测试报告

- 日期: 2026-07-28
- 环境: localhost:3000 (next dev)
- 模型: gemini-3-flash (openai-compatible)
- 产物目录: tmp/smoke-2026-07-28/

## 覆盖范围

| 场景 | 结果 |
|------|------|
| 首页 / 项目列表 | PASS |
| 创意中心列表/搜索/筛选 UI | PASS |
| 创意详情 + 评分 + 评论 | PASS |
| 创意共创 (AI 回复) | PASS |
| 从创意创建项目配置页 | PASS (未跑完全量 AI 初始化) |
| 进入既有项目 Studio | PASS |
| 章节列表 / 编辑器 / 保存 | PASS |
| 大纲树 | PASS (有节点) |
| 角色列表 | PASS (数据有重复) |
| 世界观列表 | PASS (数据有重复) |
| 系统设置 AI / Agent | PASS |
| 模型连通性测试 | PASS |
| 空项目创建 | PASS |
| 新建章节 | PASS |
| 右侧 协作/上下文/生成 | PASS (聊天发送有点击遮挡) |
| 专注写作 | PARTIAL |
| 更多菜单 | PASS (功能偏少) |
| 一致性检查 API | PASS (正确报出重复) |
| 随机创意 API | PASS |
| 导出 API | FAIL (GET 405, 需 POST) |
| Ideas sortBy=updatedAt | FAIL |
| 清理测试数据 | PASS |

## 严重问题 (P0/P1)

### P0-1 角色与世界观大量重复
- 项目「神格觉醒」: 李燃×2、夏冰×2、织女×2；天网公司×3、底层区与云端区×2
- 一致性检查也明确指出该问题
- 影响: AI 上下文膨胀、设定冲突、用户困惑
- 根因推测: 多次 onboarding/初始化或 AI 工具重复写入，缺幂等/去重

### P0-2 章节标题与正文标题不一致
- 侧栏: 第2章「吞噬初醒」
- 正文开头: `# 第2章 第一次吞噬`
- 大纲节点名也是「第一次吞噬」
- 影响: 导航信任度、导出、AI 引用章节时混乱

### P1-1 右侧面板点击被中心 header / 滚动条拦截
- Playwright 点击「协作」「Send message」时，center header 或 scrollbar 拦截 pointer events
- 用户侧也可能出现右侧窄屏时点不到发送按钮
- 属于布局/层叠 (z-index / overflow) 问题

### P1-2 创意卡片无障碍名称错误
- 整张卡片 button 的 accessible name 以「删除创意：xxx」开头
- 删除按钮嵌套在卡片按钮内 (button in button)
- 影响: 读屏、自动化、误触删除

### P1-3 ideas API 不支持 sortBy=updatedAt
- `GET /api/ideas?sortBy=updatedAt` → INVALID_PARAMS
- 仅允许 createdAt | rating
- 若前端仍有 updatedAt 排序入口会失败

### P1-4 设置项 contextMaxTokens = 100000000
- 一亿 token，不合理，可能导致费用/内存风险
- maxTokens=100000 也偏大

## 中等问题 (P2)

### P2-1 聊天 UI 中英文混杂
- placeholder: "Send a message..."
- "Add Attachment" / "Message input" / "Stop generating" / "Scroll to bottom"
- 产品其余文案均为中文

### P2-2 专注写作体验不完整
- 按钮变为「显示助手」，但左侧项目树仍在
- 没有明确「退出专注」文案
- 更像「折叠右侧助手」而非真正专注模式

### P2-3 更多菜单能力不足
- 仅有: 编辑项目 / 系统设置 / 全部项目
- 缺少: 导出、删除项目、统计、初始化入口等

### P2-4 导出 API 只支持 POST
- GET 返回 405；UI 更多菜单也没有导出入口
- 用户很难发现导出能力

### P2-5 上下文 API 必须 chapterId
- 仅 projectId 时 400「缺少必要参数」
- 项目级上下文预览能力弱

### P2-6 统计 completionRate=0
- 2 章均有正文且 completedChapters=2，但 completionRate 仍为 0
- 进度条语义不清晰（相对目标字数？）

### P2-7 空项目创建时类型 Select 难点
- native select 被 label 拦截点击（Radix/shadcn 常见问题）
- 未选手动类型时默认「玄幻」创建成功，但表单交互体验差

### P2-8 章节 status 字段为 null
- API 返回 status: None，状态机未落地

### P2-9 初始化提示 vs 可写作
- 空项目横幅「项目初始化未完成」合理
- 但允许直接写章节 + AI 生成，提示与能力边界略模糊

## 设计合理性观察

### 做得好
1. 三栏 Studio 结构清晰: 左资料 / 中编辑 / 右 AI
2. 新建项目路径选择器优秀: AI 共创 / 已有创意 / 空项目
3. 创意共创 shell 完整: 对话 + 右侧可编辑创意卡 + 保存门槛
4. Agent 配置可按 agent 覆盖模型/温度/提示词
5. 模型测试反馈明确
6. 一致性检查能发现真实数据问题
7. 保存状态「未保存 / 已保存 时间」清晰
8. 从创意创建项目时的字数/节奏/视角配置专业

### 可改进
1. 数据质量治理（去重、标题同步）优先于新功能
2. 导出、删除、统计应在 UI 可达
3. 聊天组件 i18n 全面中文化
4. 专注模式应真正隐藏侧栏
5. 创意卡 a11y 结构重做（article + 独立删除按钮）
6. 进度百分比需要明确基准（目标总字数）
7. onboarding/初始化应避免重复写入角色世界观

## 通过的关键路径（用户价值）

1. 打开首页 → 看到项目卡片与字数进度
2. 创意中心浏览 18 个创意 → 打开详情 → 五星评分 → 发表评论
3. 继续共创 → AI 给出主角筹码/冲突张力建议
4. 进入「神格觉醒」→ 读第2章正文 → 大纲/角色/世界观可切换
5. 设置 → 模型测试成功 (gemini-3-flash)
6. 新建空项目 → 自动提示初始化 → 新建章节 → 写入正文 → 保存成功
7. 从创意「心声风暴」点创建项目 → 进入字数/节奏/视角配置页
8. 一致性检查 API 返回有效报告

## 建议修复优先级

1. **立即**: 角色/世界观去重工具 + 初始化幂等
2. **立即**: 章节 title 与正文 H1 / 大纲节点同步策略
3. **本周**: 创意卡片 a11y、聊天中文化、右侧面板层叠
4. **本周**: 导出入口、更多菜单补齐、sortBy 对齐
5. **随后**: 专注模式、进度语义、status 状态机、token 上限校验

## 截图索引

- 01-home.png 首页
- 02-ideas.png 创意中心
- 03-idea-detail.png 创意详情
- 05-cocreate-reply.png 共创 AI 回复
- 07-project-studio.png 项目写作
- 08/09/10 outline/characters/world
- 11-settings / 12-agents / 13-model-test2
- 14-new-project 开书路径
- 16-after-create 空项目
- 21-context / 22-generate
- 27-create-from-idea 从创意初始化配置
