# API CRUD 矩阵结果

- 时间: 2026-07-28 23:56:09
- 合计: 62 | PASS: 61 | FAIL: 1

## 按领域

| 领域 | PASS | FAIL |
|------|------|------|
| agents | 1 | 0 |
| chapter | 8 | 0 |
| character | 7 | 0 |
| context | 2 | 0 |
| export | 2 | 1 |
| idea | 15 | 0 |
| outline | 8 | 0 |
| project | 8 | 0 |
| settings | 2 | 0 |
| world | 8 | 0 |

## 明细

| 结果 | 领域 | 操作 | 用例 | HTTP | 详情 |
|------|------|------|------|------|------|
| ✅ | project | list | list projects | 200 |  |
| ✅ | project | create | create project | 201 |  |
| ✅ | project | read | get project | 200 |  |
| ✅ | project | update | update project meta | 200 |  |
| ✅ | project | read | verify project update | 200 |  |
| ✅ | project | extra | project stats | 200 |  |
| ✅ | chapter | list | list chapters (empty) | 200 |  |
| ✅ | chapter | create | create chapter 1 | 201 |  |
| ✅ | chapter | read | get chapter | 200 |  |
| ✅ | chapter | update | update chapter | 200 |  |
| ✅ | chapter | read | verify chapter update | 200 |  |
| ✅ | chapter | create | create chapter 2 temp | 201 |  |
| ✅ | chapter | delete | delete chapter 2 | 200 |  |
| ✅ | chapter | read | verify chapter deleted | 404 | {"code": "CHAPTER_NOT_FOUND", "message": "章节不存在"} |
| ✅ | character | list | list characters | 200 |  |
| ✅ | character | create | create character | 200 |  |
| ✅ | character | read | get character | 200 |  |
| ✅ | character | update | update character | 200 |  |
| ✅ | character | read | verify character update | 200 |  |
| ✅ | character | create | create temp character | 200 |  |
| ✅ | character | delete | delete temp character | 200 |  |
| ✅ | world | list | list world elements | 200 |  |
| ✅ | world | create | create world element | 200 |  |
| ✅ | world | read | get world element | 200 |  |
| ✅ | world | update | update world element | 200 |  |
| ✅ | world | read | verify world update | 200 |  |
| ✅ | world | create | create temp world | 200 |  |
| ✅ | world | delete | delete temp world | 200 |  |
| ✅ | world | extra | reject invalid schema | 400 | {"code": "INVALID_PARAMS", "message": "参数验证失败", "details": [{"field": "type", "message": "Invalid option: expected one o |
| ✅ | outline | list | list outlines | 200 |  |
| ✅ | outline | create | create volume | 201 |  |
| ✅ | outline | create | create chapter node | 201 |  |
| ✅ | outline | read | get outline node | 200 |  |
| ✅ | outline | update | update outline node | 200 |  |
| ✅ | outline | read | verify outline update | 200 |  |
| ✅ | outline | create | create temp scene | 201 |  |
| ✅ | outline | delete | delete temp scene | 200 |  |
| ✅ | idea | list | list ideas | 200 |  |
| ✅ | idea | extra | sortBy=updatedAt rejected | 400 | {"code": "INVALID_PARAMS", "message": "参数验证失败", "details": [{"field": "sortBy", "message": "Invalid option: expected one |
| ✅ | idea | create | create idea | 201 |  |
| ✅ | idea | read | get idea | 200 |  |
| ✅ | idea | update | update idea + favorite | 200 |  |
| ✅ | idea | read | verify idea update | 200 |  |
| ✅ | idea | extra | rate idea score=4 | 200 |  |
| ✅ | idea | extra | re-rate idea score=2 | 200 |  |
| ✅ | idea | read | verify rating=2 | 200 |  |
| ✅ | idea | extra | rate with wrong field `rating` rejected | 400 | {"code": "INVALID_PARAMS", "message": "评分必须是 1-5 的整数"} |
| ✅ | idea | extra | create comment | 201 |  |
| ✅ | idea | extra | list comments | 200 |  |
| ✅ | idea | extra | delete comment has no API (expect 404) | 404 |  |
| ✅ | settings | read | get settings | 200 |  |
| ✅ | settings | update | put settings (idempotent model) | 200 |  |
| ✅ | export | extra | GET export should 405 | 405 |  |
| ❌ | export | create | POST export markdown | 500 | {"code": "SERVER_ERROR", "message": "char.personality.join is not a function"} |
| ✅ | export | create | POST export txt chapters-only | 200 |  |
| ✅ | context | read | get context with chapterId | 200 |  |
| ✅ | context | extra | context without chapterId fails | 400 | {"code": "INVALID_PARAMS", "message": "缺少必要参数"} |
| ✅ | agents | list | list agents | 200 |  |
| ✅ | project | delete | delete project | 200 |  |
| ✅ | project | read | verify project deleted | 404 | {"code": "PROJECT_NOT_FOUND", "message": "项目不存在"} |
| ✅ | idea | delete | delete idea | 200 |  |
| ✅ | idea | read | verify idea deleted | 404 | {"code": "NOT_FOUND", "message": "创意不存在"} |
