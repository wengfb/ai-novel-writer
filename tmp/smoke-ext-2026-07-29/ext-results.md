# 扩展测试结果 2026-07-29 00:10:28

- 合计: 33 | PASS: 27 | FAIL: 6

| 领域 | PASS | FAIL |
|------|------|------|
| agents | 7 | 1 |
| ai-generate | 3 | 2 |
| ai-stream | 3 | 1 |
| changeset | 2 | 1 |
| fixture | 5 | 0 |
| idea | 2 | 0 |
| init | 1 | 1 |
| onboarding | 4 | 0 |

| 结果 | 领域 | 用例 | HTTP | 详情 |
|------|------|------|------|------|
| ✅ | fixture | create project | 201 |  |
| ✅ | fixture | create chapter | 201 |  |
| ✅ | fixture | create character | 200 |  |
| ✅ | fixture | create world | 200 |  |
| ✅ | agents | list agents | 200 |  |
| ✅ | agents | save prompt slot=system | 200 |  |
| ❌ | agents | verify prompt persisted | 500 |  |
| ✅ | agents | reset prompt slot | 200 |  |
| ✅ | agents | verify prompt reset | 200 |  |
| ✅ | agents | save runtime temp/maxTokens | 200 |  |
| ✅ | agents | clear runtime overrides | 200 |  |
| ✅ | agents | unknown agent runtime -> not found | 404 | {"code": "NOT_FOUND", "message": "Agent不存在"} |
| ✅ | changeset | analyze character impacts | 200 |  |
| ❌ | changeset | patch change set | 400 | {"code": "INVALID_PARAMS", "message": "[\n  {\n    \"expected\": \"array\",\n    \"code\": \"invalid_type\",\n    \"path\": [\n      \"itemS |
| ✅ | changeset | handoff to chapter agent | 200 |  |
| ✅ | idea | create for convert | 201 |  |
| ✅ | idea | convert to bootstrap payload | 200 |  |
| ✅ | onboarding | bootstrap empty body rejected | 400 | {"code": "INVALID_PARAMS", "message": "参数验证失败", "details": [{"field": "projectTitle", "message": "Invalid input: expected string, received u |
| ✅ | onboarding | finalize empty body rejected | 500 | {"code": "SERVER_ERROR", "message": "[\n  {\n    \"expected\": \"string\",\n    \"code\": \"invalid_type\",\n    \"path\": [\n      \"projec |
| ✅ | onboarding | idea-extract short/invalid handling | 500 | status=500 {"code": "SERVER_ERROR", "message": "[\n  {\n    \"expected\": \"string\",\n    \"code\": \"invalid_type\",\n    \"path\": [\n    |
| ✅ | onboarding | extract empty body handling | 500 | {"success":false,"data":null,"error":{"code":"SERVER_ERROR","message":"[\n  {\n    \"code\": \"invalid_value\",\n    \"v |
| ✅ | init | get init-progress | 200 |  |
| ❌ | init | put init-progress (best-effort) | 500 | {"success":false,"data":null,"error":{"code":"SERVER_ERROR","message":"[\n  {\n    \"expected\": \"array\",\n    \"code\": \"invalid_type\", |
| ✅ | ai-stream | rewrite SSE (partial read) | 200 | stream_bytes=139 preview=data: {"type":"start"}  data: {"type":"progress","content":"他低语。"}  data: {"type":"done","data":{"rewrittenText":"他 |
| ✅ | ai-stream | continue SSE (partial read, targetWords=80) | 200 | stream_bytes=860 preview=data: {"type":"start"}  data: {"type":"progress","content":"雨水混着蓝光在"}  data: {"type":"progress","content":"指缝流淌。远处的 |
| ✅ | ai-stream | summarize chapter | 200 | {"success":true,"data":{"chapterCount":0,"message":"所有章节已有摘要，无需更新"},"error":null} |
| ❌ | ai-generate | generate character (stream/json) | 201 | stream_bytes=2877 preview={"success":true,"data":{"character":{"id":"cms4upw9p001njyvr3319ml84","projectId":"cms4uoq8v001ajyvrnxwehssi","nam |
| ❌ | ai-generate | generate world-element | 201 | stream_bytes=4346 preview={"success":true,"data":{"element":{"id":"cms4uq6xi001pjyvr3xpe0azh","projectId":"cms4uoq8v001ajyvrnxwehssi","type" |
| ❌ | ai-stream | studio chat SSE partial | 500 | "服务器错误" |
| ✅ | ai-generate | agents/run consistency (best-effort) | 200 | {"success":true,"data":{"agentId":"consistency","text":"```json\n{\n  \"personalityConsistency\": 0,\n  \"dialogueConsistency\": 0,\n  \"has |
| ✅ | ai-generate | random-story-idea | 200 |  |
| ✅ | ai-generate | models test | 200 |  |
| ✅ | fixture | delete project | 200 |  |
