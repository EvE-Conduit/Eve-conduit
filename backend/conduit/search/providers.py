"""What core search finds: characters, members, groups, corporations, alliances, items and systems."""

from django.contrib.auth.models import Group
from django.db.models import Case, IntegerField, Q, Value, When

from conduit.eve.models import EveAlliance, EveCorporation, alliance_logo_url, corporation_logo_url, portrait_url

from .registry import register


def ranked(qs, field: str, q: str):
    """Exact match first, then prefix, then anywhere."""
    return qs.annotate(
        _rank=Case(
            When(**{f"{field}__iexact": q}, then=Value(0)),
            When(**{f"{field}__istartswith": q}, then=Value(1)),
            default=Value(2),
            output_field=IntegerField(),
        )
    ).order_by("_rank", field)


def _viewable_characters(user):
    from conduit.accounts.models import Character

    qs = Character.objects.select_related("corporation", "user")
    if user.has_perm("sheet.view_all_characters"):
        return qs
    rule = Q(user=user)
    main = user.main_character
    if main is not None:
        if user.has_perm("sheet.view_alliance_characters") and main.alliance_id:
            rule |= Q(alliance_id=main.alliance_id)
        if user.has_perm("sheet.view_corporation_characters") and main.corporation_id:
            rule |= Q(corporation_id=main.corporation_id)
    return qs.filter(rule)


@register("characters", order=10)
def characters(request, q, limit):
    user = request.user
    rows = ranked(_viewable_characters(user).filter(name__icontains=q), "name", q)[:limit]
    return {
        "key": "characters",
        "label": "Characters",
        "hits": [
            {
                "id": f"character:{c.pk}",
                "title": c.name,
                "subtitle": " · ".join(
                    x for x in [c.corporation.name if c.corporation else "", "yours" if c.user_id == user.pk else c.user.display_name] if x
                ),
                "image": portrait_url(c.pk, 64),
                "url": f"/characters/{c.pk}",
            }
            for c in rows
        ],
    }


@register("members", order=20)
def members(request, q, limit):
    from conduit.accounts.models import User

    if not request.user.has_perm("site.view_members"):
        return None
    rows = ranked(
        User.objects.filter(characters__name__icontains=q).exclude(pk=request.user.pk).distinct().select_related("main_character", "state"),
        "main_character__name",
        q,
    )[:limit]
    return {
        "key": "members",
        "label": "Members",
        "hits": [
            {
                "id": f"user:{u.pk}",
                "title": u.display_name,
                "subtitle": u.state.name if u.state else "No state",
                "image": portrait_url(u.main_character_id, 64) if u.main_character_id else None,
                "icon": None if u.main_character_id else "user",
                "url": f"/admin/members?q={u.display_name}",
            }
            for u in rows
        ],
    }


@register("groups", order=30)
def groups(request, q, limit):
    user = request.user
    qs = Group.objects.filter(name__icontains=q)
    if not user.has_perm("site.manage_access"):
        qs = qs.filter(Q(user=user) | Q(profile__hidden=False)).distinct()
    return {
        "key": "groups",
        "label": "Groups",
        "hits": [
            {"id": f"group:{g.pk}", "title": g.name, "subtitle": "Group", "icon": "users", "url": "/groups"}
            for g in ranked(qs, "name", q)[:limit]
        ],
    }


@register("entities", order=40)
def entities(request, q, limit):
    corp_q = Q(name__icontains=q) | Q(ticker__iexact=q)
    corps = ranked(EveCorporation.objects.filter(corp_q).select_related("alliance"), "name", q)[:limit]
    alliances = ranked(EveAlliance.objects.filter(corp_q), "name", q)[:limit]
    return [
        {
            "key": "corporations",
            "label": "Corporations",
            "hits": [
                {
                    "id": f"corporation:{c.pk}",
                    "title": f"{c.name} [{c.ticker}]" if c.ticker else c.name,
                    "subtitle": c.alliance.name if c.alliance else "Corporation",
                    "image": corporation_logo_url(c.pk),
                    "url": corporation_url(request.user, c),
                }
                for c in corps
            ],
        },
        {
            "key": "alliances",
            "label": "Alliances",
            "hits": [
                {
                    "id": f"alliance:{a.pk}",
                    "title": f"{a.name} <{a.ticker}>" if a.ticker else a.name,
                    "subtitle": "Alliance",
                    "image": alliance_logo_url(a.pk),
                    "url": f"https://evewho.com/alliance/{a.pk}",
                }
                for a in alliances
            ],
        },
    ]


def corporation_url(user, corp) -> str:
    """The corporation sheet when the user may open it, otherwise EVE Who."""
    try:
        from conduit.corp.access import can_view_corporation
    except ImportError:
        return f"https://evewho.com/corporation/{corp.pk}"
    try:
        if can_view_corporation(user, corp.pk):
            return f"/corporations/{corp.pk}"
    except Exception:
        pass
    return f"https://evewho.com/corporation/{corp.pk}"


@register("universe", order=60)
def universe(request, q, limit):
    from conduit.sde.models import ItemType, SolarSystem, type_icon_url

    systems = ranked(SolarSystem.objects.filter(name__icontains=q).select_related("region"), "name", q)[:limit]
    types = ranked(ItemType.objects.filter(published=True, name__icontains=q).select_related("group"), "name", q)[:limit]
    return [
        {
            "key": "systems",
            "label": "Solar systems",
            "hits": [
                {
                    "id": f"system:{s.pk}",
                    "title": s.name,
                    "subtitle": f"{s.region.name} · {s.display_security:.1f}",
                    "icon": "orbit",
                    "url": f"https://evemaps.dotlan.net/system/{s.name.replace(' ', '_')}",
                }
                for s in systems
            ],
        },
        {
            "key": "types",
            "label": "Items",
            "hits": [
                {
                    "id": f"type:{t.pk}",
                    "title": t.name,
                    "subtitle": t.group.name,
                    "image": type_icon_url(t.pk, 64),
                    "url": f"https://everef.net/types/{t.pk}",
                }
                for t in types
            ],
        },
    ]
