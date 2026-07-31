#!/usr/bin/env python3
"""Full coverage of previously-untested items (U-01..U-28, export matrix, abort, etc.)."""
from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

BASE = "http://localhost:3000"
OUT = Path(__file__).resolve().parent
TS = time.strftime("%Y%m%d-%H%M%S")
STAMP = f"FULL-{TS}"

# Keep AI short where possible
SHORT_CHAPTER_WORDS = 400
OUTLINE_CHAPTERS = 3
OUTLINE_TARGET = 10000


@dataclass
class Case:
    uid: str
    domain: str
    name: str
    ok: bool
    status: int | None = None
    detail: str = ""
    duration_ms: int = 0


results: list[Case] = []
cleanup_ids: dict[str, list[str]] = {
    "projects": [],
    "ideas": [],
    "chapters": [],
    "characters": [],
    "worlds": [],
    "outlines": [],
}


def req(
    method: str,
    path: str,
    body: Any | None = None,
    timeout: float = 180,
    *,
    stream: bool = False,
    max_read: int = 12000,
    read_all_stream: bool = False,
    stream_limit: int = 200_000,
) -> tuple[int, Any, str]:
    url = BASE + path
    data = None
    headers = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            if stream:
                chunks: list[bytes] = []
                total = 0
                limit = stream_limit if read_all_stream else max_read
                while total < limit:
                    piece = resp.read(2048)
                    if not piece:
                        break
                    chunks.append(piece)
                    total += len(piece)
                raw = b"".join(chunks).decode("utf-8", errors="replace")
                return (
                    resp.status,
                    {"_stream": True, "preview": raw[:2000], "bytes": total, "full": raw if read_all_stream else None},
                    raw[:2000],
                )
            raw = resp.read().decode("utf-8", errors="replace")
            try:
                parsed = json.loads(raw) if raw else None
            except json.JSONDecodeError:
                parsed = {"_raw": raw[:1000]}
            return resp.status, parsed, raw[:1000]
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(raw) if raw else None
        except json.JSONDecodeError:
            parsed = {"_raw": raw[:1000]}
        return e.code, parsed, raw[:1000]
    except Exception as e:
        return 0, None, str(e)


def ok_json(parsed: Any) -> bool:
    return isinstance(parsed, dict) and parsed.get("success") is True


def dig(p: Any, *keys: str) -> Any:
    cur = p
    for k in keys:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(k)
    return cur


def record(
    uid: str,
    domain: str,
    name: str,
    status: int,
    parsed: Any,
    raw: str,
    *,
    ok: bool | None = None,
    detail: str = "",
    t0: float | None = None,
):
    if ok is None:
        ok = bool(status and 200 <= status < 300 and (ok_json(parsed) or (isinstance(parsed, dict) and parsed.get("_stream"))))
        if isinstance(parsed, dict) and parsed.get("success") is False:
            ok = False
    if not detail:
        if isinstance(parsed, dict) and parsed.get("error"):
            detail = json.dumps(parsed["error"], ensure_ascii=False)[:300]
        elif isinstance(parsed, dict) and parsed.get("preview"):
            detail = f"stream_bytes={parsed.get('bytes')} preview={str(parsed.get('preview'))[:140]}"
        elif not ok:
            detail = (raw or "")[:220]
    ms = int((time.time() - t0) * 1000) if t0 else 0
    c = Case(uid, domain, name, bool(ok), status, detail, ms)
    results.append(c)
    flag = "PASS" if ok else "FAIL"
    line = f"[{flag}] {uid:6} {domain:14} {name}  st={status} {ms}ms {detail[:100]}"
    print(line, flush=True)
    try:
        with open(OUT / "run-live.log", "a", encoding="utf-8") as f:
            f.write(line + "\n")
            f.flush()
        with open(OUT / "full-results.json", "w", encoding="utf-8") as f:
            json.dump([asdict(r) for r in results], f, ensure_ascii=False, indent=2)
    except Exception as _e:
        print(f"(log write err: {_e})", flush=True)
    return ok, parsed


def sample_idea(title: str | None = None) -> dict:
    return {
        "id": f"draft-{int(time.time()*1000)}",
        "title": title or f"{STAMP}-创意",
        "genre": "科幻",
        "worldBuilding": "近未来都市，植入芯片普及，贫民区与云端阶层对立。",
        "protagonist": "底层维修工林深，意外获得可改写现实规则的调试权限。",
        "coreConflict": "系统要抹除所有异常权限持有者，林深必须在被清除前找出真相。",
        "mainGoal": "夺取核心源码并解放被奴役的意识体。",
        "highConcept": "一个修手机的人，拿到了改写世界的 root 权限。",
        "sublimation": "自由不是没有规则，而是谁有权定义规则。",
        "openingHook": "雨夜，报废手机屏幕亮起一行字：你已被授予 root。",
    }


def parse_sse_events(text: str) -> list[dict]:
    events = []
    for block in text.split("\n\n"):
        for line in block.split("\n"):
            if line.startswith("data:"):
                payload = line[5:].strip()
                if not payload or payload == "[DONE]":
                    continue
                try:
                    events.append(json.loads(payload))
                except json.JSONDecodeError:
                    events.append({"_raw": payload[:200]})
    return events


def dump():
    OUT.mkdir(parents=True, exist_ok=True)
    payload = [asdict(r) for r in results]
    (OUT / "full-results.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    passed = sum(1 for r in results if r.ok)
    failed = sum(1 for r in results if not r.ok)
    lines = [
        f"# Full Untested Coverage {TS}",
        "",
        f"- total: {len(results)}",
        f"- pass: {passed}",
        f"- fail: {failed}",
        "",
        "| UID | Domain | Name | OK | Status | ms | Detail |",
        "|-----|--------|------|----|--------|----|--------|",
    ]
    for r in results:
        d = (r.detail or "").replace("|", "\\|").replace("\n", " ")[:180]
        lines.append(f"| {r.uid} | {r.domain} | {r.name} | {'✅' if r.ok else '❌'} | {r.status} | {r.duration_ms} | {d} |")
    fails = [r for r in results if not r.ok]
    lines += ["", "## Failures", ""]
    if not fails:
        lines.append("_none_")
    else:
        for r in fails:
            lines.append(f"- **{r.uid}** `{r.domain}/{r.name}` st={r.status}: {r.detail[:300]}")
    (OUT / "full-results.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\n=== SUMMARY pass={passed} fail={failed} total={len(results)} ===")
    print(f"wrote {OUT/'full-results.md'}")


def cleanup():
    print("\n--- cleanup ---")
    for oid in cleanup_ids["outlines"]:
        req("DELETE", f"/api/outlines/{oid}")
    for cid in cleanup_ids["chapters"]:
        # need project path sometimes — try generic if any
        pass
    for char in cleanup_ids["characters"]:
        req("DELETE", f"/api/characters/{char}")
    for w in cleanup_ids["worlds"]:
        req("DELETE", f"/api/world-elements/{w}")
    for iid in cleanup_ids["ideas"]:
        req("DELETE", f"/api/ideas/{iid}")
    for pid in cleanup_ids["projects"]:
        # delete chapters first via list
        st, p, _ = req("GET", f"/api/projects/{pid}/chapters")
        chs = dig(p, "data", "chapters") or dig(p, "data") or []
        if isinstance(chs, list):
            for ch in chs:
                chid = ch.get("id") if isinstance(ch, dict) else None
                if chid:
                    req("DELETE", f"/api/projects/{pid}/chapters/{chid}")
        st, p, _ = req("GET", f"/api/projects/{pid}/outlines")
        ols = dig(p, "data", "outlines") or dig(p, "data") or []
        if isinstance(ols, list):
            for o in ols:
                oid = o.get("id") if isinstance(o, dict) else None
                if oid:
                    req("DELETE", f"/api/outlines/{oid}")
        st, p, _ = req("GET", f"/api/projects/{pid}/characters")
        chars = dig(p, "data", "characters") or dig(p, "data") or []
        if isinstance(chars, list):
            for c in chars:
                cid = c.get("id") if isinstance(c, dict) else None
                if cid:
                    req("DELETE", f"/api/characters/{cid}")
        st, p, _ = req("GET", f"/api/projects/{pid}/world-elements")
        ws = dig(p, "data", "worldElements") or dig(p, "data", "world-elements") or dig(p, "data") or []
        if isinstance(ws, list):
            for w in ws:
                wid = w.get("id") if isinstance(w, dict) else None
                if wid:
                    req("DELETE", f"/api/world-elements/{wid}")
        req("DELETE", f"/api/projects/{pid}")
        print(f"  deleted project {pid}")


def main() -> int:
    t_all = time.time()

    # ========== FIXTURE ==========
    t0 = time.time()
    st, p, raw = req(
        "POST",
        "/api/projects",
        {
            "title": f"{STAMP}-主夹具",
            "description": "全量未测项测试夹具，可删",
            "genre": "科幻",
            "status": "draft",
            "pov": "third_person",
        },
    )
    record("FIX", "fixture", "create project", st, p, raw, t0=t0)
    pid = dig(p, "data", "project", "id") or dig(p, "data", "id")
    if not pid:
        dump()
        return 2
    cleanup_ids["projects"].append(pid)

    t0 = time.time()
    st, p, raw = req(
        "POST",
        f"/api/projects/{pid}/chapters",
        {
            "chapterNumber": 1,
            "title": "雨夜 root",
            "content": (
                "<h1>第一次权限</h1>"
                "<p>林深蹲在修手机的摊位后，雨丝打在铁皮棚上。废旧屏幕突然亮起：你已被授予 root。</p>"
                "<p>他下意识擦了擦手指，代码像虫一样爬过掌心。「别动。」耳机里有人说。</p>"
                "<p>街对面的全息广告闪了一下，变成一张通缉令——上面是他自己的脸。</p>"
            ),
        },
    )
    record("FIX", "fixture", "create chapter 1", st, p, raw, t0=t0)
    cid = dig(p, "data", "chapter", "id") or dig(p, "data", "id")

    t0 = time.time()
    st, p, raw = req(
        "POST",
        "/api/characters",
        {
            "projectId": pid,
            "name": "林深",
            "role": "protagonist",
            "personality": "谨慎、嘴硬、讲义气",  # string — triggers export bug
            "backstory": "底层手机维修工",
            "motivation": "弄清 root 来源",
        },
    )
    record("FIX", "fixture", "create character string personality", st, p, raw, t0=t0)
    char_id = dig(p, "data", "character", "id") or dig(p, "data", "id")
    if char_id:
        cleanup_ids["characters"].append(char_id)

    t0 = time.time()
    st, p, raw = req(
        "POST",
        "/api/world-elements",
        {
            "projectId": pid,
            "name": "云端塔",
            "type": "location",
            "category": "detail",
            "description": "城市中心的数据圣殿",
        },
    )
    record("FIX", "fixture", "create world", st, p, raw, t0=t0)
    wid = dig(p, "data", "worldElement", "id") or dig(p, "data", "element", "id") or dig(p, "data", "id")
    if wid:
        cleanup_ids["worlds"].append(wid)

    # outline for chapter gen
    t0 = time.time()
    st, p, raw = req(
        "POST",
        f"/api/projects/{pid}/outlines",
        {
            "type": "chapter",
            "order": 2,
            "title": "被追杀的第一夜",
            "description": "林深在贫民区巷战中首次使用 root，误伤友军，引出天网巡逻机。",
            "targetWords": SHORT_CHAPTER_WORDS,
            "status": "planned",
            "plotFunction": "conflict",
            "tensionLevel": 7,
        },
    )
    # try alternate path
    if st >= 400:
        st, p, raw = req(
            "POST",
            "/api/outlines",
            {
                "projectId": pid,
                "type": "chapter",
                "order": 2,
                "title": "被追杀的第一夜",
                "description": "林深在贫民区巷战中首次使用 root，误伤友军，引出天网巡逻机。",
                "targetWords": SHORT_CHAPTER_WORDS,
            },
        )
    record("FIX", "fixture", "create outline ch2", st, p, raw, t0=t0)
    oid = dig(p, "data", "outline", "id") or dig(p, "data", "id")
    if oid:
        cleanup_ids["outlines"].append(oid)

    idea_body = sample_idea()

    # ========== U-23 EXPORT MATRIX ==========
    export_cases = [
        ("U-23a", {"format": "txt", "includeChapters": True}),
        ("U-23b", {"format": "txt", "includeChapters": True, "includeCharacters": True}),
        ("U-23c", {"format": "markdown", "includeChapters": True}),
        ("U-23d", {"format": "markdown", "includeChapters": True, "includeCharacters": True}),
        ("U-23e", {"format": "markdown", "includeChapters": True, "includeWorldElements": True}),
        ("U-23f", {"format": "markdown", "includeChapters": True, "includeOutlines": True}),
        ("U-23g", {
            "format": "markdown",
            "includeChapters": True,
            "includeCharacters": True,
            "includeWorldElements": True,
            "includeOutlines": True,
        }),
    ]
    for uid, body in export_cases:
        t0 = time.time()
        st, p, raw = req("POST", f"/api/projects/{pid}/export", body, timeout=60)
        # export may return text/plain or json with content
        ok = st == 200
        detail = ""
        if isinstance(p, dict):
            if p.get("success") is False:
                ok = False
                detail = json.dumps(p.get("error"), ensure_ascii=False)[:200]
            elif p.get("_raw"):
                detail = f"raw_len={len(p['_raw'])}"
                ok = st == 200 and "join is not a function" not in str(p.get("_raw"))
            elif dig(p, "data"):
                detail = f"keys={list((p.get('data') or {}).keys()) if isinstance(p.get('data'), dict) else type(p.get('data'))}"
        if "personality.join" in (raw or "") or "join is not a function" in (raw or ""):
            ok = False
            detail = "personality.join crash"
        record(uid, "export", f"export {body}", st, p if isinstance(p, dict) else {"_raw": str(p)[:200]}, raw, ok=ok, detail=detail or raw[:120], t0=t0)

    # ========== U-10 FORESHADOWINGS ==========
    t0 = time.time()
    st, p, raw = req(
        "POST",
        "/api/ai/generate/foreshadowings",
        {
            "chapters": [
                {"chapterNumber": 1, "title": "雨夜 root", "summary": "林深获得 root"},
                {"chapterNumber": 2, "title": "追杀", "summary": "天网追捕"},
            ],
            "characters": [{"name": "林深"}],
            "worldSettings": [{"name": "云端塔"}],
            "audience": "男频",
            "pov": "third_person",
        },
        timeout=180,
    )
    fs_ok = st == 200 and (ok_json(p) or dig(p, "data", "foreshadowings"))
    n_fs = len(dig(p, "data", "foreshadowings") or []) if isinstance(p, dict) else 0
    record("U-10", "ai-gen", "generate foreshadowings", st, p, raw, ok=fs_ok and n_fs > 0, detail=f"count={n_fs} " + (raw[:100] if not fs_ok else ""), t0=t0)
    foreshadowings_result = dig(p, "data", "foreshadowings") if fs_ok else []

    # ========== U-11 STYLE ANCHOR ==========
    t0 = time.time()
    st, p, raw = req(
        "POST",
        "/api/ai/generate/style-anchor",
        {
            "description": idea_body["highConcept"] + " " + idea_body["openingHook"],
            "genre": "科幻",
            "hint": "冷硬、短句、雨夜压迫感",
        },
        timeout=180,
    )
    sa_ok = st == 200 and (ok_json(p) or dig(p, "data", "content"))
    content = dig(p, "data", "content") or ""
    record(
        "U-11",
        "ai-gen",
        "generate style-anchor",
        st,
        p,
        raw,
        ok=sa_ok and len(content) >= 100,
        detail=f"len={len(content)} wc={dig(p,'data','wordCount')}",
        t0=t0,
    )
    style_anchor = content

    # ========== U-04 / U-12 ARCHITECTURE → CHARACTERS → WORLD → VOLUME ==========
    t0 = time.time()
    st, p, raw = req(
        "POST",
        "/api/ai/generate/architecture",
        {
            "idea": idea_body,
            "targetWords": 200000,  # min
            "pace": "fast",
            "audience": "男频",
            "tone": "冷硬",
            "pov": "third_person",
        },
        timeout=300,
    )
    arch = dig(p, "data", "architecture") if isinstance(p, dict) else None
    arch_ok = st == 200 and bool(arch)
    record("U-04a", "ai-gen", "generate architecture", st, p, raw, ok=arch_ok, detail=f"keys={list(arch.keys()) if isinstance(arch,dict) else None}", t0=t0)

    chars_payload = None
    if arch_ok:
        t0 = time.time()
        st, p, raw = req(
            "POST",
            "/api/ai/generate/characters",
            {
                "idea": idea_body,
                "architecture": {
                    "storySummary": arch.get("storySummary") or idea_body["highConcept"],
                    "mainConflict": arch.get("mainConflict") or idea_body["coreConflict"],
                    "thematicThread": arch.get("thematicThread") or idea_body["sublimation"],
                },
                "audience": "男频",
                "tone": "冷硬",
                "pov": "third_person",
            },
            timeout=300,
        )
        chars_payload = dig(p, "data", "characters")
        record("U-04b", "ai-gen", "generate characters (batch)", st, p, raw, ok=st == 200 and bool(chars_payload), detail=f"n={len(chars_payload) if isinstance(chars_payload,list) else type(chars_payload)}", t0=t0)
    else:
        record("U-04b", "ai-gen", "generate characters (batch)", 0, None, "skip: no arch", ok=False)

    world_payload = None
    if arch_ok and chars_payload:
        # characters may be list or {characters:[]}
        char_list = chars_payload if isinstance(chars_payload, list) else (chars_payload.get("characters") if isinstance(chars_payload, dict) else [])
        char_list = char_list or []
        t0 = time.time()
        st, p, raw = req(
            "POST",
            "/api/ai/generate/world-plan",
            {
                "idea": idea_body,
                "architecture": {
                    "storySummary": arch.get("storySummary") or "",
                    "mainConflict": arch.get("mainConflict") or "",
                },
                "characters": [{"name": c.get("name", "无名"), "description": c.get("description") or c.get("backstory") or "角色"} for c in char_list[:6] if isinstance(c, dict)],
                "audience": "男频",
                "pov": "third_person",
            },
            timeout=300,
        )
        world_payload = dig(p, "data", "worldSettings")
        record("U-12", "ai-gen", "generate world-plan", st, p, raw, ok=st == 200 and bool(world_payload), detail=f"n={len(world_payload) if isinstance(world_payload,list) else type(world_payload)}", t0=t0)
    else:
        record("U-12", "ai-gen", "generate world-plan", 0, None, "skip", ok=False)

    vol_payload = None
    if arch_ok and chars_payload and world_payload:
        char_list = chars_payload if isinstance(chars_payload, list) else (chars_payload.get("characters") if isinstance(chars_payload, dict) else [])
        world_list = world_payload if isinstance(world_payload, list) else []
        t0 = time.time()
        st, p, raw = req(
            "POST",
            "/api/ai/generate/volume-plan",
            {
                "idea": idea_body,
                "architecture": arch,
                "characters": [{"name": c.get("name", "x"), "role": c.get("role") or "supporting"} for c in (char_list or [])[:8] if isinstance(c, dict)],
                "worldSettings": [{"name": w.get("name", "x"), "type": w.get("type") or "location"} for w in world_list[:8] if isinstance(w, dict)],
                "targetWords": 200000,
                "pace": "fast",
                "audience": "男频",
                "pov": "third_person",
            },
            timeout=360,
        )
        vol_payload = dig(p, "data", "chapters")
        record("U-04c", "ai-gen", "generate volume-plan/chapters", st, p, raw, ok=st == 200 and bool(vol_payload), detail=f"n={len(vol_payload) if isinstance(vol_payload,list) else type(vol_payload)} err={json.dumps(p.get('error'),ensure_ascii=False)[:120] if isinstance(p,dict) else ''}", t0=t0)
    else:
        record("U-04c", "ai-gen", "generate volume-plan/chapters", 0, None, "skip", ok=False)

    # ========== U-04d OUTLINE generate (project-bound, writes DB) ==========
    # Use a SEPARATE project to avoid polluting fixture, then measure duplication on re-run for U-05
    t0 = time.time()
    st, p, raw = req(
        "POST",
        "/api/projects",
        {"title": f"{STAMP}-大纲管线", "description": "outline gen", "genre": "科幻", "status": "draft"},
    )
    pid_ol = dig(p, "data", "project", "id")
    if pid_ol:
        cleanup_ids["projects"].append(pid_ol)
    record("U-04d0", "ai-gen", "create project for outline", st, p, raw, t0=t0)

    t0 = time.time()
    st, p, raw = req(
        "POST",
        "/api/ai/generate/outline",
        {
            "projectId": pid_ol or pid,
            "genre": "科幻",
            "coreIdea": idea_body["highConcept"] + " " + idea_body["coreConflict"],
            "style": "冷硬科幻",
            "targetWords": OUTLINE_TARGET,
            "chapterCount": OUTLINE_CHAPTERS,
        },
        timeout=360,
    )
    ol_ok = st == 200 and (ok_json(p) or dig(p, "data"))
    record("U-04d", "ai-gen", "generate outline (writes DB)", st, p, raw, ok=ol_ok, detail=raw[:160], t0=t0)

    # count after outline
    def count_entities(project_id: str) -> dict:
        out = {}
        for key, path, digk in [
            ("characters", f"/api/projects/{project_id}/characters", "characters"),
            ("worlds", f"/api/projects/{project_id}/world-elements", "worldElements"),
            ("outlines", f"/api/projects/{project_id}/outlines", "outlines"),
            ("chapters", f"/api/projects/{project_id}/chapters", "chapters"),
        ]:
            st2, p2, _ = req("GET", path)
            data = dig(p2, "data", digk)
            if data is None:
                data = dig(p2, "data")
            if isinstance(data, list):
                out[key] = len(data)
            elif isinstance(data, dict) and isinstance(data.get(digk), list):
                out[key] = len(data[digk])
            else:
                out[key] = -1
                out[f"{key}_raw"] = str(p2)[:80]
        return out

    target_ol = pid_ol or pid
    counts_1 = count_entities(target_ol)
    record("U-04e", "ai-gen", "count after first outline", 200, {"success": True}, "", ok=True, detail=json.dumps(counts_1, ensure_ascii=False))

    # ========== U-05 IDEMPOTENCY: run outline again OR init append ==========
    t0 = time.time()
    st, p, raw = req(
        "POST",
        "/api/ai/generate/outline",
        {
            "projectId": target_ol,
            "genre": "科幻",
            "coreIdea": idea_body["highConcept"] + " 第二次生成测试幂等",
            "style": "冷硬科幻",
            "targetWords": OUTLINE_TARGET,
            "chapterCount": OUTLINE_CHAPTERS,
        },
        timeout=360,
    )
    counts_2 = count_entities(target_ol)
    # Also test init append duplication with synthetic results
    t0b = time.time()
    st_i, p_i, raw_i = req(
        "POST",
        f"/api/projects/{pid}/init",
        {
            "results": {
                "characters": {
                    "characters": [
                        {"name": "林深", "role": "protagonist", "description": "重复角色应去重", "personality": ["谨慎"]},
                        {"name": "幂等测试角色A", "role": "supporting", "description": "新角色"},
                    ]
                },
                "worldSettings": {
                    "worldSettings": [
                        {"name": "云端塔", "type": "location", "description": "重复地点"},
                        {"name": "幂等测试地点B", "type": "location", "description": "新地点"},
                    ]
                },
            }
        },
    )
    # count chars/worlds on pid after double init
    st_c1, p_c1, _ = req("GET", f"/api/projects/{pid}/characters")
    chars_after = dig(p_c1, "data", "characters") or dig(p_c1, "data") or []
    names = [c.get("name") for c in chars_after if isinstance(c, dict)]
    lin_count = names.count("林深")
    st_w1, p_w1, _ = req("GET", f"/api/projects/{pid}/world-elements")
    worlds_after = dig(p_w1, "data", "worldElements") or dig(p_w1, "data") or []
    wnames = [w.get("name") for w in worlds_after if isinstance(w, dict)]
    tower_count = wnames.count("云端塔")

    # init currently APPENDS — expect duplication bug
    idempotent = lin_count == 1 and tower_count == 1
    record(
        "U-05a",
        "idempotency",
        "init append does not duplicate existing names",
        st_i,
        p_i,
        raw_i,
        ok=idempotent,
        detail=f"init_st={st_i} 林深x{lin_count} 云端塔x{tower_count} names={names} wnames={wnames}",
        t0=t0b,
    )
    record(
        "U-05b",
        "idempotency",
        "second outline gen entity growth",
        st,
        p,
        raw,
        ok=True,  # informational — always record counts
        detail=f"after1={counts_1} after2={counts_2} outline2_st={st}",
        t0=t0,
    )
    # Mark as fail if second outline roughly doubled characters (bad)
    if counts_1.get("characters", 0) > 0 and counts_2.get("characters", 0) >= counts_1["characters"] * 2:
        results[-1].ok = False
        results[-1].detail += " | FAIL: characters roughly doubled"

    # ========== U-03 GENERATE CHAPTER (short) ==========
    # Find next free chapter number on fixture
    st_ch, p_ch, _ = req("GET", f"/api/projects/{pid}/chapters")
    existing = dig(p_ch, "data", "chapters") or dig(p_ch, "data") or []
    used_nums = {c.get("chapterNumber") for c in existing if isinstance(c, dict)}
    next_num = 2
    while next_num in used_nums:
        next_num += 1

    t0 = time.time()
    st, p, raw = req(
        "POST",
        "/api/ai/generate/chapter",
        {
            "projectId": pid,
            "chapterNumber": next_num,
            "chapterTitle": "被追杀的第一夜",
            "chapterOutline": "林深在贫民区巷战中首次使用 root，误伤友军，引出天网巡逻机。短场景，控制篇幅。",
            "targetWords": SHORT_CHAPTER_WORDS,
        },
        timeout=420,
        stream=True,
        read_all_stream=True,
        stream_limit=500_000,
    )
    stream_text = ""
    if isinstance(p, dict):
        stream_text = p.get("full") or p.get("preview") or ""
    events = parse_sse_events(stream_text)
    types = [e.get("type") for e in events if isinstance(e, dict)]
    start_ev = next((e for e in events if isinstance(e, dict) and e.get("type") == "start"), None)
    done_ev = next((e for e in events if isinstance(e, dict) and e.get("type") in ("done", "complete", "finish", "end")), None)
    # also check if chapter was created
    st2, p2, _ = req("GET", f"/api/projects/{pid}/chapters")
    chs = dig(p2, "data", "chapters") or dig(p2, "data") or []
    gen_ch = next((c for c in chs if isinstance(c, dict) and c.get("chapterNumber") == next_num), None)
    content_len = len((gen_ch or {}).get("content") or "")
    title_ok = (gen_ch or {}).get("title") == "被追杀的第一夜"
    chapter_gen_ok = st == 200 and gen_ch is not None and content_len > 50
    record(
        "U-03",
        "ai-gen",
        f"generate chapter #{next_num} short",
        st,
        p if isinstance(p, dict) else None,
        raw,
        ok=chapter_gen_ok,
        detail=f"types={types[:12]} content_len={content_len} title={((gen_ch or {}).get('title'))} start={bool(start_ev)} done={bool(done_ev)} bytes={p.get('bytes') if isinstance(p,dict) else 0}",
        t0=t0,
    )

    # ========== U-06 TITLE SYNC ==========
    # After gen, compare sidebar title vs H1 in content
    h1 = ""
    body = (gen_ch or {}).get("content") or ""
    import re
    m = re.search(r"<h1[^>]*>(.*?)</h1>", body, re.I | re.S)
    if m:
        h1 = re.sub(r"<[^>]+>", "", m.group(1)).strip()
    elif body:
        # plain first line
        h1 = body.split("\n")[0][:80]
    title = (gen_ch or {}).get("title") or ""
    sync_ok = (not h1) or (h1 == title) or (title in h1) or (h1 in title)
    record(
        "U-06",
        "consistency",
        "chapter title vs content H1",
        200,
        {"success": sync_ok},
        "",
        ok=sync_ok,
        detail=f"title={title!r} h1={h1!r} content_prefix={body[:80]!r}",
    )

    # Also check existing 神格觉醒 if accessible
    st, p, raw = req("GET", "/api/projects")
    projects = dig(p, "data", "projects") or dig(p, "data") or []
    shenge = next((x for x in projects if isinstance(x, dict) and "神格" in (x.get("title") or "")), None)
    if shenge:
        spid = shenge["id"]
        st, p, raw = req("GET", f"/api/projects/{spid}/chapters")
        schs = dig(p, "data", "chapters") or dig(p, "data") or []
        mismatches = []
        for c in schs if isinstance(schs, list) else []:
            ct = c.get("title") or ""
            cc = c.get("content") or ""
            hm = re.search(r"<h1[^>]*>(.*?)</h1>", cc, re.I | re.S)
            if hm:
                hh = re.sub(r"<[^>]+>", "", hm.group(1)).strip()
                if hh and ct and hh != ct and ct not in hh and hh not in ct:
                    mismatches.append({"num": c.get("chapterNumber"), "title": ct, "h1": hh})
        record(
            "U-06b",
            "consistency",
            "神格觉醒 existing title/H1 audit",
            200,
            {"success": len(mismatches) == 0},
            "",
            ok=len(mismatches) == 0,
            detail=json.dumps(mismatches, ensure_ascii=False)[:300] or "all match",
        )

    # ========== U-01 FINALIZE (no full AI bootstrap — use synthetic pipeline results) ==========
    t0 = time.time()
    finalize_body = {
        "projectTitle": f"{STAMP}-finalize落库",
        "idea": idea_body,
        "pov": "third_person",
        "results": {
            "architecture": arch if isinstance(arch, dict) else {
                "storySummary": idea_body["highConcept"],
                "mainConflict": idea_body["coreConflict"],
            },
            "characters": {
                "characters": (chars_payload if isinstance(chars_payload, list) else (chars_payload or {}).get("characters") if isinstance(chars_payload, dict) else None)
                or [
                    {"name": "林深", "role": "protagonist", "description": "维修工", "personality": ["谨慎"], "goal": "求真"},
                    {"name": "阿七", "role": "supporting", "description": "情报贩子", "personality": ["油滑"], "goal": "活命"},
                ]
            },
            "worldSettings": {
                "worldSettings": (world_payload if isinstance(world_payload, list) else None)
                or [
                    {"name": "贫民区", "type": "location", "description": "底层"},
                    {"name": "天网", "type": "organization", "description": "监控系统"},
                ]
            },
            "chapters": {
                "chapters": (vol_payload if isinstance(vol_payload, list) else None)
                or [
                    {"chapterNumber": 1, "title": "root", "summary": "获得权限", "order": 1, "type": "chapter"},
                    {"chapterNumber": 2, "title": "追杀", "summary": "逃亡", "order": 2, "type": "chapter"},
                ]
            },
            "foreshadowings": {
                "foreshadowings": foreshadowings_result
                if isinstance(foreshadowings_result, list) and foreshadowings_result
                else [
                    {
                        "title": "root 来源",
                        "description": "谁授予的权限",
                        "type": "mystery",
                        "importance": 9,
                    }
                ]
            },
            "styleAnchor": {"content": style_anchor or "雨打铁皮棚。屏幕亮了。"},
        },
    }
    # normalize chapter items for finalize
    chs_f = finalize_body["results"]["chapters"]["chapters"]
    norm_chs = []
    for i, c in enumerate(chs_f[:5] if isinstance(chs_f, list) else []):
        if not isinstance(c, dict):
            continue
        norm_chs.append(
            {
                "chapterNumber": c.get("chapterNumber") or c.get("order") or (i + 1),
                "title": c.get("title") or f"第{i+1}章",
                "summary": c.get("summary") or c.get("description") or "摘要",
                "description": c.get("description") or c.get("summary") or "",
                "order": c.get("order") or c.get("chapterNumber") or (i + 1),
                "type": c.get("type") or "chapter",
                "plotFunction": c.get("plotFunction") or "setup",
                "tensionLevel": c.get("tensionLevel") or 5,
            }
        )
    finalize_body["results"]["chapters"]["chapters"] = norm_chs

    st, p, raw = req("POST", "/api/onboarding/finalize", finalize_body, timeout=120)
    fin_pid = dig(p, "data", "project", "id") or dig(p, "data", "id")
    if fin_pid:
        cleanup_ids["projects"].append(fin_pid)
    fin_ok = st in (200, 201) and bool(fin_pid)
    counts_fin = count_entities(fin_pid) if fin_pid else {}
    record(
        "U-01a",
        "onboarding",
        "finalize synthetic results -> project",
        st,
        p,
        raw,
        ok=fin_ok and counts_fin.get("characters", 0) > 0,
        detail=f"pid={fin_pid} counts={counts_fin} err={json.dumps(p.get('error'),ensure_ascii=False)[:120] if isinstance(p,dict) else ''}",
        t0=t0,
    )

    # ========== U-02 idea -> convert -> finalize ==========
    t0 = time.time()
    st, p, raw = req(
        "POST",
        "/api/ideas",
        {
            "title": f"{STAMP}-开书创意",
            "genre": "科幻",
            "worldBuilding": idea_body["worldBuilding"],
            "protagonist": idea_body["protagonist"],
            "coreConflict": idea_body["coreConflict"],
            "mainGoal": idea_body["mainGoal"],
            "highConcept": idea_body["highConcept"],
            "sublimation": idea_body["sublimation"],
            "openingHook": idea_body["openingHook"],
            "status": "draft",
        },
    )
    iid = dig(p, "data", "idea", "id")
    if iid:
        cleanup_ids["ideas"].append(iid)
    record("U-02a", "onboarding", "create idea for open-book", st, p, raw, t0=t0)

    t0 = time.time()
    st, p, raw = req("POST", f"/api/ideas/{iid}/convert", {})
    card = dig(p, "data", "idea")
    record("U-02b", "onboarding", "convert idea", st, p, raw, ok=st == 200 and bool(card), t0=t0)

    t0 = time.time()
    if card:
        fb2 = {
            "projectTitle": f"{STAMP}-从创意开书",
            "idea": card,
            "ideaId": iid,
            "pov": "third_person",
            "results": finalize_body["results"],
        }
        st, p, raw = req("POST", "/api/onboarding/finalize", fb2, timeout=120)
        fin2 = dig(p, "data", "project", "id") or dig(p, "data", "id")
        if fin2:
            cleanup_ids["projects"].append(fin2)
        # check idea linked?
        st_i, p_i, _ = req("GET", f"/api/ideas/{iid}")
        idea_after = dig(p_i, "data", "idea") or dig(p_i, "data") or {}
        linked = idea_after.get("convertedToProjectId")
        record(
            "U-02c",
            "onboarding",
            "finalize from idea + link",
            st,
            p,
            raw,
            ok=st in (200, 201) and bool(fin2),
            detail=f"project={fin2} idea.convertedToProjectId={linked}",
            t0=t0,
        )
    else:
        record("U-02c", "onboarding", "finalize from idea + link", 0, None, "no card", ok=False)

    # ========== U-01b idea-extract (AI) ==========
    t0 = time.time()
    conv = (
        "我想写一本近未来科幻。主角是修手机的底层青年林深，某天废旧手机亮起授予他 root 权限。"
        "世界被天网系统控制，贫民和云端阶层对立。他要查出谁给的权限，并决定是否推翻系统。"
        "开篇就是雨夜摊位，通缉令出现。主题是谁有权定义规则。类型偏冷硬科幻。"
    )
    st, p, raw = req(
        "POST",
        "/api/onboarding/idea-extract",
        {"conversationText": conv, "initialPrompt": "root 权限科幻"},
        timeout=180,
    )
    extracted = dig(p, "data", "idea")
    record(
        "U-01b",
        "onboarding",
        "idea-extract from conversation",
        st,
        p,
        raw,
        ok=st == 200 and bool(extracted and extracted.get("title")),
        detail=f"title={(extracted or {}).get('title')} genre={(extracted or {}).get('genre')}",
        t0=t0,
    )

    # ========== U-01c bootstrap FULL AI (expensive) — optional short via min words ==========
    # bootstrap requires min 200000 words; this will take long. Run with timeout and stream partial.
    t0 = time.time()
    boot_idea = extracted if extracted and extracted.get("title") else idea_body
    if not boot_idea.get("id"):
        boot_idea = {**idea_body, **{k: boot_idea.get(k, idea_body.get(k)) for k in idea_body}}
    # ensure all required fields
    for k, v in idea_body.items():
        boot_idea.setdefault(k, v)
    st, p, raw = req(
        "POST",
        "/api/onboarding/bootstrap",
        {
            "projectTitle": f"{STAMP}-bootstrap全量",
            "idea": boot_idea,
            "targetWords": 200000,
            "pace": "fast",
            "audience": "男频",
            "tone": "冷硬",
            "pov": "third_person",
        },
        timeout=600,
        stream=True,
        read_all_stream=True,
        stream_limit=800_000,
    )
    stream_text = (p or {}).get("full") or (p or {}).get("preview") or raw or ""
    events = parse_sse_events(stream_text)
    etypes = [e.get("type") or e.get("step") for e in events if isinstance(e, dict)]
    done = any(isinstance(e, dict) and e.get("type") in ("done", "complete", "error") for e in events)
    err_ev = next((e for e in events if isinstance(e, dict) and e.get("type") == "error"), None)
    # find created project by title
    st_p, p_p, _ = req("GET", "/api/projects")
    allp = dig(p_p, "data", "projects") or dig(p_p, "data") or []
    boot_proj = next((x for x in allp if isinstance(x, dict) and x.get("title") == f"{STAMP}-bootstrap全量"), None)
    if boot_proj:
        cleanup_ids["projects"].append(boot_proj["id"])
        bcounts = count_entities(boot_proj["id"])
    else:
        bcounts = {}
    boot_ok = st == 200 and boot_proj is not None and bcounts.get("characters", 0) > 0
    record(
        "U-01c",
        "onboarding",
        "bootstrap full AI pipeline SSE",
        st,
        p if isinstance(p, dict) else None,
        raw,
        ok=boot_ok,
        detail=f"events={etypes[:20]} done={done} err={err_ev} project={bool(boot_proj)} counts={bcounts} bytes={(p or {}).get('bytes') if isinstance(p, dict) else 0}",
        t0=t0,
    )

    # ========== U-27 agent-conversations ==========
    t0 = time.time()
    # try GET list endpoints
    for path in [
        "/api/agent-conversations",
        f"/api/agent-conversations?projectId={pid}",
        f"/api/projects/{pid}/agent-conversations",
    ]:
        st, p, raw = req("GET", path)
        if st != 404:
            record("U-27a", "agent-conv", f"GET {path}", st, p, raw, ok=st < 500, detail=raw[:120], t0=t0)
            break
    else:
        record("U-27a", "agent-conv", "list endpoint", 404, None, "no list route", ok=False, detail="only [id] dir exists; no collection route")

    # create via handoff then GET by id
    t0 = time.time()
    st, p, raw = req(
        "POST",
        f"/api/projects/{pid}/change-sets/analyze",
        {
            "sourceAgentId": "character",
            "requestSummary": "全量测试 handoff 会话",
            "characterId": char_id,
            "confirmedFacts": ["林深有 root"],
        },
    )
    cs = dig(p, "data", "changeSet")
    cs_id = (cs or {}).get("id") if isinstance(cs, dict) else None
    conv_id = None
    if cs_id:
        st, p, raw = req("POST", f"/api/change-sets/{cs_id}/handoffs", {"toAgentId": "chapter"})
        handoff = dig(p, "data", "handoff") or dig(p, "data")
        conv_id = None
        if isinstance(handoff, dict):
            conv_id = handoff.get("conversationId") or handoff.get("agentConversationId") or dig(handoff, "conversation", "id")
        record("U-27b", "agent-conv", "handoff creates conversation", st, p, raw, ok=st == 200, detail=f"conv_id={conv_id} keys={list(handoff.keys()) if isinstance(handoff,dict) else None}", t0=t0)
        if conv_id:
            st, p, raw = req("GET", f"/api/agent-conversations/{conv_id}")
            record("U-27c", "agent-conv", "GET conversation by id", st, p, raw, ok=st == 200, t0=time.time())
            st, p, raw = req("PATCH", f"/api/agent-conversations/{conv_id}", {"title": "测试更新会话"})
            record("U-27d", "agent-conv", "PATCH conversation", st, p, raw, ok=st in (200, 404, 405) and st != 500, detail=raw[:120], t0=time.time())
    else:
        record("U-27b", "agent-conv", "handoff creates conversation", 0, None, "no cs", ok=False)

    # ========== SETTINGS deep write U-22 ==========
    t0 = time.time()
    st, p, raw = req("GET", "/api/settings")
    settings = dig(p, "data", "settings") or {}
    record("U-22a", "settings", "GET settings", st, p, raw, ok=st == 200 and bool(settings), detail=f"keys={list(settings.keys())[:20]}", t0=t0)

    orig_font = settings.get("editor.fontSize")
    orig_theme = settings.get("editor.theme")
    orig_auto = settings.get("editor.autoSave")
    orig_interval = settings.get("editor.autoSaveInterval")
    orig_ctx = settings.get("ai.contextMaxTokens")

    t0 = time.time()
    st, p, raw = req(
        "PUT",
        "/api/settings",
        {
            "settings": {
                "editor.fontSize": "18",
                "editor.theme": "dark",
                "editor.autoSave": "true",
                "editor.autoSaveInterval": "60",
            }
        },
    )
    record("U-22b", "settings", "PUT editor settings", st, p, raw, t0=t0)
    st, p, raw = req("GET", "/api/settings")
    s2 = dig(p, "data", "settings") or {}
    ok_persist = s2.get("editor.fontSize") == "18" and s2.get("editor.theme") == "dark"
    record("U-22c", "settings", "verify editor settings persisted", 200, {"success": ok_persist}, "", ok=ok_persist, detail=f"font={s2.get('editor.fontSize')} theme={s2.get('editor.theme')}")

    # U-50: absurd contextMaxTokens accepted?
    t0 = time.time()
    st, p, raw = req("PUT", "/api/settings", {"settings": {"ai.contextMaxTokens": "999999999"}})
    st2, p2, _ = req("GET", "/api/settings")
    s3 = dig(p2, "data", "settings") or {}
    accepted_huge = s3.get("ai.contextMaxTokens") == "999999999"
    # This is a product bug if accepted — record as FAIL for validation missing
    record(
        "U-50",
        "settings",
        "reject absurd contextMaxTokens",
        st,
        p,
        raw,
        ok=not accepted_huge,  # pass only if rejected
        detail=f"accepted={accepted_huge} value={s3.get('ai.contextMaxTokens')}",
        t0=t0,
    )

    # restore settings
    restore = {}
    if orig_font is not None:
        restore["editor.fontSize"] = orig_font
    if orig_theme is not None:
        restore["editor.theme"] = orig_theme
    if orig_auto is not None:
        restore["editor.autoSave"] = orig_auto
    if orig_interval is not None:
        restore["editor.autoSaveInterval"] = orig_interval
    if orig_ctx is not None:
        restore["ai.contextMaxTokens"] = orig_ctx
    if restore:
        req("PUT", "/api/settings", {"settings": restore})

    # ========== U-24 context preview ==========
    t0 = time.time()
    st, p, raw = req("POST", "/api/ai/context", {"projectId": pid, "chapterId": cid})
    # try GET too
    if st >= 400:
        st, p, raw = req("GET", f"/api/ai/context?projectId={pid}&chapterId={cid}")
    ctx_ok = st == 200 and (ok_json(p) or dig(p, "data"))
    detail = ""
    if isinstance(p, dict):
        data = dig(p, "data") or p
        if isinstance(data, dict):
            detail = f"keys={list(data.keys())[:15]} tokens={data.get('totalTokens') or data.get('tokenCount')}"
    record("U-24", "context", "context package for chapter", st, p, raw, ok=ctx_ok, detail=detail, t0=t0)

    # ========== U-25 consistency check ==========
    t0 = time.time()
    st, p, raw = req("POST", "/api/ai/consistency-check", {"projectId": pid, "chapterId": cid}, timeout=180)
    if st >= 400:
        st, p, raw = req("POST", "/api/ai/consistency-check", {"projectId": pid}, timeout=180)
    record("U-25", "ai", "consistency-check API", st, p, raw, ok=st == 200, detail=raw[:160], t0=t0)

    # ========== U-26 stats ==========
    t0 = time.time()
    st, p, raw = req("GET", f"/api/projects/{pid}/stats")
    record("U-26", "stats", "project stats", st, p, raw, ok=st == 200, detail=json.dumps(dig(p, "data") or p, ensure_ascii=False)[:200] if isinstance(p, dict) else raw[:100], t0=t0)

    # ========== continue with abort-ish short read (U-43 partial) ==========
    t0 = time.time()
    st, p, raw = req(
        "POST",
        "/api/ai/continue",
        {
            "projectId": pid,
            "chapterId": cid,
            "currentContent": "林深站在雨里。",
            "targetWords": 80,
        },
        timeout=180,
        stream=True,
        max_read=1500,  # partial read then close — simulates client cancel mid-stream
    )
    record(
        "U-43a",
        "stream",
        "continue SSE partial read (cancel-ish)",
        st,
        p,
        raw,
        ok=st == 200 and isinstance(p, dict) and (p.get("bytes") or 0) > 0,
        detail=f"bytes={(p or {}).get('bytes') if isinstance(p,dict) else 0}",
        t0=t0,
    )

    # ========== rewrite again for U-14 data path ==========
    t0 = time.time()
    st, p, raw = req(
        "POST",
        "/api/ai/rewrite",
        {
            "projectId": pid,
            "chapterId": cid,
            "selectedText": "雨丝打在铁皮棚上。",
            "style": "更简练",
            "fullChapterContent": "林深蹲在修手机的摊位后，雨丝打在铁皮棚上。废旧屏幕突然亮起。",
        },
        timeout=120,
        stream=True,
        read_all_stream=True,
        stream_limit=50_000,
    )
    rt = (p or {}).get("full") or (p or {}).get("preview") or ""
    record("U-14a", "ai", "rewrite SSE full", st, p, raw, ok=st == 200 and len(rt) > 10, detail=f"bytes={(p or {}).get('bytes') if isinstance(p,dict) else 0} preview={rt[:80]!r}", t0=t0)

    # ========== agents multi-slot (U-21) ==========
    t0 = time.time()
    st, p, raw = req("GET", "/api/ai/agents")
    agents = dig(p, "data", "agents") or []
    # pick agent with multiple slots
    multi = None
    for a in agents:
        slots = a.get("promptSlots") or []
        if len(slots) >= 2:
            multi = a
            break
    if multi:
        slots = multi["promptSlots"]
        a_id = multi["id"]
        ok_all = True
        details = []
        for slot in slots[:3]:
            key = slot.get("key")
            orig = slot.get("content") or slot.get("defaultContent") or "x"
            marker = f"\n<!--full-{STAMP}-{key}-->"
            st1, p1, r1 = req("PUT", f"/api/ai/agents/{a_id}/prompts", {"slotKey": key, "content": orig + marker})
            saved = dig(p1, "data", "slot", "content") or ""
            has = marker in saved
            # immediate re-read catalog
            st2, p2, _ = req("GET", "/api/ai/agents")
            again = next((x for x in (dig(p2, "data", "agents") or []) if x.get("id") == a_id), None)
            s_again = next((s for s in ((again or {}).get("promptSlots") or []) if s.get("key") == key), None)
            in_catalog = s_again and marker in (s_again.get("content") or "")
            details.append(f"{key}:save={has},catalog={bool(in_catalog)}")
            if not has:
                ok_all = False
            # reset
            req("DELETE", f"/api/ai/agents/{a_id}/prompts?slot={key}")
            if not in_catalog:
                ok_all = False  # known cache bug
        record("U-21", "agents", f"multi-slot save on {a_id}", 200, {"success": ok_all}, "", ok=ok_all, detail="; ".join(details), t0=t0)
    else:
        record("U-21", "agents", "multi-slot save", 0, None, "no multi-slot agent", ok=False)

    # ========== U-20 agent model test if endpoint exists ==========
    t0 = time.time()
    st, p, raw = req("POST", "/api/ai/models/test", {"model": None}, timeout=90)
    # try with agent runtime model
    if st >= 400:
        st, p, raw = req("POST", "/api/ai/models", {"action": "test"}, timeout=90)
    record("U-20a", "models", "model test endpoint", st, p, raw, ok=st == 200 or (isinstance(p, dict) and p.get("success")), detail=raw[:140], t0=t0)

    # ========== random idea U-15 related ==========
    t0 = time.time()
    st, p, raw = req("POST", "/api/ai/random-story-idea", {"genre": "玄幻"}, timeout=120)
    if st >= 400:
        st, p, raw = req("GET", "/api/ai/random-story-idea", timeout=120)
    record("U-15a", "idea", "random-story-idea", st, p, raw, ok=st == 200, detail=raw[:120], t0=t0)

    # ========== extract step (U-01 related) ==========
    if arch:
        t0 = time.time()
        st, p, raw = req(
            "POST",
            "/api/onboarding/extract",
            {
                "stepKey": "architecture",
                "conversationText": "我们确定故事是冷硬科幻，林深获得 root，对抗天网。三幕：觉醒、逃亡、夺权。主题是规则的定义权。" * 3,
                "idea": idea_body,
                "projectTitle": f"{STAMP}-extract",
                "targetWords": 200000,
                "pace": "fast",
            },
            timeout=180,
        )
        record("U-01d", "onboarding", "extract architecture from conversation", st, p, raw, ok=st == 200, detail=raw[:160], t0=t0)

    # ========== SORTBY updatedAt regression ==========
    t0 = time.time()
    st, p, raw = req("GET", "/api/ideas?sortBy=updatedAt")
    record(
        "P1-sort",
        "ideas",
        "sortBy=updatedAt",
        st,
        p,
        raw,
        ok=st == 200,
        detail=raw[:120],
        t0=t0,
    )

    # ========== XSS / extreme input U-49 ==========
    t0 = time.time()
    xss = "<script>alert(1)</script>"
    st, p, raw = req(
        "POST",
        f"/api/projects/{pid}/chapters",
        {"chapterNumber": 99, "title": xss, "content": f"<p>{xss}</p>"},
    )
    xss_cid = dig(p, "data", "chapter", "id")
    st2, p2, _ = req("GET", f"/api/projects/{pid}/chapters/{xss_cid}") if xss_cid else (0, None, "")
    stored = dig(p2, "data", "chapter", "title") if isinstance(p2, dict) else None
    # We don't expect server-side sanitize necessarily; record behavior
    record(
        "U-49",
        "security",
        "store script tag in chapter title (behavior)",
        st,
        p,
        raw,
        ok=st in (200, 201),  # connectivity
        detail=f"stored_title={stored!r} (note: client must escape)",
        t0=t0,
    )
    if xss_cid:
        req("DELETE", f"/api/projects/{pid}/chapters/{xss_cid}")

    # ========== chat draft tools path ==========
    t0 = time.time()
    st, p, raw = req(
        "POST",
        "/api/ai/chat",
        {
            "messages": [
                {
                    "id": "m1",
                    "role": "user",
                    "parts": [{"type": "text", "text": "用一句话概括本项目的核心冲突，不要超过40字。"}],
                }
            ],
            "projectId": pid,
            "chapterId": cid,
        },
        timeout=120,
        stream=True,
        read_all_stream=True,
        stream_limit=80_000,
    )
    record(
        "U-chat",
        "ai",
        "studio chat UIMessage stream",
        st,
        p,
        raw,
        ok=st == 200 and isinstance(p, dict) and (p.get("bytes") or 0) > 20,
        detail=f"bytes={(p or {}).get('bytes') if isinstance(p,dict) else 0} preview={str((p or {}).get('preview'))[:100]!r}",
        t0=t0,
    )

    # ========== summarize ==========
    t0 = time.time()
    st, p, raw = req("POST", "/api/ai/summarize", {"projectId": pid}, timeout=180)
    record("U-sum", "ai", "summarize chapters", st, p, raw, ok=st == 200, detail=raw[:140], t0=t0)

    dump()
    cleanup()
    print(f"total wall time: {int(time.time()-t_all)}s")
    failed = sum(1 for r in results if not r.ok)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
