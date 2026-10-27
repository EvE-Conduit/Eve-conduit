"""The blueprint library: what the corporations (and members who share theirs) own, requests, and research.

- **Library:** every corporation blueprint (read by ``sync``) of the corporations a viewer may see, plus the originals
  of characters whose owner shares them, grouped by blueprint with the item it makes. Viewing needs
  ``blueprint_library.view_library``; a viewer (request managers too) sees the corporations their characters are in
  and those whose sheet the core lets them read. Where a corporation blueprint is (station or structure, hangar
  division) is only shown to those who may see that corporation's Assets section of the corporation sheet.
- **Requests:** members ask for copies (runs, copies, research wanted) or to borrow an original. Managers
  (``blueprint_library.manage_requests``) accept, mark it in progress (optionally with the corporation copying job
  doing it), deliver or decline it; the member is told each time. A delivered loan is due back after the days asked
  for and the borrower is reminded once a day while it's overdue.
- **Research:** originals short of ME 10 / TE 20, and research and copying jobs running in the corporations.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta
from datetime import timezone as dt_timezone

from django.db import transaction
from django.db.models import F, Q
from django.db.models.functions import Lower
from django.utils import timezone

from conduit.audit.services import record
from conduit.events import bus
from conduit.notify.services import notify, users_with_perm

from .models import CorpBlueprint, Request, SharedCharacter

VIEW_PERM = "blueprint_library.view_library"
MANAGE_PERM = "blueprint_library.manage_requests"
CATEGORY = "p.blueprints"
BLUEPRINT_CATEGORY = 9
MAX_ME, MAX_TE = 10, 20
MAX_RUNS, MAX_COPIES, MAX_LOAN_DAYS = 5000, 100, 90
MAX_ACTIVE_REQUESTS = 25
MAX_GROUPS = 400
#: Industry activities: manufacturing and reactions make the item; the rest work on the blueprint itself.
MAKING = (1, 11)
ACTIVITIES = {3: "TE research", 4: "ME research", 5: "Copying", 8: "Invention"}
COPYING = 5
#: A loan's borrower is reminded at most this often while it's overdue.
REMIND_EVERY = timedelta(hours=23)


class LibraryError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def can_manage(user) -> bool:
    return user.has_perm(MANAGE_PERM)


def can_view(user) -> bool:
    return user.has_perm(VIEW_PERM) or can_manage(user)


# --- who sees which corporation ---------------------------------------------------------------------------------------


def corporation_ids(user) -> set[int]:
    """Corporations whose blueprints this user sees: those their characters are in, and those the core lets them read
    the sheet of. Request managers are no different: managing requests isn't access to every corporation."""
    from conduit.accounts.models import Character
    from conduit.corp.access import can_view as can_view_corporation

    have = set(CorpBlueprint.objects.values_list("corporation_id", flat=True).distinct())
    own = set(Character.objects.filter(user=user).values_list("corporation_id", flat=True))
    return {c for c in have if c in own or can_view_corporation(user, c)}


def located_ids(user, corps, section: str = "assets") -> set[int]:
    """Of ``corps``, those where the user may also see where things are: the corporation sheet section the
    locations come from (Assets for hangars, Industry for jobs). Being in the corporation shows its library, not its
    hangars."""
    from conduit.corp.access import can_view_section

    return {c for c in corps if can_view_section(user, c, section)}


def shared_character_ids() -> dict[int, int]:
    """Characters whose originals are in the library -> their owner. A share stops counting once the character
    belongs to someone else."""
    from conduit.access.services import site_members

    members = site_members().values("pk")
    return dict(SharedCharacter.objects.filter(character__user_id__isnull=False, user__in=members)
                .filter(character__user_id=F("user_id")).values_list("character_id", "user_id"))


# --- names, icons and places ------------------------------------------------------------------------------------------


def _types(type_ids) -> dict:
    from conduit.sheet.util import types_by_id

    return types_by_id(type_ids)


def products_of(blueprint_type_ids) -> dict[int, object]:
    """Blueprint type -> the ``ItemType`` it makes. The static data import has no blueprint data, so this is learned
    from manufacturing and reaction jobs seen on the site, then from names ("Hurricane Blueprint" makes "Hurricane",
    "Fullerides Reaction Formula" makes "Fullerides")."""
    from conduit.corp.models import CorpIndustryJob
    from conduit.sde.models import ItemType
    from conduit.sheet.industry.models import IndustryJob

    ids = {int(t) for t in blueprint_type_ids}
    pairs: dict[int, int] = {}
    for model in (CorpIndustryJob, IndustryJob):
        todo = ids - set(pairs)
        if not todo:
            break
        for bp, product in (model.objects.filter(blueprint_type_id__in=todo, activity_id__in=MAKING, product_type_id__isnull=False)
                            .values_list("blueprint_type_id", "product_type_id").distinct()):
            pairs.setdefault(bp, product)
    by_name: dict[str, int] = {}
    for pk, name in ItemType.objects.filter(pk__in=ids - set(pairs)).values_list("pk", "name"):
        for suffix in (" Blueprint", " Reaction Formula"):
            if name.endswith(suffix):
                by_name[name[: -len(suffix)].lower()] = pk
    if by_name:
        for pk, lname in (ItemType.objects.annotate(lname=Lower("name")).filter(lname__in=by_name)
                          .exclude(group__category_id=BLUEPRINT_CATEGORY).values_list("pk", "lname")):
            pairs.setdefault(by_name[lname], pk)
    types = _types(pairs.values())
    return {bp: types[p] for bp, p in pairs.items() if p in types}


def _bp_icon(type_id: int, copy: bool = False) -> str:
    from conduit.sde.models import type_icon_url

    # The image server has "bp" and "bpc" for blueprints, not "icon".
    return type_icon_url(type_id, 64).replace("/icon?", "/bpc?" if copy else "/bp?")


def _product_out(t) -> dict | None:
    from conduit.sde.models import type_icon_url

    if t is None:
        return None
    return {"id": t.pk, "name": t.name, "icon": type_icon_url(t.pk, 64), "group": t.group.name if t.group_id else "",
            "category": t.group.category.name if t.group_id else ""}


def places(location_ids) -> dict[int, dict]:
    """Location id -> ``{"id", "name", "system"}`` in two queries (the core's ``describe`` asks per location)."""
    from conduit.sde.models import SolarSystem
    from conduit.sheet.models import Location

    locs = list(Location.objects.filter(pk__in={int(i) for i in location_ids if i}))
    systems = dict(SolarSystem.objects.filter(pk__in={loc.solar_system_id for loc in locs if loc.solar_system_id})
                   .values_list("pk", "name"))
    return {loc.pk: {"id": loc.pk, "name": loc.name, "system": systems.get(loc.solar_system_id)} for loc in locs}


def _divisions(corporation_ids) -> dict[int, dict[int, str]]:
    from conduit.corp.models import CorporationInfo

    out: dict[int, dict[int, str]] = {}
    for corp_id, divisions in CorporationInfo.objects.filter(corporation_id__in=corporation_ids).values_list("corporation_id", "hangar_divisions"):
        out[corp_id] = {d["division"]: d.get("name") or "" for d in divisions or [] if "division" in d}
    return out


def _division_name(divisions: dict[int, dict[int, str]], corp_id: int, division: int | None) -> str | None:
    if not division:
        return None
    return divisions.get(corp_id, {}).get(division) or f"Hangar {division}"


# --- the library ------------------------------------------------------------------------------------------------------


def _entries(user, type_ids=None, corporation_id: int | None = None) -> list[dict]:
    """Every blueprint the user may see, as flat rows (corporation ones and shared personal originals)."""
    from conduit.accounts.models import Character
    from conduit.eve.models import EveCorporation
    from conduit.sheet.blueprints.models import Blueprint

    corps = corporation_ids(user)
    if corporation_id is not None:
        corps &= {corporation_id}
    qs = CorpBlueprint.objects.filter(corporation_id__in=corps)
    if type_ids is not None:
        qs = qs.filter(type_id__in=type_ids)
    rows = list(qs.values("pk", "corporation_id", "type_id", "root_location_id", "division", "quantity", "runs",
                          "material_efficiency", "time_efficiency"))
    corp_names = {c.pk: c for c in EveCorporation.objects.filter(pk__in={r["corporation_id"] for r in rows})}
    located = located_ids(user, corp_names)
    divisions = _divisions(located)
    out = []
    for r in rows:
        c = corp_names.get(r["corporation_id"])
        shown = r["corporation_id"] in located
        out.append({
            "id": f"c{r['pk']}", "source": "corporation", "type_id": r["type_id"],
            "owner": {"id": r["corporation_id"], "name": c.name if c else str(r["corporation_id"]), "ticker": c.ticker if c else ""},
            "copy": r["quantity"] == -2, "quantity": max(r["quantity"], 1), "runs": r["runs"],
            "me": r["material_efficiency"], "te": r["time_efficiency"], "location_id": r["root_location_id"] if shown else None,
            "division": _division_name(divisions, r["corporation_id"], r["division"]) if shown else None,
        })
    if corporation_id is None:
        shared = shared_character_ids()
        if shared:
            # Members share originals only: their copies are theirs to use.
            pqs = Blueprint.objects.filter(character_id__in=shared).exclude(quantity=-2)
            if type_ids is not None:
                pqs = pqs.filter(type_id__in=type_ids)
            prow = list(pqs.values("pk", "character_id", "type_id", "root_location_id", "quantity", "runs", "material_efficiency",
                                   "time_efficiency"))
            names = dict(Character.objects.filter(pk__in={r["character_id"] for r in prow}).values_list("pk", "name"))
            for r in prow:
                out.append({
                    "id": f"p{r['pk']}", "source": "personal", "type_id": r["type_id"],
                    "owner": {"id": r["character_id"], "name": names.get(r["character_id"], ""), "ticker": ""},
                    "copy": False, "quantity": max(r["quantity"], 1), "runs": r["runs"],
                    "me": r["material_efficiency"], "te": r["time_efficiency"], "location_id": r["root_location_id"], "division": None,
                })
    return out


def _matches(e: dict, kind: str, me_min: int | None, source: str) -> bool:
    if kind == "original" and e["copy"] or kind == "copy" and not e["copy"]:
        return False
    if me_min is not None and e["me"] < me_min:
        return False
    return source in ("", "all") or e["source"] == source


def library(user, q: str = "", category: str = "", kind: str = "", me_min: int | None = None, source: str = "",
            corporation_id: int | None = None) -> dict:
    """Blueprints grouped by type, with what each makes, for the filters given. ``kind``: "original", "copy" or
    empty; ``source``: "corporation", "personal" or empty."""
    from conduit.eve.models import EveCorporation

    from .models import LibrarySync

    entries = [e for e in _entries(user, corporation_id=corporation_id) if _matches(e, kind, me_min, source)]
    by_type: dict[int, list[dict]] = defaultdict(list)
    for e in entries:
        by_type[e["type_id"]].append(e)
    types = _types(by_type)
    products = products_of(by_type)
    needle = " ".join((q or "").lower().split())
    groups, categories = [], defaultdict(int)
    for type_id, rows in by_type.items():
        t = types.get(type_id)
        product = products.get(type_id)
        name = t.name if t else f"Type {type_id}"
        cat = product.group.category.name if product is not None and product.group_id else "Other"
        if needle and needle not in name.lower() and not (product is not None and needle in product.name.lower()):
            continue
        categories[cat] += 1
        if category and cat != category:
            continue
        originals = [r for r in rows if not r["copy"]]
        copies = [r for r in rows if r["copy"]]
        groups.append({
            "type_id": type_id,
            "name": name,
            "icon": _bp_icon(type_id, copy=not originals),
            "product": _product_out(product),
            "category": cat,
            "originals": sum(r["quantity"] for r in originals),
            "copies": len(copies),
            "copy_runs": sum(r["runs"] for r in copies if r["runs"] > 0),
            "best_me": max((r["me"] for r in originals), default=None),
            "best_te": max((r["te"] for r in originals), default=None),
            "personal": sum(1 for r in rows if r["source"] == "personal"),
            "owners": sorted({r["owner"]["ticker"] or r["owner"]["name"] for r in rows if r["source"] == "corporation"}),
        })
    groups.sort(key=lambda g: g["name"].lower())
    corps = corporation_ids(user)
    syncs = {s.corporation_id: s for s in LibrarySync.objects.filter(corporation_id__in=corps)}
    return {
        "groups": groups[:MAX_GROUPS],
        "total": len(groups),
        "truncated": len(groups) > MAX_GROUPS,
        "categories": [{"name": n, "count": c} for n, c in sorted(categories.items())],
        "corporations": [
            {"id": c.pk, "name": c.name, "ticker": c.ticker,
             "synced_at": syncs[c.pk].last_success.isoformat() if c.pk in syncs and syncs[c.pk].last_success else None}
            for c in EveCorporation.objects.filter(pk__in=corps).order_by("name")
        ],
        "can_manage": can_manage(user),
    }


def type_detail(user, type_id: int) -> dict:
    """One blueprint: every copy and original of it the user may see, and where they are."""
    rows = _entries(user, type_ids=[type_id])
    if not rows:
        raise LibraryError("The library has no such blueprint", 404)
    where = places({r["location_id"] for r in rows})
    for r in rows:
        r["location"] = where.get(r.pop("location_id"))
    rows.sort(key=lambda r: (r["copy"], r["source"] != "corporation", -r["me"], -r["te"], r["owner"]["name"]))
    t = _types([type_id]).get(type_id)
    product = products_of([type_id]).get(type_id)
    originals = [r for r in rows if not r["copy"]]
    return {
        "type_id": type_id,
        "name": t.name if t else f"Type {type_id}",
        "icon": _bp_icon(type_id, copy=not originals),
        "product": _product_out(product),
        "best_me": max((r["me"] for r in originals), default=None),
        "best_te": max((r["te"] for r in originals), default=None),
        "has_original": bool(originals),
        "entries": rows,
        "open_requests": Request.objects.filter(type_id=type_id, status__in=Request.ACTIVE).count(),
    }


# --- research ---------------------------------------------------------------------------------------------------------


def _job_status(status: str, end) -> str:
    """ESI keeps a finished job "active" until someone delivers it."""
    return "ready" if status == "active" and end <= timezone.now() else status


def research(user) -> dict:
    """Corporation originals not fully researched, and research and copying jobs in those corporations."""
    from conduit.corp.models import CorpIndustryJob
    from conduit.eve.models import EveCorporation, EveName

    corps = corporation_ids(user)
    originals = list(CorpBlueprint.objects.filter(corporation_id__in=corps).exclude(quantity=-2)
                     .values("pk", "corporation_id", "type_id", "root_location_id", "division", "quantity",
                             "material_efficiency", "time_efficiency"))
    todo = [r for r in originals if r["material_efficiency"] < MAX_ME or r["time_efficiency"] < MAX_TE]
    jobs = list(CorpIndustryJob.objects.filter(corporation_id__in=corps, activity_id__in=ACTIVITIES,
                                               status__in=("active", "paused", "ready")).order_by("end_date")[:500])
    types = _types({r["type_id"] for r in todo} | {j.blueprint_type_id for j in jobs})
    corp_names = dict(EveCorporation.objects.filter(pk__in=corps).values_list("pk", "ticker"))
    hangars, sites = located_ids(user, corps), located_ids(user, corps, "industry")
    todo_shown = [r for r in todo if r["corporation_id"] in hangars]
    divisions = _divisions(hangars)
    where = places({r["root_location_id"] for r in todo_shown} | {j.location_id for j in jobs if j.corporation_id in sites})
    installers = dict(EveName.objects.filter(pk__in={j.installer_id for j in jobs}).values_list("pk", "name"))

    def name(type_id):
        t = types.get(type_id)
        return t.name if t else f"Type {type_id}"

    unresearched = sorted(
        (
            {
                "id": r["pk"], "type_id": r["type_id"], "name": name(r["type_id"]), "icon": _bp_icon(r["type_id"]),
                "corporation": corp_names.get(r["corporation_id"], ""), "quantity": max(r["quantity"], 1),
                "me": r["material_efficiency"], "te": r["time_efficiency"],
                "location": where.get(r["root_location_id"]) if r["corporation_id"] in hangars else None,
                "division": _division_name(divisions, r["corporation_id"], r["division"]) if r["corporation_id"] in hangars else None,
            }
            for r in todo
        ),
        key=lambda r: (r["name"].lower(), r["me"], r["te"]),
    )
    return {
        "summary": {
            "originals": len(originals),
            "researched": len(originals) - len(todo),
            "me_short": sum(1 for r in todo if r["material_efficiency"] < MAX_ME),
            "te_short": sum(1 for r in todo if r["time_efficiency"] < MAX_TE),
        },
        "unresearched": unresearched,
        "jobs": [
            {
                "job_id": j.job_id, "activity": ACTIVITIES[j.activity_id], "activity_id": j.activity_id,
                "type_id": j.blueprint_type_id, "name": name(j.blueprint_type_id), "icon": _bp_icon(j.blueprint_type_id),
                "runs": j.runs, "status": _job_status(j.status, j.end_date), "start_date": j.start_date.isoformat(),
                "end_date": j.end_date.isoformat(), "installer": installers.get(j.installer_id, ""),
                "corporation": corp_names.get(j.corporation_id, ""),
                "location": where.get(j.location_id) if j.corporation_id in sites else None,
            }
            for j in jobs
        ],
    }


# --- sharing one's own originals --------------------------------------------------------------------------------------


def my_characters(user) -> list[dict]:
    from conduit.accounts.models import Character
    from conduit.eve.models import portrait_url
    from conduit.sheet.blueprints.models import Blueprint

    chars = list(Character.objects.filter(user=user).order_by("name"))
    shared = set(SharedCharacter.objects.filter(user=user, character__in=chars).values_list("character_id", flat=True))
    counts: dict[int, dict[str, int]] = defaultdict(lambda: {"originals": 0, "copies": 0})
    for char_id, quantity in Blueprint.objects.filter(character__in=chars).values_list("character_id", "quantity"):
        counts[char_id]["copies" if quantity == -2 else "originals"] += 1
    return [{"id": c.pk, "name": c.name, "portrait": portrait_url(c.pk, 64), "shared": c.pk in shared, **counts[c.pk]}
            for c in chars]


def set_sharing(user, character_id: int, shared: bool) -> None:
    from conduit.accounts.models import Character

    char = Character.objects.filter(pk=character_id, user=user).first()
    if char is None:
        raise LibraryError("Not your character", 404)
    if shared:
        SharedCharacter.objects.update_or_create(character=char, defaults={"user": user})
    else:
        SharedCharacter.objects.filter(character=char).delete()


# --- requests ---------------------------------------------------------------------------------------------------------


def _number(value, what: str, low: int, high: int) -> int:
    try:
        n = int(value)
    except (TypeError, ValueError):
        raise LibraryError(f"The {what} must be a whole number") from None
    if n < low or n > high:
        raise LibraryError(f"The {what} must be between {low:,} and {high:,}")
    return n


def _parse_date(value) -> datetime | None:
    if value in (None, ""):
        return None
    if isinstance(value, datetime):
        dt = value
    else:
        try:
            dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        except ValueError:
            raise LibraryError("That isn't a date") from None
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt, dt_timezone.utc)
    return dt


def describe(r: Request) -> str:
    if r.kind == Request.Kind.LOAN:
        return f"loan of {r.name}"
    return f"{r.copies} × {r.runs}-run cop{'y' if r.copies == 1 else 'ies'} of {r.name}"


def _link(r: Request, manager: bool = False) -> str:
    return "/p/blueprints/queue" if manager else "/p/blueprints/requests"


def _project(user, project_id) -> tuple[int | None, str]:
    """An open Industry Projects project the user may see, when that plugin is on."""
    if not project_id:
        return None, ""
    from conduit.plugins.services import is_enabled

    if not is_enabled("projects"):
        raise LibraryError("Industry Projects isn't switched on")
    from conduit_projects import services as projects
    from conduit_projects.models import Project

    try:
        p = projects.project_for(user, int(project_id))
    except projects.ProjectError:
        raise LibraryError("No such project", 404) from None
    if p.status != Project.Status.OPEN:
        raise LibraryError("That project is closed")
    return p.pk, p.name


def projects_to_link(user) -> list[dict]:
    """Open Industry Projects projects the user sees, to say a request is for one ([] without that plugin)."""
    from conduit.plugins.services import is_enabled

    if not is_enabled("projects"):
        return []
    try:
        from conduit_projects import services as projects
        from conduit_projects.models import Project
    except ImportError:
        return []
    return [{"id": p.pk, "name": p.name} for p in projects.visible_to(user).filter(status=Project.Status.OPEN).order_by("name")[:100]]


def create_request(user, data: dict) -> Request:
    kind = data.get("kind") or Request.Kind.COPY
    if kind not in Request.Kind.values:
        raise LibraryError("Ask for copies or to borrow the original")
    type_id = _number(data.get("type_id"), "blueprint", 1, 2**31 - 1)
    rows = _entries(user, type_ids=[type_id])
    if not rows:
        raise LibraryError("The library has no such blueprint", 404)
    originals = [r for r in rows if not r["copy"]]
    if Request.objects.filter(user=user, status__in=Request.ACTIVE).count() >= MAX_ACTIVE_REQUESTS:
        raise LibraryError(f"You have {MAX_ACTIVE_REQUESTS} requests waiting already")
    t = _types([type_id]).get(type_id)
    r = Request(user=user, kind=kind, type_id=type_id, name=(t.name if t else f"Type {type_id}")[:200],
                note=str(data.get("note") or "").strip()[:500])
    if kind == Request.Kind.LOAN:
        if not originals:
            raise LibraryError("The library has only copies of this blueprint; ask for copies instead")
        r.loan_days = _number(data.get("loan_days") or 7, "number of days", 1, MAX_LOAN_DAYS)
    else:
        r.runs = _number(data.get("runs") or 1, "number of runs", 1, MAX_RUNS)
        r.copies = _number(data.get("copies") or 1, "number of copies", 1, MAX_COPIES)
        best_me = max((x["me"] for x in rows), default=0)
        best_te = max((x["te"] for x in rows), default=0)
        if data.get("min_me") not in (None, ""):
            r.min_me = _number(data["min_me"], "ME", 0, MAX_ME)
            if r.min_me > best_me:
                raise LibraryError(f"The best the library has is ME {best_me}")
        if data.get("min_te") not in (None, ""):
            r.min_te = _number(data["min_te"], "TE", 0, MAX_TE)
            if r.min_te > best_te:
                raise LibraryError(f"The best the library has is TE {best_te}")
    r.project_id, r.project_name = _project(user, data.get("project_id"))
    r.save()
    what = describe(r)
    managers = [u for u in users_with_perm(MANAGE_PERM) if u.pk != user.pk]
    notify(managers, f"{user.display_name} asks for a {what}" if kind == Request.Kind.LOAN else f"{user.display_name} asks for {what}",
           r.note, link=_link(r, manager=True), category=CATEGORY)
    bus.emit("blueprints.request_created", request_id=r.pk, user_id=user.pk, user=user.display_name, kind=r.kind,
             type_id=r.type_id, blueprint=r.name, runs=r.runs, copies=r.copies, link=_link(r, manager=True),
             title=f"Blueprint request: {what}", summary=f"{user.display_name}" + (f" · {r.note}" if r.note else ""), level="info")
    return r


def _require(r: Request, *statuses) -> None:
    if r.status not in statuses:
        raise LibraryError(f"This request is {r.get_status_display().lower()}")


def _tell(r: Request, title: str, body: str = "", level: str = "info") -> None:
    notify(r.user_id, title, body, link=_link(r), level=level, category=CATEGORY)


def _not_own(r: Request, by) -> None:
    """Managers don't work their own requests: someone else hands out the corporation's blueprints to them."""
    if r.user_id == by.pk:
        raise LibraryError("That's your own request: another library manager has to handle it", 403)


def _respond(r: Request, by, note: str | None) -> None:
    r.handled_by = by
    if note is not None and note.strip():
        r.response = note.strip()[:500]


@transaction.atomic
def accept(r: Request, by, note: str = "", request=None) -> Request:
    r = Request.objects.select_for_update().get(pk=r.pk)
    _not_own(r, by)
    _require(r, Request.Status.OPEN)
    r.status = Request.Status.ACCEPTED
    _respond(r, by, note)
    r.save()
    _tell(r, f"Blueprint request accepted: {describe(r)}", r.response or f"{by.display_name} is on it.")
    record("blueprints.accepted", f"accepted {r.user.display_name}'s request ({describe(r)})", request=request, actor=by,
           target=r.user, details={"request_id": r.pk})
    return r


def copy_jobs(r: Request, user=None) -> list[dict]:
    """Corporation copying jobs of this blueprint started around or after the request, to link one: in the
    corporations whose library ``user`` sees."""
    from conduit.corp.models import CorpIndustryJob
    from conduit.eve.models import EveCorporation, EveName

    qs = CorpIndustryJob.objects.all() if user is None else CorpIndustryJob.objects.filter(corporation_id__in=corporation_ids(user))
    jobs = list(qs.filter(activity_id=COPYING, blueprint_type_id=r.type_id,
                                               start_date__gte=r.created_at - timedelta(days=1)).order_by("-start_date")[:20])
    installers = dict(EveName.objects.filter(pk__in={j.installer_id for j in jobs}).values_list("pk", "name"))
    corps = dict(EveCorporation.objects.filter(pk__in={j.corporation_id for j in jobs}).values_list("pk", "ticker"))
    return [{"job_id": j.job_id, "corporation_id": j.corporation_id, "corporation": corps.get(j.corporation_id, ""),
             "runs": j.runs, "status": _job_status(j.status, j.end_date), "start_date": j.start_date.isoformat(),
             "end_date": j.end_date.isoformat(), "installer": installers.get(j.installer_id, "")} for j in jobs]


@transaction.atomic
def start(r: Request, by, job_id: int | None = None, note: str = "", request=None) -> Request:
    """Mark copies being made, optionally with the corporation copying job making them. Again while in progress to
    change the job."""
    from conduit.corp.models import CorpIndustryJob

    r = Request.objects.select_for_update().get(pk=r.pk)
    _not_own(r, by)
    if r.kind != Request.Kind.COPY:
        raise LibraryError("Only copies are made; hand a loan over with Deliver")
    _require(r, *Request.ACTIVE)
    if job_id:
        job = CorpIndustryJob.objects.filter(job_id=job_id, activity_id=COPYING, blueprint_type_id=r.type_id,
                                             corporation_id__in=corporation_ids(by)).first()
        if job is None:
            raise LibraryError("No corporation copying job of this blueprint with that id")
        r.job_id, r.job_corporation_id = job.job_id, job.corporation_id
    elif job_id is not None:
        r.job_id = r.job_corporation_id = None
    first = r.status != Request.Status.IN_PROGRESS
    r.status = Request.Status.IN_PROGRESS
    _respond(r, by, note)
    r.save()
    if first:
        job = job_out(r)
        body = f"Ready {_parse_date(job['end_date']).strftime('%Y-%m-%d %H:%M')} EVE time." if job and job["end_date"] else ""
        _tell(r, f"Your copies are being made: {r.name}", " ".join(x for x in (r.response, body) if x))
    record("blueprints.started", f"started on {r.user.display_name}'s request ({describe(r)})", request=request, actor=by, target=r.user,
           details={"request_id": r.pk, "job_id": r.job_id})
    return r


@transaction.atomic
def deliver(r: Request, by, note: str = "", due_at=None, request=None) -> Request:
    r = Request.objects.select_for_update().get(pk=r.pk)
    _not_own(r, by)
    _require(r, *Request.ACTIVE)
    now = timezone.now()
    r.status = Request.Status.DELIVERED
    r.delivered_at = now
    _respond(r, by, note)
    body = r.response
    if r.kind == Request.Kind.LOAN:
        r.due_at = _parse_date(due_at) or now + timedelta(days=r.loan_days or 7)
        if r.due_at <= now:
            raise LibraryError("The due date must be in the future")
        body = " ".join(x for x in (body, f"Hand it back by {r.due_at.strftime('%Y-%m-%d')}.") if x)
    r.save()
    what = describe(r)
    _tell(r, f"Delivered: {what}" if r.kind == Request.Kind.COPY else f"Lent to you: {r.name}", body, level="success")
    bus.emit("blueprints.request_delivered", request_id=r.pk, user_id=r.user_id, user=r.user.display_name, kind=r.kind,
             type_id=r.type_id, blueprint=r.name, runs=r.runs, copies=r.copies, by=by.display_name,
             due_at=r.due_at.isoformat() if r.due_at else None, link=_link(r, manager=True),
             title=f"Delivered {what} to {r.user.display_name}", summary=body or by.display_name, level="success")
    record("blueprints.delivered", f"delivered {r.user.display_name}'s request ({what})", request=request, actor=by, target=r.user,
           details={"request_id": r.pk})
    return r


@transaction.atomic
def decline(r: Request, by, note: str = "", request=None) -> Request:
    r = Request.objects.select_for_update().get(pk=r.pk)
    _require(r, *Request.ACTIVE)
    r.status = Request.Status.DECLINED
    _respond(r, by, note)
    r.save()
    _tell(r, f"Blueprint request declined: {describe(r)}", r.response, level="warning")
    record("blueprints.declined", f"declined {r.user.display_name}'s request ({describe(r)})", request=request, actor=by,
           target=r.user, details={"request_id": r.pk, "note": r.response})
    return r


def cancel(r: Request, user) -> Request:
    if r.user_id != user.pk:
        raise LibraryError("Not your request", 403)
    _require(r, *Request.ACTIVE)
    r.status = Request.Status.CANCELLED
    r.save(update_fields=["status", "updated_at"])
    if r.handled_by_id and r.handled_by_id != user.pk:
        notify(r.handled_by_id, f"{user.display_name} cancelled their request", describe(r), link=_link(r, manager=True),
               category=CATEGORY)
    return r


@transaction.atomic
def mark_returned(r: Request, by, request=None) -> Request:
    r = Request.objects.select_for_update().get(pk=r.pk)
    _not_own(r, by)
    if not r.on_loan:
        raise LibraryError("Only a blueprint out on loan can come back")
    r.status = Request.Status.RETURNED
    r.returned_at = timezone.now()
    r.handled_by = by
    r.save()
    _tell(r, f"Loan returned: {r.name}", "Thanks for bringing it back.", level="success")
    record("blueprints.returned", f"took back {r.name} from {r.user.display_name}", request=request, actor=by, target=r.user,
           details={"request_id": r.pk})
    return r


def extend(r: Request, by, due_at, request=None) -> Request:
    _not_own(r, by)
    if not r.on_loan:
        raise LibraryError("Only a blueprint out on loan has a due date")
    due = _parse_date(due_at)
    if due is None or due <= timezone.now():
        raise LibraryError("The due date must be in the future")
    r.due_at, r.reminded_at = due, None
    r.save(update_fields=["due_at", "reminded_at", "updated_at"])
    _tell(r, f"New due date for {r.name}", f"Hand it back by {due.strftime('%Y-%m-%d')}.")
    record("blueprints.extended", f"moved the due date of {r.user.display_name}'s loan of {r.name}", request=request, actor=by,
           target=r.user, details={"request_id": r.pk, "due_at": due.isoformat()})
    return r


def remind_overdue(now=None) -> int:
    """Remind borrowers of loans past their due date, at most once a day; managers hear the first time."""
    now = now or timezone.now()
    due = Request.objects.filter(kind=Request.Kind.LOAN, status=Request.Status.DELIVERED, due_at__lt=now)
    due = due.filter(Q(reminded_at__isnull=True) | Q(reminded_at__lt=now - REMIND_EVERY)).select_related("user")
    sent = 0
    for r in due:
        first = r.reminded_at is None
        days = max(1, (now - r.due_at).days)
        _tell(r, f"Loan overdue: {r.name}", f"It was due back {r.due_at.strftime('%Y-%m-%d')} ({days} day{'s' if days != 1 else ''} ago). "
              "Hand it back, or ask a library manager for more time.", level="warning")
        if first:
            notify([u for u in users_with_perm(MANAGE_PERM) if u.pk != r.user_id], f"{r.user.display_name}'s loan of {r.name} is overdue",
                   f"Due {r.due_at.strftime('%Y-%m-%d')}.", link=_link(r, manager=True), level="warning", category=CATEGORY)
            bus.emit("blueprints.loan_overdue", request_id=r.pk, user_id=r.user_id, user=r.user.display_name, type_id=r.type_id,
                     blueprint=r.name, due_at=r.due_at.isoformat(), link=_link(r, manager=True),
                     title=f"Overdue: {r.user.display_name}'s loan of {r.name}", summary=f"Due {r.due_at.strftime('%Y-%m-%d')}",
                     level="warning")
        r.reminded_at = now
        r.save(update_fields=["reminded_at"])
        sent += 1
    return sent


# --- what pages show --------------------------------------------------------------------------------------------------


def _person(u) -> dict | None:
    from conduit.eve.models import portrait_url

    if u is None:
        return None
    return {"id": u.pk, "name": u.display_name, "portrait": portrait_url(u.main_character_id, 64) if u.main_character_id else None}


def job_out(r: Request) -> dict | None:
    from conduit.corp.models import CorpIndustryJob

    if not r.job_id:
        return None
    j = CorpIndustryJob.objects.filter(corporation_id=r.job_corporation_id, job_id=r.job_id).first()
    if j is None:
        return {"job_id": r.job_id, "status": "unknown", "runs": None, "end_date": None}
    return {"job_id": j.job_id, "status": _job_status(j.status, j.end_date), "runs": j.runs, "end_date": j.end_date.isoformat()}


def request_out(r: Request) -> dict:
    now = timezone.now()
    return {
        "id": r.pk,
        "user": _person(r.user),
        "kind": r.kind,
        "type_id": r.type_id,
        "name": r.name,
        "icon": _bp_icon(r.type_id, copy=r.kind == Request.Kind.COPY),
        "runs": r.runs,
        "copies": r.copies,
        "min_me": r.min_me,
        "min_te": r.min_te,
        "loan_days": r.loan_days,
        "note": r.note,
        "project": {"id": r.project_id, "name": r.project_name} if r.project_id else None,
        "status": r.status,
        "handled_by": _person(r.handled_by),
        "response": r.response,
        "job": job_out(r),
        "created_at": r.created_at.isoformat(),
        "updated_at": r.updated_at.isoformat(),
        "delivered_at": r.delivered_at.isoformat() if r.delivered_at else None,
        "due_at": r.due_at.isoformat() if r.due_at else None,
        "returned_at": r.returned_at.isoformat() if r.returned_at else None,
        "overdue": bool(r.on_loan and r.due_at and r.due_at < now),
    }


def my_requests(user) -> list[dict]:
    rows = Request.objects.filter(user=user).select_related("user__main_character", "handled_by__main_character")[:300]
    return [request_out(r) for r in rows]


def queue(show: str = "active") -> list[dict]:
    """Requests for managers. ``show``: "active" (waiting on a manager), "loans" (out on loan) or "done"."""
    qs = Request.objects.select_related("user__main_character", "handled_by__main_character")
    if show == "loans":
        qs = qs.filter(kind=Request.Kind.LOAN, status=Request.Status.DELIVERED).order_by("due_at")
    elif show == "done":
        qs = qs.exclude(status__in=Request.ACTIVE).exclude(kind=Request.Kind.LOAN, status=Request.Status.DELIVERED).order_by("-updated_at")
    else:
        qs = qs.filter(status__in=Request.ACTIVE).order_by("created_at")
    return [request_out(r) for r in qs[:500]]


def queue_counts() -> dict:
    now = timezone.now()
    loans = Request.objects.filter(kind=Request.Kind.LOAN, status=Request.Status.DELIVERED)
    return {"active": Request.objects.filter(status__in=Request.ACTIVE).count(), "loans": loans.count(),
            "overdue": loans.filter(due_at__lt=now).count()}
