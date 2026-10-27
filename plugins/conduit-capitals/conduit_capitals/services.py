"""Capital Registry: who can fly and who owns each capital hull, and where the hulls are.

Everything comes from what the core already syncs for the character sheet:

- **can fly**: the character's synced skills against the hull's required skills in the static data (the way Member
  Audit's skill check and the Doctrines plugin work it out). Having the direct requirements means having their
  prerequisites, since the game won't train a skill without them;
- **owns**: the hull in the character's synced assets, assembled or packaged, with where it sits: the station or
  structure (or in space), the system and region, and whether it's in the hangar, in another ship's maintenance bay,
  in asset safety or in item deliveries;
- **jump readiness**: Jump Drive Operation, Jump Drive Calibration and Jump Fuel Conservation, the jump clones and
  home station, when the next clone jump is possible (Infomorph Synchronizing) and jump fatigue, from the overview
  section of the sheet.

Each character's skills, assets and clones data is checked against its sync status, so a pilot with an old or
missing sync is flagged rather than silently counted as not flying or owning anything.

Members see their own characters. The registry of everyone needs ``capitals.view_registry`` and only ever shows the
characters the viewer may read through the core sheet permissions (``conduit.sheet.access.viewable_characters``).
"""

from __future__ import annotations

from collections import defaultdict
from datetime import timedelta

from django.db.models import Sum
from django.utils import timezone

from conduit.accounts.models import Character
from conduit.eve.models import portrait_url
from conduit.sde.models import ItemType, SolarSystem, type_icon_url
from conduit.sheet.assets.models import Asset
from conduit.sheet.models import Location, SyncStatus
from conduit.sheet.skills import training

from . import classes
from .models import Availability

VIEW_PERM = "capitals.view_registry"
SHIP_CATEGORY = 6
#: Skills that matter for jumping (type ids from the SDE; they have never changed).
JUMP_SKILLS = {"jdo": 3456, "jdc": 21611, "jfc": 21610, "infomorph": 33399}
#: A clone jump is possible every 24 hours, an hour less per level of Infomorph Synchronizing.
CLONE_JUMP_HOURS = 24
#: The sheet sections the registry reads, and the scope each needs.
SECTIONS = {
    "skills": "esi-skills.read_skills.v1",
    "assets": "esi-assets.read_assets.v1",
    "clones": "esi-clones.read_clones.v1",
}
#: Our name for a section -> the core's sync section (clones come with the overview).
CORE_SECTION = {"skills": "skills", "assets": "assets", "clones": "overview"}
#: Data older than this is flagged as stale (the sections sync every 10 to 60 minutes when all is well).
STALE_AFTER = timedelta(days=2)
NOTE_MAX = 300


class CapitalsError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def can_view_registry(user) -> bool:
    return user.has_perm(VIEW_PERM)


# --- which characters ------------------------------------------------------------------------------------------------


def reach(viewer, corporation: int | None = None, state: int | None = None, group: int | None = None):
    """Members' characters the viewer may read (core sheet permissions), narrowed by the registry's filters."""
    from conduit.access.services import site_members
    from conduit.sheet.access import viewable_characters

    qs = viewable_characters(viewer).filter(user__in=site_members())
    if corporation:
        qs = qs.filter(corporation_id=corporation)
    if state:
        qs = qs.filter(user__state_id=state)
    if group:
        qs = qs.filter(user__groups=group)
    return qs.select_related("corporation", "user__main_character").distinct()


def filter_options(viewer) -> dict:
    from django.contrib.auth.models import Group

    from conduit.access.models import State

    chars = reach(viewer)
    corps = {}
    for c in chars:
        if c.corporation_id and c.corporation_id not in corps:
            corps[c.corporation_id] = {"id": c.corporation_id, "name": c.corporation.name, "ticker": c.corporation.ticker}
    user_ids = chars.values("user_id")
    return {
        "characters": chars.count(),
        "corporations": sorted(corps.values(), key=lambda c: c["name"].lower()),
        "states": [{"id": s.pk, "name": s.name} for s in State.objects.filter(public=False).order_by("-priority", "name")],
        "groups": [{"id": g.pk, "name": g.name} for g in Group.objects.filter(user__in=user_ids).distinct().order_by("name")],
        "classes": [{"key": c.key, "label": c.label} for c in classes.CLASSES],
    }


# --- data freshness ----------------------------------------------------------------------------------------------


def data_status(chars) -> dict[int, dict]:
    """``{character_id: {"skills"|"assets"|"clones": {"status", "at"}}}``. Status is ``ok``, ``stale`` (no good sync for
    two days), ``missing_scopes`` (the login doesn't allow it), ``token_invalid`` (the login stopped working),
    ``error`` (syncing fails) or ``never`` (not synced yet)."""
    ids = [c.pk for c in chars]
    rows = {(s.character_id, s.section): s for s in SyncStatus.objects.filter(character_id__in=ids, section__in=CORE_SECTION.values())}
    from conduit.accounts.models import Token

    tokens = {t.character_id: t for t in Token.objects.filter(character_id__in=ids).only("character_id", "scopes", "valid")}
    stale = timezone.now() - STALE_AFTER
    out = {}
    for cid in ids:
        token = tokens.get(cid)
        per = {}
        for key, scope in SECTIONS.items():
            st = rows.get((cid, CORE_SECTION[key]))
            at = st.last_success if st else None
            if token is None or not token.valid or (st and st.result == SyncStatus.Result.TOKEN_INVALID):
                status = "token_invalid"
            elif scope not in token.scope_set or (st and st.result == SyncStatus.Result.MISSING_SCOPES):
                status = "missing_scopes"
            elif at is None:
                status = "error" if st and st.result == SyncStatus.Result.ERROR else "never"
            elif at < stale:
                status = "stale"
            else:
                status = "ok"
            per[key] = {"status": status, "at": at.isoformat() if at else None}
        out[cid] = per
    return out


def _has_problem(status: dict) -> bool:
    return any(v["status"] != "ok" for v in status.values())


# --- places ----------------------------------------------------------------------------------------------------------


def places(location_ids) -> dict[int, dict]:
    """API shape of stations, structures and systems: name, kind, and the system with its security and region."""
    ids = {int(i) for i in location_ids if i}
    locs = {loc.id: loc for loc in Location.objects.filter(pk__in=ids)}
    system_ids = {loc.solar_system_id for loc in locs.values() if loc.solar_system_id} | {i for i in ids if 30_000_000 <= i < 33_000_000}
    systems = {s.pk: s for s in SolarSystem.objects.filter(pk__in=system_ids).select_related("region")}

    def system_out(sid):
        s = systems.get(sid)
        return {"id": s.pk, "name": s.name, "security": s.display_security, "region": s.region.name if s.region_id else None} if s else None

    out = {}
    for i in ids:
        loc = locs.get(i)
        if loc is not None:
            out[i] = {"id": i, "name": loc.name, "kind": loc.kind, "system": system_out(loc.solar_system_id)}
        elif i in systems:
            out[i] = {"id": i, "name": systems[i].name, "kind": "solar_system", "system": system_out(i)}
        else:
            out[i] = {"id": i, "name": "Unknown location", "kind": "unknown", "system": None}
    return out


def _where(asset: Asset, parent: Asset | None, parent_is_ship: bool, place: dict | None) -> tuple[str, str]:
    """Where in its location a hull sits: a key and words for people."""
    if asset.location_flag == "AssetSafety" or (parent is not None and parent.location_flag == "AssetSafety"):
        return "asset_safety", "In asset safety"
    if asset.location_type == "item":
        if parent is not None and parent_is_ship:
            return "ship_bay", f"In the ship maintenance bay of {parent.name or 'another ship'}"
        return "container", "Inside another item"
    if place and place["kind"] == "solar_system":
        return "space", "In space"
    if asset.location_flag in ("Deliveries", "CorpDeliveries"):
        return "deliveries", "In item deliveries"
    if asset.location_flag == "Hangar":
        return "hangar", "In the ship hangar"
    return "other", asset.location_flag or "Somewhere else"


# --- the registry ------------------------------------------------------------------------------------------------


class Registry:
    """Skills, assets, availability and sync status of a set of characters against the capital hulls, loaded once."""

    def __init__(self, characters, cls: str | None = None):
        self.chars = list(characters)
        self.by_id = {c.pk: c for c in self.chars}
        self.hulls = classes.hulls(cls)
        ids = list(self.by_id)
        self.need = {pk: {sid: lvl for sid, lvl in reqs or ()}
                     for pk, reqs in ItemType.objects.filter(pk__in=self.hulls).values_list("pk", "required_skills")}
        skills = {s for need in self.need.values() for s in need} | set(JUMP_SKILLS.values())
        self.state = training.character_state(ids, skills)
        self.assets = list(Asset.objects.filter(character_id__in=ids, type_id__in=self.hulls).order_by("character_id", "item_id"))
        self.availability = {(a.character_id, a.type_id): a for a in Availability.objects.filter(character_id__in=ids)}
        self.status = data_status(self.chars)
        self._places: dict[int, dict] | None = None
        self._parents: dict[tuple[int, int], tuple[Asset, bool]] | None = None
        #: Characters whose assets were put in an answer (for the snooper log).
        self.shown: dict[int, Character] = {}

    # skills

    def synced(self, cid: int) -> bool:
        return self.state[cid]["synced"]

    def can_fly(self, cid: int, type_id: int) -> bool:
        st = self.state[cid]
        return st["synced"] and training.meets(st["levels"], self.need.get(type_id, {}))

    def flyable(self, cid: int, cls: str | None = None) -> list[int]:
        return [h.id for h in self.hulls.values() if (cls is None or h.cls == cls) and self.can_fly(cid, h.id)]

    # assets

    def owned(self, cid: int | None = None, cls: str | None = None) -> list[Asset]:
        return [a for a in self.assets if (cid is None or a.character_id == cid) and (cls is None or self.hulls[a.type_id].cls == cls)]

    def _load_places(self):
        if self._places is not None:
            return
        wanted = {(a.character_id, a.location_id) for a in self.assets if a.location_type == "item"}
        parents = Asset.objects.filter(character_id__in={c for c, _ in wanted}, item_id__in={i for _, i in wanted})
        parents = [p for p in parents if (p.character_id, p.item_id) in wanted]
        ships = set(ItemType.objects.filter(pk__in={p.type_id for p in parents}, group__category_id=SHIP_CATEGORY).values_list("pk", flat=True))
        self._parents = {(p.character_id, p.item_id): (p, p.type_id in ships) for p in parents}
        self._places = places({a.root_location_id for a in self.assets})

    def asset_out(self, a: Asset) -> dict:
        self._load_places()
        parent, parent_is_ship = self._parents.get((a.character_id, a.location_id), (None, False)) if a.location_type == "item" else (None, False)
        place = self._places.get(a.root_location_id)
        where, words = _where(a, parent, parent_is_ship, place)
        av = self.availability.get((a.character_id, a.type_id))
        self.shown[a.character_id] = self.by_id[a.character_id]
        return {
            "item_id": a.item_id,
            "type_id": a.type_id,
            "class": self.hulls[a.type_id].cls,
            "name": a.name,
            "packaged": not a.is_singleton,
            "quantity": a.quantity,
            "place": place,
            "where": where,
            "where_label": words,
            "availability": availability_out(av),
        }

    # people

    def character_brief(self, c: Character) -> dict:
        corp = c.corporation
        return {
            "id": c.pk, "name": c.name, "portrait": portrait_url(c.pk, 64),
            "corporation": {"id": corp.pk, "name": corp.name, "ticker": corp.ticker} if corp else None,
            "owner": c.user.display_name if c.user_id else "",
            "owner_id": c.user_id,
            "data": self.status[c.pk],
            "problem": _has_problem(self.status[c.pk]),
        }

    def hulls_out(self) -> dict:
        return {str(h.id): {"id": h.id, "name": h.name, "class": h.cls, "icon": type_icon_url(h.id)} for h in self.hulls.values()}


def availability_out(av: Availability | None) -> dict | None:
    if av is None:
        return None
    return {"available": av.available, "note": av.note, "updated_at": av.updated_at.isoformat()}


# --- per character (my capitals, and one member in the registry) ---------------------------------------------------


def _jump(reg: Registry, chars) -> dict[int, dict]:
    """Jump skills, clones, the next clone jump and fatigue of each character."""
    from conduit.sheet.overview.models import CharacterInfo

    infos = {i.character_id: i for i in CharacterInfo.objects.filter(character_id__in=[c.pk for c in chars])}
    loc_ids = set()
    for i in infos.values():
        loc_ids |= {i.home_location_id, i.structure_id or i.station_id or i.solar_system_id, *(j.get("location_id") for j in i.jump_clones or [])}
    where = places(loc_ids)
    now = timezone.now()
    out = {}
    for c in chars:
        levels = reg.state[c.pk]["levels"]
        skills = {k: levels.get(sid, 0) for k, sid in JUMP_SKILLS.items()}
        i = infos.get(c.pk)
        ready_at = None
        if i and i.last_clone_jump_date:
            ready_at = i.last_clone_jump_date + timedelta(hours=CLONE_JUMP_HOURS - skills["infomorph"])
        current = (i.structure_id or i.station_id or i.solar_system_id) if i else None
        ship = i.ship_type_id if i and i.ship_type_id in reg.hulls else None
        out[c.pk] = {
            "skills": skills if reg.synced(c.pk) else None,
            "home": where.get(i.home_location_id) if i and i.home_location_id else None,
            "clones": [
                {"id": j.get("jump_clone_id"), "name": j.get("name") or "", "place": where.get(j.get("location_id")),
                 "implants": len(j.get("implants") or [])}
                for j in ((i.jump_clones or []) if i else [])
            ],
            "clone_jump_ready_at": ready_at.isoformat() if ready_at and ready_at > now else None,
            "fatigue_until": i.jump_fatigue_expires.isoformat() if i and i.jump_fatigue_expires and i.jump_fatigue_expires > now else None,
            "location": where.get(current) if current else None,
            "flying": ship,
        }
    return out


def characters_out(chars) -> tuple[dict, Registry]:
    """Every capital each character can fly and owns, with their jump readiness. Also returns the registry (for
    ``shown``)."""
    chars = list(chars)
    reg = Registry(chars)
    jump = _jump(reg, chars)
    out = []
    for c in chars:
        out.append({
            **reg.character_brief(c),
            "fly": {k.key: reg.flyable(c.pk, k.key) for k in classes.CLASSES},
            "owned": [reg.asset_out(a) for a in reg.owned(c.pk)],
            "availability": {str(tid): availability_out(av) for (cid, tid), av in reg.availability.items() if cid == c.pk},
            "jump": jump[c.pk],
        })
    out.sort(key=lambda r: (-len(r["owned"]), -sum(len(v) for v in r["fly"].values()), r["name"].lower()))
    return {"characters": out, "hulls": reg.hulls_out(), "classes": [{"key": k.key, "label": k.label} for k in classes.CLASSES]}, reg


def me(user) -> dict:
    data, _ = characters_out(Character.objects.filter(user=user).select_related("corporation", "user__main_character"))
    return {**data, "can_view_registry": can_view_registry(user)}


def member(viewer, user_id: int) -> tuple[dict, Registry]:
    """One member's characters the viewer may read."""
    chars = list(reach(viewer).filter(user_id=user_id))
    if not chars:
        raise CapitalsError("Not found", 404)
    owner = chars[0].user
    data, reg = characters_out(chars)
    return {**data, "member": {"id": owner.pk, "name": owner.display_name,
                               "portrait": portrait_url(owner.main_character_id, 64) if owner.main_character_id else None}}, reg


# --- registry views ------------------------------------------------------------------------------------------------


def summary(reg: Registry) -> dict:
    """Per class and per hull: characters (and members) who can fly it, how many are owned, and how many of those are
    marked available or not."""
    owned_by_type = defaultdict(list)
    for a in reg.assets:
        owned_by_type[a.type_id].append(a)
    rows = []
    for k in classes.CLASSES:
        hulls = [h for h in reg.hulls.values() if h.cls == k.key]
        pilots, owners, hull_rows = set(), set(), []
        for h in hulls:
            fly = {c.pk for c in reg.chars if reg.can_fly(c.pk, h.id)}
            assets = owned_by_type.get(h.id, [])
            marks = [reg.availability.get((a.character_id, a.type_id)) for a in assets]
            pilots |= fly
            owners |= {a.character_id for a in assets}
            hull_rows.append({
                "id": h.id, "name": h.name, "icon": type_icon_url(h.id),
                "pilots": len(fly), "owned": sum(a.quantity for a in assets),
                "available": sum(1 for m in marks if m and m.available), "unavailable": sum(1 for m in marks if m and not m.available),
            })
        users = {reg.by_id[c].user_id for c in pilots}
        rows.append({
            "key": k.key, "label": k.label,
            "pilots": len(pilots), "members": len(users),
            "owners": len(owners), "owner_members": len({reg.by_id[c].user_id for c in owners}),
            "owned": sum(r["owned"] for r in hull_rows),
            "available": sum(r["available"] for r in hull_rows), "unavailable": sum(r["unavailable"] for r in hull_rows),
            "hulls": hull_rows,
        })
    problems = {key: sum(1 for s in reg.status.values() if s[key]["status"] != "ok") for key in SECTIONS}
    return {"classes": rows, "characters": len(reg.chars), "members": len({c.user_id for c in reg.chars}),
            "problems": problems, "hulls_known": len(reg.hulls)}


def class_pilots(reg: Registry, key: str) -> dict:
    """Every character who can fly or owns a hull of one class."""
    if key not in classes.BY_KEY:
        raise CapitalsError("No such capital class", 404)
    out = []
    for c in reg.chars:
        fly = reg.flyable(c.pk, key)
        owned = reg.owned(c.pk, key)
        if not fly and not owned:
            continue
        out.append({**reg.character_brief(c), "fly": fly, "owned": [reg.asset_out(a) for a in owned]})
    out.sort(key=lambda r: (-len(r["owned"]), -len(r["fly"]), r["name"].lower()))
    # Characters we can't judge: no skills synced, so they may well fly it.
    unknown = [reg.character_brief(c) for c in reg.chars if not reg.synced(c.pk)]
    return {"class": {"key": key, "label": classes.BY_KEY[key].label}, "pilots": out, "unknown": unknown[:200],
            "unknown_count": len(unknown), "hulls": reg.hulls_out()}


def by_location(reg: Registry, cls: str | None = None) -> dict:
    """Owned hulls grouped by where they're parked, most first."""
    groups: dict[int, dict] = {}
    for a in reg.assets:
        if cls and cls != classes.ANY and reg.hulls[a.type_id].cls != cls:
            continue
        row = reg.asset_out(a)
        g = groups.setdefault(a.root_location_id, {"place": row["place"], "ships": [], "count": 0})
        g["ships"].append({**row, "character": reg.character_brief(reg.by_id[a.character_id])})
        g["count"] += a.quantity
    out = sorted(groups.values(), key=lambda g: (-g["count"], (g["place"] or {}).get("name", "")))
    for g in out:
        g["ships"].sort(key=lambda s: (s["class"], reg.hulls[s["type_id"]].name, s["character"]["name"]))
    return {"locations": out, "hulls": reg.hulls_out()}


def by_member(reg: Registry) -> dict:
    """Each member (over the characters in reach): per class how many characters can fly it and how many hulls they own."""
    users: dict[int, dict] = {}
    for c in reg.chars:
        u = c.user
        row = users.setdefault(u.pk, {
            "id": u.pk, "name": u.display_name, "portrait": portrait_url(u.main_character_id, 64) if u.main_character_id else None,
            "characters": 0, "problems": 0, "classes": {k.key: {"fly": 0, "own": 0} for k in classes.CLASSES},
        })
        row["characters"] += 1
        row["problems"] += _has_problem(reg.status[c.pk])
        for k in classes.CLASSES:
            row["classes"][k.key]["fly"] += bool(reg.flyable(c.pk, k.key))
        for a in reg.owned(c.pk):
            row["classes"][reg.hulls[a.type_id].cls]["own"] += a.quantity
    out = list(users.values())
    for r in out:
        r["flyable"] = sum(1 for v in r["classes"].values() if v["fly"])
        r["owned"] = sum(v["own"] for v in r["classes"].values())
    out.sort(key=lambda r: (-r["owned"], -r["flyable"], r["name"].lower()))
    return {"members": out}


# --- availability --------------------------------------------------------------------------------------------------


def set_availability(user, character_id: int, type_id: int, available: bool | None, note: str = "") -> dict | None:
    """Mark one of the member's own hulls available for ops or not (``None`` clears it). Only hulls the character owns or
    can fly can be marked."""
    char = Character.objects.filter(pk=character_id, user=user).first()
    if char is None:
        raise CapitalsError("Pick one of your own characters", 404)
    hull = classes.hulls().get(type_id)
    if hull is None:
        raise CapitalsError("That isn't a capital hull")
    if available is None:
        Availability.objects.filter(character=char, type_id=type_id).delete()
        return None
    owns = Asset.objects.filter(character=char, type_id=type_id).exists()
    if not owns:
        reg = Registry([char], hull.cls)
        if not reg.can_fly(char.pk, type_id):
            raise CapitalsError(f"{char.name} neither owns nor can fly a {hull.name}")
    av, _ = Availability.objects.update_or_create(character=char, type_id=type_id,
                                                  defaults={"available": available, "note": (note or "").strip()[:NOTE_MAX]})
    return availability_out(av)


# --- group rules -----------------------------------------------------------------------------------------------------


def _rule_characters(user, scope: str) -> list[int]:
    if scope == "main":
        return [user.main_character_id] if user.main_character_id else []
    return list(user.characters.values_list("pk", flat=True))


def can_fly_class(user, cls: str, scope: str = "any") -> bool:
    """Whether the main / any / every character of the user can fly a hull of the class (or any capital)."""
    chars = _rule_characters(user, scope)
    if not chars:
        return False
    hulls = classes.hulls(cls)
    need = {pk: {sid: lvl for sid, lvl in reqs or ()} for pk, reqs in ItemType.objects.filter(pk__in=hulls).values_list("pk", "required_skills")}
    states = training.character_state(chars, {s for n in need.values() for s in n})
    ok = [states[c]["synced"] and any(training.meets(states[c]["levels"], n) for n in need.values()) for c in chars]
    return all(ok) if scope == "all" else any(ok)


def owns_class(user, cls: str, count: int = 1, scope: str = "any", skip_unavailable: bool = False) -> bool:
    """Whether the user's main / any character owns at least ``count`` hulls of the class. ``skip_unavailable`` leaves out
    hulls the member marked not available for ops."""
    chars = _rule_characters(user, scope)
    if not chars:
        return False
    qs = Asset.objects.filter(character_id__in=chars, type_id__in=list(classes.hulls(cls)))
    if skip_unavailable:
        off = Availability.objects.filter(character_id__in=chars, available=False).values_list("character_id", "type_id")
        for cid, tid in off:
            qs = qs.exclude(character_id=cid, type_id=tid)
    return (qs.aggregate(n=Sum("quantity"))["n"] or 0) >= count
