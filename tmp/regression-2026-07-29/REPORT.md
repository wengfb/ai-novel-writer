# 回归结果 2026-07-29

- 总计 38 · 通过 **38** · 失败 **0**

| 项 | 结果 | 详情 |
|---|---|---|
| health projects | ✅ | 200 |
| create project | ✅ | 201 cms7oyfhk000025vrqwr24ktt |
| create character string personality | ✅ | 201 |
| create world element | ✅ | 201 |
| export markdown + chars + world | ✅ | status=200 len=151 |
| create outline volume | ✅ | 201 |
| create outline chapter | ✅ | 201 |
| list outlines after create | ✅ | ['第一卷·开端', '第一章·觉醒'] |
| update outline title | ✅ | 200 |
| list after outline update | ✅ | ['第一卷·开端', '第一章·更新后的标题'] |
| create chapter with outline title | ✅ | 201 |
| chapter title independent of outline | ✅ | ch=用户改过的章节名 |
| init with duplicates | ✅ | 200 {"success":true,"data":{"projectId":"cms7oyfhk000025vrqwr24ktt","updated":true},"error":null} |
| init dedupe characters | ✅ | names=['新角色甲', '测人设'] |
| init dedupe world | ✅ | names=['云端区', '天网公司'] |
| ideas sortBy=updatedAt | ✅ | 200 |
| ideas sortBy=createdAt | ✅ | 200 |
| reject huge contextMaxTokens | ✅ | {"success":false,"data":null,"error":{"code":"INVALID_SETTINGS","message":"上下文窗口上限不能超过 2,000,000"}} |
| reject huge maxTokens | ✅ | {"success":false,"data":null,"error":{"code":"INVALID_SETTINGS","message":"最大输出 Token 不能超过 200,000"}} |
| accept valid tokens | ✅ | 200 |
| save agent prompt | ✅ | 200 |
| prompt cache immediate read | ✅ | marker present |
| reset agent prompt | ✅ | 200 |
| finalize invalid JSON → 400 | ✅ | 400 |
| finalize empty → 400 | ✅ | 400 |
| idea-extract empty → 400 | ✅ | 400 |
| chat empty messages → 400 | ✅ | 400 |
| chat missing content → 400 | ✅ | 400 |
| chat content string not 500 | ✅ | status=200 |
| chat i18n placeholder zh | ✅ |  |
| chat i18n send zh | ✅ |  |
| idea card a11y open label | ✅ |  |
| idea card no role=button wrapper | ✅ |  |
| layout center overflow-hidden | ✅ |  |
| outline root default volume | ✅ |  |
| outline edit delete confirm | ✅ |  |
| outline force bypass isLoading | ✅ |  |
| cleanup project | ✅ | 200 |
