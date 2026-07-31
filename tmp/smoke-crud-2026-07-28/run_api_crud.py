#!/usr/bin/env python3
"""API CRUD matrix smoke for AI Novel Writer. Outputs JSON lines + summary markdown."""
from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any

BASE = "http://localhost:3000"
OUT = Path(__file__).resolve().parent
TS = time.strftime("%Y%m%d-%H%M%S")


@dataclass
class Case:
    domain: str
    op: str  # list|create|read|update|delete|extra
    name: str
    ok: bool
    status: int | None = None
    detail: str = ""
    id: str | None = None


results: list[Case] = []


def req(method: str, path: str, body: Any | None = None, timeout: float = 60) -> tuple[int, Any, str]:
    url = BASE + path
    data = None
    headers = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            try:
                parsed = json.loads(raw) if raw else None
            except json.JSONDecodeError:
                parsed = {"_raw": raw[:500]}
            return resp.status, parsed, raw[:800]
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(raw) if raw else None
        except json.JSONDecodeError:
            parsed = {"_raw": raw[:500]}
        return e.code, parsed, raw[:800]
    except Exception as e:
        return 0, None, str(e)


def ok_payload(parsed: Any) -> bool:
    if not isinstance(parsed, dict):
        return False
    if parsed.get("success") is True:
        return True
    # some endpoints may return data without envelope
    return "data" in parsed and parsed.get("error") in (None, {})


def record(
    domain: str,
    op: str,
    name: str,
    status: int,
    parsed: Any,
    raw: str,
    expect_ok: bool = True,
    id_: str | None = None,
    *,
    expect_status: int | None = None,
    treat_as_info: bool = False,
):
    """expect_ok=True: business success envelope. expect_ok=False: expect HTTP/error failure.
    expect_status: if set, status must match. treat_as_info: always pass, just document."""
    if treat_as_info:
        success = True
    elif expect_status is not None:
        success = status == expect_status
    elif expect_ok:
        success = bool(status and 200 <= status < 300 and ok_payload(parsed))
        # plain 200 file responses (export) without success envelope
        if not success and status == 200 and parsed is not None and not (isinstance(parsed, dict) and parsed.get("success") is False):
            if isinstance(parsed, dict) and parsed.get("success") is True:
                success = True
            elif isinstance(parsed, dict) and "_raw" in parsed:
                success = True
            elif not isinstance(parsed, dict):
                success = True
    else:
        success = bool(status >= 400 or (isinstance(parsed, dict) and parsed.get("success") is False))

    detail = ""
    if isinstance(parsed, dict):
        err = parsed.get("error")
        if err:
            detail = json.dumps(err, ensure_ascii=False)[:300]
        elif not success:
            detail = raw[:200]
        elif treat_as_info:
            detail = raw[:200] if raw else json.dumps(parsed, ensure_ascii=False)[:200]
    else:
        detail = raw[:200]
    c = Case(domain, op, name, success, status, detail, id_)
    results.append(c)
    mark = "PASS" if success else "FAIL"
    print(f"[{mark}] {domain:12} {op:8} {name}  status={status} {detail[:80]}")
    return success, parsed


def dig(parsed: Any, *keys: str) -> Any:
    cur = parsed
    for k in keys:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(k)
    return cur


def main() -> int:
    stamp = f"CRUD-{TS}"

    # ---------- PROJECT ----------
    st, p, raw = req("GET", "/api/projects?limit=50")
    record("project", "list", "list projects", st, p, raw)
    projects = dig(p, "data", "projects") or []

    st, p, raw = req(
        "POST",
        "/api/projects",
        {
            "title": f"{stamp}-项目",
            "description": "CRUD 矩阵测试项目，测完删除",
            "genre": "科幻",
            "status": "draft",
            "pov": "third_person",
        },
    )
    ok, p = record("project", "create", "create project", st, p, raw)
    pid = dig(p, "data", "project", "id") or dig(p, "data", "id")
    if not pid:
        print("FATAL: no project id", raw)
        dump()
        return 2

    st, p, raw = req("GET", f"/api/projects/{pid}")
    record("project", "read", "get project", st, p, raw, id_=pid)
    title = dig(p, "data", "project", "title") or dig(p, "data", "title")
    if title and stamp not in str(title):
        results[-1].ok = False
        results[-1].detail = f"title mismatch: {title}"

    st, p, raw = req(
        "PUT",
        f"/api/projects/{pid}",
        {"title": f"{stamp}-项目-已改", "description": "已更新简介", "genre": "都市", "status": "writing"},
    )
    record("project", "update", "update project meta", st, p, raw, id_=pid)
    st, p, raw = req("GET", f"/api/projects/{pid}")
    t2 = dig(p, "data", "project", "title") or dig(p, "data", "title")
    g2 = dig(p, "data", "project", "genre") or dig(p, "data", "genre")
    verify_ok = t2 == f"{stamp}-项目-已改" and g2 == "都市"
    record("project", "read", "verify project update", 200 if verify_ok else 500, {"success": verify_ok, "data": {"title": t2, "genre": g2}}, str(t2), id_=pid)

    st, p, raw = req("GET", f"/api/projects/{pid}/stats")
    record("project", "extra", "project stats", st, p, raw, id_=pid)

    # ---------- CHAPTER ----------
    st, p, raw = req("GET", f"/api/projects/{pid}/chapters")
    record("chapter", "list", "list chapters (empty)", st, p, raw, id_=pid)

    st, p, raw = req(
        "POST",
        f"/api/projects/{pid}/chapters",
        {"chapterNumber": 1, "title": "CRUD第一章", "content": "<p>初始正文A</p>", "summary": "摘要A"},
    )
    ok, p = record("chapter", "create", "create chapter 1", st, p, raw)
    cid = dig(p, "data", "chapter", "id")

    st, p, raw = req("GET", f"/api/projects/{pid}/chapters/{cid}")
    record("chapter", "read", "get chapter", st, p, raw, id_=cid)

    st, p, raw = req(
        "PUT",
        f"/api/projects/{pid}/chapters/{cid}",
        {"title": "CRUD第一章-改", "content": "<p>更新后的正文B，多写一点字数。</p>", "summary": "摘要B", "notes": "备注"},
    )
    record("chapter", "update", "update chapter", st, p, raw, id_=cid)
    st, p, raw = req("GET", f"/api/projects/{pid}/chapters/{cid}")
    ct = dig(p, "data", "chapter", "title")
    cc = dig(p, "data", "chapter", "content") or ""
    vok = ct == "CRUD第一章-改" and "正文B" in cc
    record("chapter", "read", "verify chapter update", 200 if vok else 500, {"success": vok, "data": {"title": ct}}, "", id_=cid)

    # second chapter for delete isolation
    st, p, raw = req(
        "POST",
        f"/api/projects/{pid}/chapters",
        {"chapterNumber": 2, "title": "待删章节", "content": "temp"},
    )
    ok, p = record("chapter", "create", "create chapter 2 temp", st, p, raw)
    cid2 = dig(p, "data", "chapter", "id")
    st, p, raw = req("DELETE", f"/api/projects/{pid}/chapters/{cid2}")
    record("chapter", "delete", "delete chapter 2", st, p, raw, id_=cid2)
    st, p, raw = req("GET", f"/api/projects/{pid}/chapters/{cid2}")
    record("chapter", "read", "verify chapter deleted", st, p, raw, expect_ok=False, id_=cid2)

    # ---------- CHARACTER ----------
    st, p, raw = req("GET", f"/api/projects/{pid}/characters")
    record("character", "list", "list characters", st, p, raw)

    st, p, raw = req(
        "POST",
        "/api/characters",
        {
            "projectId": pid,
            "name": "CRUD主角",
            "role": "protagonist",
            "importance": 9,
            "personality": "冷静、果断",
            "backstory": "测试背景",
            "motivation": "完成测试",
        },
    )
    ok, p = record("character", "create", "create character", st, p, raw)
    char_id = dig(p, "data", "character", "id")

    st, p, raw = req("GET", f"/api/characters/{char_id}")
    record("character", "read", "get character", st, p, raw, id_=char_id)

    st, p, raw = req(
        "PUT",
        f"/api/characters/{char_id}",
        {"name": "CRUD主角-改", "role": "protagonist", "personality": "更偏执", "appearance": "黑发"},
    )
    record("character", "update", "update character", st, p, raw, id_=char_id)
    st, p, raw = req("GET", f"/api/characters/{char_id}")
    cn = dig(p, "data", "character", "name")
    record("character", "read", "verify character update", 200 if cn == "CRUD主角-改" else 500, {"success": cn == "CRUD主角-改", "data": {"name": cn}}, "", id_=char_id)

    st, p, raw = req(
        "POST",
        "/api/characters",
        {"projectId": pid, "name": "待删配角", "role": "supporting"},
    )
    temp_char = dig(p, "data", "character", "id")
    record("character", "create", "create temp character", st, p, raw, id_=temp_char)
    st, p, raw = req("DELETE", f"/api/characters/{temp_char}")
    record("character", "delete", "delete temp character", st, p, raw, id_=temp_char)

    # ---------- WORLD ----------
    st, p, raw = req("GET", f"/api/projects/{pid}/world-elements")
    record("world", "list", "list world elements", st, p, raw)

    st, p, raw = req(
        "POST",
        "/api/world-elements",
        {
            "projectId": pid,
            "name": "CRUD测试城",
            "type": "location",
            "category": "detail",
            "description": "一座用于 CRUD 测试的城市",
            "importance": 6,
        },
    )
    ok, p = record("world", "create", "create world element", st, p, raw)
    wid = dig(p, "data", "worldElement", "id") or dig(p, "data", "element", "id")

    st, p, raw = req("GET", f"/api/world-elements/{wid}")
    record("world", "read", "get world element", st, p, raw, id_=wid)

    st, p, raw = req(
        "PUT",
        f"/api/world-elements/{wid}",
        {"name": "CRUD测试城-改", "description": "更新后的描述", "type": "location", "category": "core_rule"},
    )
    record("world", "update", "update world element", st, p, raw, id_=wid)
    st, p, raw = req("GET", f"/api/world-elements/{wid}")
    wn = dig(p, "data", "worldElement", "name") or dig(p, "data", "element", "name")
    record("world", "read", "verify world update", 200 if wn == "CRUD测试城-改" else 500, {"success": wn == "CRUD测试城-改", "data": {"name": wn}}, "", id_=wid)

    st, p, raw = req(
        "POST",
        "/api/world-elements",
        {"projectId": pid, "name": "待删地点", "type": "item", "category": "detail", "description": "temp"},
    )
    temp_w = dig(p, "data", "worldElement", "id")
    record("world", "create", "create temp world", st, p, raw, id_=temp_w)
    st, p, raw = req("DELETE", f"/api/world-elements/{temp_w}")
    record("world", "delete", "delete temp world", st, p, raw, id_=temp_w)

    # bad schema regression
    st, p, raw = req(
        "POST",
        "/api/world-elements",
        {"projectId": pid, "name": "bad", "category": "location", "description": "x"},
    )
    record("world", "extra", "reject invalid schema", st, p, raw, expect_ok=False)

    # ---------- OUTLINE ----------
    st, p, raw = req("GET", f"/api/projects/{pid}/outlines")
    record("outline", "list", "list outlines", st, p, raw)

    st, p, raw = req(
        "POST",
        f"/api/projects/{pid}/outlines",
        {"type": "volume", "order": 1, "title": "CRUD第一卷", "description": "卷描述", "status": "planned"},
    )
    ok, p = record("outline", "create", "create volume", st, p, raw)
    vol_id = dig(p, "data", "outline", "id") or dig(p, "data", "id")

    st, p, raw = req(
        "POST",
        f"/api/projects/{pid}/outlines",
        {
            "type": "chapter",
            "order": 1,
            "title": "CRUD大纲章",
            "description": "章纲要",
            "parentId": vol_id,
            "plotFunction": "推进",
            "tensionLevel": 6,
            "emotionalGoal": "紧张",
        },
    )
    ok, p = record("outline", "create", "create chapter node", st, p, raw)
    oid = dig(p, "data", "outline", "id") or dig(p, "data", "id")

    st, p, raw = req("GET", f"/api/outlines/{oid}")
    record("outline", "read", "get outline node", st, p, raw, id_=oid)

    st, p, raw = req(
        "PUT",
        f"/api/outlines/{oid}",
        {"title": "CRUD大纲章-改", "description": "更新纲要", "status": "writing", "tensionLevel": 8},
    )
    record("outline", "update", "update outline node", st, p, raw, id_=oid)
    st, p, raw = req("GET", f"/api/outlines/{oid}")
    ot = dig(p, "data", "outline", "title") or dig(p, "data", "title")
    record("outline", "read", "verify outline update", 200 if ot == "CRUD大纲章-改" else 500, {"success": ot == "CRUD大纲章-改", "data": {"title": ot}}, "", id_=oid)

    st, p, raw = req(
        "POST",
        f"/api/projects/{pid}/outlines",
        {"type": "scene", "order": 99, "title": "待删场景", "parentId": oid},
    )
    temp_o = dig(p, "data", "outline", "id") or dig(p, "data", "id")
    record("outline", "create", "create temp scene", st, p, raw, id_=temp_o)
    st, p, raw = req("DELETE", f"/api/outlines/{temp_o}")
    record("outline", "delete", "delete temp scene", st, p, raw, id_=temp_o)

    # ---------- IDEA ----------
    st, p, raw = req("GET", "/api/ideas?limit=5&sortBy=createdAt")
    record("idea", "list", "list ideas", st, p, raw)
    st, p, raw = req("GET", "/api/ideas?sortBy=updatedAt")
    record("idea", "extra", "sortBy=updatedAt rejected", st, p, raw, expect_ok=False)

    idea_body = {
        "title": f"{stamp}-创意",
        "genre": "科幻",
        "worldBuilding": "近未来城市，AI 监控一切。",
        "protagonist": "测试主角阿测",
        "coreConflict": "隐私与安全的冲突。",
        "mainGoal": "揭开系统真相。",
        "highConcept": "一个人对抗全城 AI。",
        "sublimation": "自由意志。",
        "openingHook": "手机自己亮了：你被选中了。",
        "aiGenerated": False,
        "status": "draft",
    }
    st, p, raw = req("POST", "/api/ideas", idea_body)
    ok, p = record("idea", "create", "create idea", st, p, raw)
    iid = dig(p, "data", "idea", "id") or dig(p, "data", "id")

    st, p, raw = req("GET", f"/api/ideas/{iid}")
    record("idea", "read", "get idea", st, p, raw, id_=iid)

    st, p, raw = req("PATCH", f"/api/ideas/{iid}", {"title": f"{stamp}-创意-改", "status": "favorited", "coreConflict": "冲突已加强"})
    record("idea", "update", "update idea + favorite", st, p, raw, id_=iid)
    st, p, raw = req("GET", f"/api/ideas/{iid}")
    it = dig(p, "data", "idea", "title")
    ist = dig(p, "data", "idea", "status")
    vok = it == f"{stamp}-创意-改" and ist == "favorited"
    record("idea", "read", "verify idea update", 200 if vok else 500, {"success": vok, "data": {"title": it, "status": ist}}, "", id_=iid)

    st, p, raw = req("POST", f"/api/ideas/{iid}/rate", {"score": 4})
    record("idea", "extra", "rate idea score=4", st, p, raw, id_=iid)
    st, p, raw = req("POST", f"/api/ideas/{iid}/rate", {"score": 2})
    record("idea", "extra", "re-rate idea score=2", st, p, raw, id_=iid)
    st, p, raw = req("GET", f"/api/ideas/{iid}")
    rating = dig(p, "data", "idea", "rating")
    vok = rating == 2
    record("idea", "read", "verify rating=2", st, {"success": vok, "data": {"rating": rating}}, "", id_=iid)
    if not vok:
        results[-1].ok = False

    # wrong field name should fail
    st, p, raw = req("POST", f"/api/ideas/{iid}/rate", {"rating": 5})
    record("idea", "extra", "rate with wrong field `rating` rejected", st, p, raw, expect_ok=False, id_=iid)

    st, p, raw = req("POST", f"/api/ideas/{iid}/comments", {"content": "CRUD 评论 1"})
    record("idea", "extra", "create comment", st, p, raw, id_=iid)
    st, p, raw = req("GET", f"/api/ideas/{iid}/comments")
    record("idea", "extra", "list comments", st, p, raw, id_=iid)
    comments = dig(p, "data", "comments") or []
    cmt_id = comments[0]["id"] if comments else "missing"
    st, p, raw = req("DELETE", f"/api/ideas/{iid}/comments/{cmt_id}")
    # document: no delete route (Next may 404 HTML)
    record(
        "idea",
        "extra",
        "delete comment has no API (expect 404)",
        st,
        p,
        raw,
        expect_status=404,
        id_=iid,
    )

    # ---------- SETTINGS ----------
    st, p, raw = req("GET", "/api/settings")
    record("settings", "read", "get settings", st, p, raw)
    settings = dig(p, "data", "settings") or {}
    old_model = settings.get("ai.model")
    # non-destructive: write a probe key then restore model same value
    st, p, raw = req("PUT", "/api/settings", {"settings": {"ai.model": old_model or "gemini-3-flash"}})
    record("settings", "update", "put settings (idempotent model)", st, p, raw)

    # ---------- EXPORT ----------
    st, p, raw = req("GET", f"/api/projects/{pid}/export")
    record("export", "extra", "GET export should 405", st, p, raw, expect_status=405)

    st, p, raw = req(
        "POST",
        f"/api/projects/{pid}/export",
        {"format": "markdown", "includeOutlines": True, "includeCharacters": True, "includeWorldElements": True},
    )
    # file response: 200 + non-json body, or json error
    if st == 200 and (not isinstance(p, dict) or p.get("success") is not False):
        record("export", "create", "POST export markdown", st, {"success": True, "data": {"bytes": len(raw)}}, raw[:200], id_=pid)
    else:
        record("export", "create", "POST export markdown", st, p if isinstance(p, dict) else {"success": False, "data": {"_raw": raw[:300]}}, raw[:300], id_=pid)

    st, p, raw = req(
        "POST",
        f"/api/projects/{pid}/export",
        {"format": "txt", "includeOutlines": False, "includeCharacters": False, "includeWorldElements": False},
    )
    if st == 200 and (not isinstance(p, dict) or p.get("success") is not False):
        record("export", "create", "POST export txt chapters-only", st, {"success": True, "data": {"bytes": len(raw)}}, raw[:200], id_=pid)
    else:
        record("export", "create", "POST export txt chapters-only", st, p if isinstance(p, dict) else {"success": False}, raw[:300], id_=pid)

    # ---------- CONTEXT ----------
    st, p, raw = req("GET", f"/api/ai/context?projectId={pid}&chapterId={cid}")
    record("context", "read", "get context with chapterId", st, p, raw)
    st, p, raw = req("GET", f"/api/ai/context?projectId={pid}")
    record("context", "extra", "context without chapterId fails", st, p, raw, expect_ok=False)

    # ---------- AGENTS ----------
    st, p, raw = req("GET", "/api/ai/agents")
    record("agents", "list", "list agents", st, p, raw)

    # ---------- CLEANUP project (cascade?) ----------
    st, p, raw = req("DELETE", f"/api/projects/{pid}")
    record("project", "delete", "delete project", st, p, raw, id_=pid)
    st, p, raw = req("GET", f"/api/projects/{pid}")
    record("project", "read", "verify project deleted", st, p, raw, expect_ok=False, id_=pid)

    # leftover idea cleanup
    if iid:
        st, p, raw = req("DELETE", f"/api/ideas/{iid}")
        record("idea", "delete", "delete idea", st, p, raw, id_=iid)
        st, p, raw = req("GET", f"/api/ideas/{iid}")
        record("idea", "read", "verify idea deleted", st, p, raw, expect_ok=False, id_=iid)

    return dump()


def dump() -> int:
    passed = sum(1 for r in results if r.ok)
    failed = sum(1 for r in results if not r.ok)
    by_domain: dict[str, dict[str, int]] = {}
    for r in results:
        d = by_domain.setdefault(r.domain, {"pass": 0, "fail": 0})
        d["pass" if r.ok else "fail"] += 1

    payload = {
        "total": len(results),
        "passed": passed,
        "failed": failed,
        "by_domain": by_domain,
        "cases": [asdict(r) for r in results],
    }
    (OUT / "api-crud-results.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    lines = [
        f"# API CRUD 矩阵结果",
        f"",
        f"- 时间: {time.strftime('%Y-%m-%d %H:%M:%S')}",
        f"- 合计: {len(results)} | PASS: {passed} | FAIL: {failed}",
        f"",
        f"## 按领域",
        f"",
        f"| 领域 | PASS | FAIL |",
        f"|------|------|------|",
    ]
    for dom, c in sorted(by_domain.items()):
        lines.append(f"| {dom} | {c['pass']} | {c['fail']} |")
    lines += ["", "## 明细", "", "| 结果 | 领域 | 操作 | 用例 | HTTP | 详情 |", "|------|------|------|------|------|------|"]
    for r in results:
        mark = "✅" if r.ok else "❌"
        det = (r.detail or "").replace("|", "\\|").replace("\n", " ")[:120]
        lines.append(f"| {mark} | {r.domain} | {r.op} | {r.name} | {r.status} | {det} |")
    (OUT / "api-crud-results.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\n=== SUMMARY pass={passed} fail={failed} total={len(results)} ===")
    print(f"Wrote {OUT / 'api-crud-results.md'}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
