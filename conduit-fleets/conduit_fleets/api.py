"""Mounted at /api/p/fleets/. Only reachable while the plugin is enabled."""

import csv

from django.http import HttpResponse
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.accounts.models import Character
from conduit.audit.services import record
from conduit.permissions import require_perm

from . import services
from .models import Fat, Fleet, FleetType

router = Router(tags=["fleets"], auth=django_auth)


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except services.FleetError as exc:
        raise HttpError(exc.status, str(exc)) from None


def _fleet(pk: int) -> Fleet:
    fleet = Fleet.objects.select_related("fleet_type", "fc__main_character", "tracking_character").filter(pk=pk).first()
    if fleet is None:
        raise HttpError(404, "No such fleet")
    return fleet


def _editable(request, pk: int) -> Fleet:
    fleet = _fleet(pk)
    if not services.can_edit(request.user, fleet):
        raise HttpError(403, "Only the fleet's FC or a fleet manager can do that")
    return fleet


# --- everyone ------------------------------------------------------------------------------------------------------


@router.get("")
def overview(request, q: str = "", type: int | None = None):
    """Recent fleets (with whether I flew in each), my attendance, and what I may do."""
    return {
        "fleets": services.fleet_list(request.user, q.strip(), type),
        "me": services.my_attendance(request.user),
        "types": [services.type_out(t) for t in services.fleet_types()],
        "can_run": services.can_run(request.user),
        "can_manage": services.can_manage(request.user),
    }


@router.get("/me")
def me(request):
    return services.my_attendance(request.user)


@router.get("/{fleet_id}")
def detail(request, fleet_id: int):
    return services.fleet_detail(_fleet(fleet_id), request.user)


@router.get("/fat/{code}")
def link_info(request, code: str):
    """What the FAT link page shows: the fleet, whether it's open, and my characters."""
    fleet = _run(services.fleet_for_link, code)
    have = set(fleet.fats.values_list("character_id", flat=True))
    return {
        **services.fleet_brief(fleet),
        "notes": fleet.notes,
        "open": fleet.link_active,
        "characters": [{"id": c.pk, "name": c.name, "portrait": c.portrait, "registered": c.pk in have}
                       for c in Character.objects.filter(user=request.user)],
    }


class RegisterIn(Schema):
    characters: list[int]


@router.post("/fat/{code}")
def register(request, code: str, payload: RegisterIn):
    added = _run(services.register_by_link, request.user, code, payload.characters)
    return {"added": added}


# --- FCs -----------------------------------------------------------------------------------------------------------


class FleetIn(Schema):
    name: str
    fleet_type: int | None = None
    notes: str = ""
    #: Close the FAT link after this many minutes (none: it stays open until the fleet ends).
    link_minutes: int | None = None
    #: Start tracking the in-game fleet this character is boss of.
    track_character: int | None = None
    #: While tracking, add the FAT lines to the bottom of the in-game fleet's MOTD.
    motd: bool = True


@router.get("/fc/characters")
def my_fc_characters(request):
    if not services.can_run(request.user):
        raise HttpError(403, "You can't run fleets")
    return services.fc_characters(request.user)


@router.post("")
def create(request, payload: FleetIn):
    if not services.can_run(request.user):
        raise HttpError(403, "You can't run fleets")
    if payload.link_minutes is not None and not 1 <= payload.link_minutes <= 24 * 60:
        raise HttpError(400, "The FAT link can stay open for 1 minute to 24 hours")
    fleet = _run(services.create_fleet, request.user, name=payload.name, fleet_type_id=payload.fleet_type, notes=payload.notes,
                 link_minutes=payload.link_minutes)
    record("fleets.create", f"started the fleet \"{fleet.name}\"", request=request, target=fleet)
    out = services.fleet_detail(fleet, request.user)
    if payload.track_character:
        try:
            services.start_tracking(fleet, payload.track_character, request.user, payload.motd)
            out = services.fleet_detail(_fleet(fleet.pk), request.user)
        except services.FleetError as exc:
            out["warning"] = f"The fleet was created, but tracking didn't start: {exc}"
    return out


class EditIn(Schema):
    name: str
    fleet_type: int | None = None
    notes: str = ""


@router.put("/{fleet_id}")
def edit(request, fleet_id: int, payload: EditIn):
    fleet = _editable(request, fleet_id)
    name = payload.name.strip()[:120]
    if not name:
        raise HttpError(400, "Give the fleet a name")
    if payload.fleet_type and not FleetType.objects.filter(pk=payload.fleet_type).exists():
        raise HttpError(400, "No such fleet type")
    if fleet.ended_at and (payload.fleet_type or None) != fleet.fleet_type_id and not services.can_manage(request.user):
        # Group rules can count only some fleet types (e.g. CTAs): changing a finished fleet's type would change who
        # passes them, so that's for fleet managers.
        raise HttpError(403, "Only a fleet manager can change the type of a fleet that has ended")
    fleet.name, fleet.fleet_type_id, fleet.notes = name, payload.fleet_type or None, payload.notes.strip()[:4000]
    fleet.save(update_fields=["name", "fleet_type", "notes"])
    return services.fleet_detail(_fleet(fleet_id), request.user)


class TrackIn(Schema):
    character: int
    motd: bool = True


@router.post("/{fleet_id}/track")
def track(request, fleet_id: int, payload: TrackIn):
    fleet = _editable(request, fleet_id)
    _run(services.start_tracking, fleet, payload.character, request.user, payload.motd)
    return services.fleet_detail(_fleet(fleet_id), request.user)


class MotdIn(Schema):
    on: bool


@router.post("/{fleet_id}/motd")
def set_motd(request, fleet_id: int, payload: MotdIn):
    """Add the FAT lines to the in-game fleet's MOTD, or take them out."""
    services.set_motd(_editable(request, fleet_id), payload.on)
    return services.fleet_detail(_fleet(fleet_id), request.user)


@router.delete("/{fleet_id}/track")
def untrack(request, fleet_id: int):
    services.stop_tracking(_editable(request, fleet_id))
    return services.fleet_detail(_fleet(fleet_id), request.user)


@router.post("/{fleet_id}/refresh")
def refresh(request, fleet_id: int):
    """Read the in-game fleet now instead of waiting for the next minute."""
    fleet = _editable(request, fleet_id)
    added = services.poll(fleet)
    return {**services.fleet_detail(_fleet(fleet_id), request.user), "added": added}


class LinkIn(Schema):
    open: bool
    minutes: int | None = None


@router.post("/{fleet_id}/link")
def set_link(request, fleet_id: int, payload: LinkIn):
    from datetime import timedelta

    from django.utils import timezone

    fleet = _editable(request, fleet_id)
    if fleet.ended_at and payload.open:
        raise HttpError(400, "This fleet has ended")
    if payload.minutes is not None and not 1 <= payload.minutes <= 24 * 60:
        raise HttpError(400, "The FAT link can stay open for 1 minute to 24 hours")
    fleet.link_open = payload.open
    fleet.link_expires_at = timezone.now() + timedelta(minutes=payload.minutes) if payload.open and payload.minutes else None
    fleet.save(update_fields=["link_open", "link_expires_at"])
    return services.fleet_detail(_fleet(fleet_id), request.user)


@router.post("/{fleet_id}/end")
def end(request, fleet_id: int):
    fleet = _run(services.end_fleet, _editable(request, fleet_id))
    record("fleets.end", f"ended the fleet \"{fleet.name}\" ({fleet.fats.count()} FATs)", request=request, target=fleet)
    return services.fleet_detail(_fleet(fleet_id), request.user)


@router.get("/{fleet_id}/candidates")
def candidates(request, fleet_id: int, q: str = ""):
    """Registered characters matching ``q``, to add by hand."""
    fleet = _editable(request, fleet_id)
    if len(q.strip()) < 2:
        return []
    have = set(fleet.fats.values_list("character_id", flat=True))
    chars = Character.objects.filter(name__icontains=q.strip()).exclude(pk__in=have).select_related("user__main_character")[:20]
    return [{"id": c.pk, "name": c.name, "portrait": c.portrait, "member": c.user.display_name} for c in chars]


class AddIn(Schema):
    characters: list[int]


@router.post("/{fleet_id}/fats")
def add_fats(request, fleet_id: int, payload: AddIn):
    fleet = _editable(request, fleet_id)
    chars = list(Character.objects.filter(pk__in=payload.characters))
    added = services.record(fleet, [(c.pk, None, None) for c in chars], Fat.Via.MANUAL, by=request.user)
    if added:
        record("fleets.fat_added", f"added {added} FAT{'s' if added != 1 else ''} to \"{fleet.name}\"", request=request, target=fleet,
               details={"characters": [c.name for c in chars]})
    return services.fleet_detail(_fleet(fleet_id), request.user)


@router.delete("/{fleet_id}/fats/{fat_id}")
def remove_fat(request, fleet_id: int, fat_id: int):
    fleet = _editable(request, fleet_id)
    fat = fleet.fats.filter(pk=fat_id).first()
    if fat is None:
        raise HttpError(404, "No such FAT")
    fat.delete()
    record("fleets.fat_removed", f"removed {fat.character_name}'s FAT from \"{fleet.name}\"", request=request, target=fleet)
    return services.fleet_detail(_fleet(fleet_id), request.user)


@router.delete("/{fleet_id}")
@require_perm("fleets.manage_fleets")
def delete(request, fleet_id: int):
    fleet = _fleet(fleet_id)
    record("fleets.delete", f"deleted the fleet \"{fleet.name}\"", request=request, target=fleet)
    fleet.delete()
    return {"ok": True}


# --- managers ------------------------------------------------------------------------------------------------------


@router.get("/stats/members")
@require_perm("fleets.manage_fleets")
def stats(request, days: int = 30, type: int | None = None):
    return {"days": days, "members": services.leaderboard(max(1, min(days, 3650)), type)}


def _csv_row(cells) -> list[str]:
    """Spreadsheets run cells starting with = + - @ as formulas; quote those."""
    return ["'" + str(c) if str(c)[:1] in ("=", "+", "-", "@", "\t", "\r") else str(c) for c in cells]


@router.get("/stats/members.csv")
@require_perm("fleets.manage_fleets")
def stats_csv(request, days: int = 30, type: int | None = None):
    rows = services.leaderboard(max(1, min(days, 3650)), type)
    resp = HttpResponse(content_type="text/csv; charset=utf-8")
    resp["Content-Disposition"] = f'attachment; filename="fleet-attendance-{days}d.csv"'
    out = csv.writer(resp)
    out.writerow(["Member", "Registered", "Fleets", "Characters", "Last fleet"])
    for m in rows:
        out.writerow(_csv_row([m["name"], "yes" if m["registered"] else "no", m["fleets"], ", ".join(m["characters"]), m["last"][:10]]))
    return resp


class TypeIn(Schema):
    name: str
    color: str = "#38bdf8"


@router.post("/types")
@require_perm("fleets.manage_fleets")
def add_type(request, payload: TypeIn):
    import re

    name = payload.name.strip()[:50]
    if not name:
        raise HttpError(400, "Give the fleet type a name")
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", payload.color):
        raise HttpError(400, "The colour must look like #38bdf8")
    t, created = FleetType.objects.get_or_create(name=name, defaults={"color": payload.color.lower()})
    if not created:
        raise HttpError(400, f"{name} already exists")
    return services.type_out(t)


@router.delete("/types/{type_id}")
@require_perm("fleets.manage_fleets")
def delete_type(request, type_id: int):
    FleetType.objects.filter(pk=type_id).delete()  # its fleets keep their FATs, without a type
    return {"ok": True}
