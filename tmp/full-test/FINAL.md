# 完整回归测试报告

时间: 2026-07-23

## API

| 用例 | 结果 | 备注 |
|------|------|------|
| GET /api/ai/agents | PASS | 10 个 agent |
| POST random-story-idea | PASS | 3 张创意卡 |
| POST generate/character | PASS | 生成「夏冰」 |
| POST generate/world-element | PASS | 生成「灰域」 |
| GET chapters | PASS | 2 章 |
| POST consistency-check | PASS | 规则+AI |
| POST /api/ai/chat | PASS | stream ok |
| POST generate/style-anchor | PASS | ~1784 字 |
| GET /api/ideas | PASS | |
| POST generate/outline | PASS | 修解析后 3 章/5 角/4 设定 |

首轮 API: 9/9 PASS；大纲初测失败后已修复并 PASS。

## 浏览器 UI

| 用例 | 结果 |
|------|------|
| 首页加载 | PASS，无 console error |
| 进入项目「神格觉醒」 | PASS |
| 设置 → Agent 提示词 | PASS，下拉 10 个 |
| 第 1 章 + 聊天「主角叫什么」 | PASS，答「李燃」 |

## 结论

结构化任务已与聊天同通道（runAgent + JSON + Zod）。大纲解析已加强（尾部脏字符 / 最长候选优先 / 宽松 schema）。
