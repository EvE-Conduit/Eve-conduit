from django.db import transaction

from evecsm.sheet.util import parse_dt

from .models import CharacterSkill, SkillQueueItem, SkillSummary


def sync(character, esi):
    cid = character.pk
    skills = esi.get(f"/characters/{cid}/skills", character=character).data
    attributes = esi.get(f"/characters/{cid}/attributes", character=character).data
    queue = (
        esi.get(f"/characters/{cid}/skillqueue", character=character).data
        if character.token.has_scopes("esi-skills.read_skillqueue.v1")
        else None
    )

    with transaction.atomic():
        SkillSummary.objects.update_or_create(
            character=character,
            defaults={
                "total_sp": skills.get("total_sp", 0),
                "unallocated_sp": skills.get("unallocated_sp") or 0,
                **{a: attributes.get(a) for a in ("charisma", "intelligence", "memory", "perception", "willpower")},
                "bonus_remaps": attributes.get("bonus_remaps"),
                "last_remap_date": parse_dt(attributes.get("last_remap_date")),
                "remap_available_date": parse_dt(attributes.get("accrued_remap_cooldown_date")),
            },
        )
        CharacterSkill.objects.filter(character=character).delete()
        CharacterSkill.objects.bulk_create(
            CharacterSkill(
                character=character,
                skill_id=s["skill_id"],
                active_level=s["active_skill_level"],
                trained_level=s["trained_skill_level"],
                skillpoints=s["skillpoints_in_skill"],
            )
            for s in skills.get("skills", [])
        )
        if queue is not None:
            SkillQueueItem.objects.filter(character=character).delete()
            SkillQueueItem.objects.bulk_create(
                SkillQueueItem(
                    character=character,
                    position=q["queue_position"],
                    skill_id=q["skill_id"],
                    finished_level=q["finished_level"],
                    start_date=parse_dt(q.get("start_date")),
                    finish_date=parse_dt(q.get("finish_date")),
                    training_start_sp=q.get("training_start_sp"),
                    level_start_sp=q.get("level_start_sp"),
                    level_end_sp=q.get("level_end_sp"),
                )
                for q in queue
            )
