"""Skill training maths and skill plans, shared by the skills page and plugins (skill plans, doctrines, mentors).

A *plan* is an ordered list of steps ``(skill_id, level)``, one per level, like the in-game skill queue and skill
plans: prerequisites come before the skills that need them, and level 3 comes after level 2.
"""

from __future__ import annotations

import math
import re
from collections.abc import Iterable

from conduit.sde.models import ItemType, SkillInfo

SKILL_CATEGORY = 16
ROMAN = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V"}
FROM_ROMAN = {v: k for k, v in ROMAN.items()}
#: Attributes of a character we know nothing about (a fresh character without implants or remap).
DEFAULT_ATTRIBUTES = {"charisma": 20, "intelligence": 20, "memory": 20, "perception": 20, "willpower": 20}

Step = tuple[int, int]


def sp_for_level(rank: float, level: int) -> int:
    """Skill points a skill of ``rank`` has at ``level`` (0-5)."""
    if level <= 0:
        return 0
    return math.ceil(250 * rank * 2 ** (2.5 * (level - 1)))


def sp_per_minute(attributes: dict, primary: str, secondary: str) -> float:
    return (attributes.get(primary) or 20) + (attributes.get(secondary) or 20) / 2


def skill_info(skill_ids: Iterable[int]) -> dict[int, SkillInfo]:
    """Training data of these skills and, recursively, of every skill they need."""
    found: dict[int, SkillInfo] = {}
    todo = {int(s) for s in skill_ids}
    while todo:
        rows = list(SkillInfo.objects.filter(type_id__in=todo - found.keys()))
        found.update({r.type_id: r for r in rows})
        todo = {sid for r in rows for sid, _ in r.required_skills} - found.keys()
    return found


def requirements_of_types(type_ids: Iterable[int]) -> dict[int, int]:
    """Skills (and levels) needed to use these items: the highest level any of them asks for. Direct only."""
    need: dict[int, int] = {}
    for reqs in ItemType.objects.filter(pk__in={int(t) for t in type_ids}).values_list("required_skills", flat=True):
        for sid, level in reqs or ():
            need[sid] = max(need.get(sid, 0), level)
    return need


def plan(targets: Iterable[Step], info: dict[int, SkillInfo] | None = None) -> list[Step]:
    """Turn wanted skill levels into ordered steps: every level of every skill, prerequisites first.

    The order of ``targets`` is kept as far as prerequisites allow; duplicates and lower levels of a skill already
    planned are dropped.
    """
    targets = [(int(s), max(1, min(5, int(lvl)))) for s, lvl in targets]
    info = info if info is not None else skill_info(s for s, _ in targets)
    steps: list[Step] = []
    planned: dict[int, int] = {}
    visiting: set[int] = set()

    def add(sid: int, level: int):
        if planned.get(sid, 0) >= level or sid in visiting:
            return
        visiting.add(sid)
        for req, req_level in getattr(info.get(sid), "required_skills", ()) or ():
            add(req, req_level)
        visiting.discard(sid)
        for lvl in range(planned.get(sid, 0) + 1, level + 1):
            steps.append((sid, lvl))
        planned[sid] = level

    for sid, level in targets:
        add(sid, level)
    return steps


def highest(steps: Iterable[Step]) -> dict[int, int]:
    """The level each skill reaches by the end of the plan."""
    out: dict[int, int] = {}
    for sid, level in steps:
        out[sid] = max(out.get(sid, 0), level)
    return out


def character_state(character_ids: Iterable[int], skill_ids: Iterable[int] | None = None) -> dict[int, dict]:
    """``{character_id: {"levels": {skill: level}, "sp": {skill: sp}, "attributes": {...}, "queue": {skill: level}}}``.

    ``skill_ids`` loads only those skills (e.g. a plan's), which is much lighter for many characters.
    """
    from django.utils import timezone

    from .models import CharacterSkill, SkillQueueItem, SkillSummary

    ids = {int(c) for c in character_ids}
    skills = CharacterSkill.objects.filter(character_id__in=ids)
    queued = SkillQueueItem.objects.filter(character_id__in=ids)
    if skill_ids is not None:
        wanted = {int(s) for s in skill_ids}
        skills, queued = skills.filter(skill_id__in=wanted), queued.filter(skill_id__in=wanted)
    out = {cid: {"levels": {}, "sp": {}, "attributes": dict(DEFAULT_ATTRIBUTES), "queue": {}, "synced": False} for cid in ids}
    for row in skills.values_list("character_id", "skill_id", "active_level", "skillpoints"):
        cid, sid, level, sp = row
        out[cid]["levels"][sid] = level
        out[cid]["sp"][sid] = sp
    for s in SkillSummary.objects.filter(character_id__in=ids):
        out[s.character_id]["synced"] = True
        out[s.character_id]["attributes"] = {a: getattr(s, a) or 20 for a in DEFAULT_ATTRIBUTES}
    now = timezone.now()
    for q in queued.values("character_id", "skill_id", "finished_level", "finish_date"):
        if q["finish_date"] is None or q["finish_date"] > now:
            queue = out[q["character_id"]]["queue"]
            queue[q["skill_id"]] = max(queue.get(q["skill_id"], 0), q["finished_level"])
    return out


def progress(steps: list[Step], state: dict, info: dict[int, SkillInfo]) -> dict:
    """How far a character (``character_state`` entry) is through a plan, and how long the rest takes to train.

    Each step is ``done``, ``queued`` (in the skill queue) or ``missing``. Times use the character's current
    attributes (with implants), counting skill points already in a partly trained level.
    """
    levels, sps, attrs, queue = state["levels"], state["sp"], state["attributes"], state["queue"]
    out_steps, total_sp, done_sp, missing_seconds, queued_seconds = [], 0, 0, 0.0, 0.0
    for sid, level in steps:
        si = info.get(sid)
        rank = si.rank if si else 1
        start, end = sp_for_level(rank, level - 1), sp_for_level(rank, level)
        have = levels.get(sid, 0)
        need = end - start
        total_sp += need
        if have >= level:
            status, remaining = "done", 0
        else:
            # Skill points already in the skill count toward the next level only.
            partial = max(0, min(sps.get(sid, 0), end) - start) if have == level - 1 else 0
            remaining = need - partial
            status = "queued" if queue.get(sid, 0) >= level else "missing"
        done_sp += need - remaining
        seconds = remaining / sp_per_minute(attrs, si.primary_attribute, si.secondary_attribute) * 60 if si and remaining else 0
        if status == "missing":
            missing_seconds += seconds
        elif status == "queued":
            queued_seconds += seconds
        out_steps.append({"skill_id": sid, "level": level, "status": status, "sp": remaining, "seconds": round(seconds)})
    done = sum(1 for s in out_steps if s["status"] == "done")
    return {
        "steps": out_steps,
        "done": done,
        "total": len(out_steps),
        "complete": done == len(out_steps),
        "percent": round(done_sp / total_sp * 100, 1) if total_sp else 100.0,
        "sp_left": total_sp - done_sp,
        "seconds_left": round(missing_seconds + queued_seconds),
        "seconds_missing": round(missing_seconds),
    }


def meets(levels: dict[int, int], need: dict[int, int]) -> bool:
    return all(levels.get(sid, 0) >= lvl for sid, lvl in need.items())


# --- text in and out (the in-game skill plan / skill queue clipboard format) --------------------------------------

_NUMBERED = re.compile(r"^\d+[.)]\s+")
LEVELS = {"1": 1, "2": 2, "3": 3, "4": 4, "5": 5, **FROM_ROMAN}
#: No skill name is near this long; longer lines aren't skills (and are skipped without any work).
MAX_LINE = 150


def _read_line(line: str) -> tuple[str, int] | None:
    """``("Gunnery", 4)`` from ``Gunnery 4``, ``Gunnery IV``, ``Gunnery: level 4``, ``Gunnery L4`` or ``3. Gunnery 4``.

    Split on whitespace rather than matched with one regular expression: pasted text comes from members, and a
    backtracking pattern can be made to take minutes on one long line.
    """
    if len(line) > MAX_LINE:
        return None
    words = _NUMBERED.sub("", line, count=1).replace(":", " ").split()
    if len(words) < 2:
        return None
    level = words[-1].upper()
    if level not in LEVELS and level.startswith("L") and level[1:] in LEVELS:
        level = level[1:]
    if level not in LEVELS:
        return None
    name = words[:-1]
    if len(name) > 1 and name[-1].lower() == "level":
        name = name[:-1]
    return " ".join(name), LEVELS[level]


def skills_by_name(names: Iterable[str]) -> dict[str, int]:
    """Lower-cased skill name to its type id."""
    lowered = {n.strip().lower() for n in names}
    out = {}
    for tid, name in ItemType.objects.filter(group__category_id=SKILL_CATEGORY).values_list("id", "name"):
        if name.lower() in lowered:
            out[name.lower()] = tid
    return out


def parse_text(text: str) -> tuple[list[Step], list[str]]:
    """Read a skill list pasted from the game (``Gunnery 4``, ``Gunnery IV``, one per line).

    Returns the steps in the order given and the lines that couldn't be read.
    """
    parsed, problems = [], []
    for raw in (text or "").splitlines():
        line = raw.strip()
        if not line or line.startswith(("#", "//")):
            continue
        read = _read_line(line)
        if read is None:
            problems.append(line[:MAX_LINE])
            continue
        parsed.append((*read, line))
    names = skills_by_name(n for n, _, _ in parsed)
    steps = []
    for name, level, line in parsed:
        sid = names.get(name.lower())
        if sid is None:
            problems.append(line)
        else:
            steps.append((sid, level))
    return steps, problems


def format_text(steps: Iterable[Step], names: dict[int, str] | None = None) -> str:
    """One ``Skill Name level`` line per step, which the game's skill plan and skill queue import read."""
    steps = list(steps)
    if names is None:
        names = dict(ItemType.objects.filter(pk__in={s for s, _ in steps}).values_list("id", "name"))
    return "\n".join(f"{names.get(sid, sid)} {level}" for sid, level in steps)
