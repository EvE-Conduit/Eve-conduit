from collections import defaultdict

from django.utils import timezone

from conduit.sde.models import SkillInfo
from conduit.sheet.api import me_router, my_characters, router, viewable_character
from conduit.sheet.util import types_by_id

from .models import CharacterSkill, SkillQueueItem, SkillSummary


def _iso(dt):
    return dt.isoformat() if dt else None


def _queue_out(items, types, now):
    out = []
    for q in items:
        progress = None
        if q.start_date and q.finish_date:
            total = (q.finish_date - q.start_date).total_seconds()
            progress = max(0.0, min(1.0, (now - q.start_date).total_seconds() / total)) if total > 0 else 1.0
        t = types.get(q.skill_id)
        out.append(
            {
                "position": q.position,
                "skill_id": q.skill_id,
                "name": t.name if t else f"Skill {q.skill_id}",
                "level": q.finished_level,
                "start_date": _iso(q.start_date),
                "finish_date": _iso(q.finish_date),
                "progress": progress,
                "level_start_sp": q.level_start_sp,
                "level_end_sp": q.level_end_sp,
            }
        )
    return out


@router.get("/{character_id}/skills")
def skills(request, character_id: int):
    character = viewable_character(request, character_id)
    summary = SkillSummary.objects.filter(character=character).first()
    rows = list(CharacterSkill.objects.filter(character=character))
    now = timezone.now()
    queue = [q for q in SkillQueueItem.objects.filter(character=character) if not q.finish_date or q.finish_date > now]
    types = types_by_id({r.skill_id for r in rows} | {q.skill_id for q in queue})
    ranks = dict(SkillInfo.objects.filter(type_id__in=types).values_list("type_id", "rank"))

    groups = defaultdict(list)
    for r in rows:
        t = types.get(r.skill_id)
        groups[t.group.name if t else "Unknown"].append(
            {
                "id": r.skill_id,
                "name": t.name if t else f"Skill {r.skill_id}",
                "level": r.active_level,
                "trained_level": r.trained_level,
                "skillpoints": r.skillpoints,
                "rank": ranks.get(r.skill_id, 1),
            }
        )
    levels = [0] * 6
    for r in rows:
        levels[r.active_level] += 1

    return {
        "synced": summary is not None,
        "total_sp": summary.total_sp if summary else 0,
        "unallocated_sp": summary.unallocated_sp if summary else 0,
        "attributes": {a: getattr(summary, a) for a in ("intelligence", "memory", "perception", "willpower", "charisma")} if summary else None,
        "bonus_remaps": summary.bonus_remaps if summary else None,
        "remap_available": _iso(summary.remap_available_date) if summary else None,
        "skill_count": len(rows),
        "levels": levels,
        "queue": _queue_out(queue, types, now),
        "queue_ends": _iso(max((q.finish_date for q in queue if q.finish_date), default=None)),
        "groups": [
            {"name": name, "skillpoints": sum(s["skillpoints"] for s in skills), "skills": sorted(skills, key=lambda s: s["name"])}
            for name, skills in sorted(groups.items())
        ],
        "updated_at": _iso(summary.updated_at) if summary else None,
    }


@me_router.get("/skillqueues")
def my_skill_queues(request):
    """What each of my characters is training right now (dashboard widget)."""
    now = timezone.now()
    chars = list(my_characters(request))
    summaries = {s.character_id: s for s in SkillSummary.objects.filter(character__in=chars)}
    queues = defaultdict(list)
    for q in SkillQueueItem.objects.filter(character__in=chars):
        if not q.finish_date or q.finish_date > now:
            queues[q.character_id].append(q)
    types = types_by_id({q.skill_id for qs in queues.values() for q in qs})
    out = []
    for c in chars:
        q = _queue_out(queues.get(c.pk, []), types, now)
        out.append(
            {
                "character": {"id": c.pk, "name": c.name, "portrait": c.portrait},
                "total_sp": summaries[c.pk].total_sp if c.pk in summaries else None,
                "training": q[0] if q and q[0]["start_date"] else None,
                "queue_length": len(q),
                "queue_ends": max((x["finish_date"] for x in q if x["finish_date"]), default=None),
                "synced": c.pk in summaries,
            }
        )
    return sorted(out, key=lambda x: (x["training"] is None, x["character"]["name"]))
