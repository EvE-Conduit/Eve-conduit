"""Global search: corporation structures the user may see."""

from evecsm.search.registry import register

from .access import can_view_section


@register("corp_structures", order=50)
def structures(request, q, limit):
    from evecsm.sde.models import SolarSystem

    from .access import has_any_corp_permission
    from .models import Structure

    user = request.user
    if not has_any_corp_permission(user):
        return None
    rows = [s for s in Structure.objects.filter(name__icontains=q).select_related("corporation")[: limit * 4]
            if can_view_section(user, s.corporation, "structures")][:limit]
    systems = dict(SolarSystem.objects.filter(pk__in={s.system_id for s in rows}).values_list("pk", "name"))
    return {
        "key": "corp_structures",
        "label": "Structures",
        "hits": [
            {
                "id": f"structure:{s.structure_id}",
                "title": s.name or f"Structure {s.structure_id}",
                "subtitle": f"{s.corporation.name} · {systems.get(s.system_id, '')} · {s.state.replace('_', ' ')}",
                "icon": "building",
                "url": f"/corporations/{s.corporation_id}?tab=structures",
            }
            for s in rows
        ],
    }
