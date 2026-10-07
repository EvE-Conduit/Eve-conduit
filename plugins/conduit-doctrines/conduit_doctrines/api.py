"""Mounted at /api/p/doctrines/. Only reachable while the plugin is enabled."""

import csv

from django.db import transaction
from django.http import HttpResponse
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.audit.services import record
from conduit.permissions import require_perm
from conduit.sde.models import ItemType
from conduit.sheet.api import viewable_character

from . import eft, services
from .models import Doctrine, DoctrineFit, Fit

router = Router(tags=["doctrines"], auth=django_auth)
STATUS_WORDS = {"ready": "Ready", "can_fly": "Can fly", "missing": "Missing skills", "unknown": "Skills not synced"}


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except services.DoctrineError as exc:
        raise HttpError(exc.status, str(exc)) from None
    except eft.FitError as exc:
        raise HttpError(400, str(exc)) from None


def _doctrine(pk: int) -> Doctrine:
    d = Doctrine.objects.filter(pk=pk).first()
    if d is None:
        raise HttpError(404, "No such doctrine")
    return d


def _fit(pk: int) -> Fit:
    f = Fit.objects.filter(pk=pk).first()
    if f is None:
        raise HttpError(404, "No such fit")
    return f


# --- everyone ------------------------------------------------------------------------------------------------------


@router.get("")
def overview(request):
    return services.overview(request.user)


@router.get("/me")
def me(request):
    """For the dashboard widget: how many active doctrine fits I can fly."""
    return services.my_summary(request.user)


@router.get("/doctrines/{doctrine_id}")
def doctrine(request, doctrine_id: int):
    return services.doctrine_detail(_doctrine(doctrine_id), request.user)


@router.get("/fits/{fit_id}")
def fit(request, fit_id: int):
    return services.fit_detail(_fit(fit_id), request.user)


@router.get("/fits/{fit_id}/plan")
def fit_plan(request, fit_id: int, character: int | None = None):
    """The skills a character still needs (or the whole plan) as text for the game's skill plan import."""
    return {"text": _run(services.plan_text, _fit(fit_id), character, request.user)}


class SaveIn(Schema):
    character: int


@router.post("/fits/{fit_id}/save-to-eve")
def save_to_eve(request, fit_id: int, payload: SaveIn):
    f = _fit(fit_id)
    fitting_id = _run(services.save_to_eve, f, payload.character, request.user)
    return {"fitting_id": fitting_id}


@router.get("/characters/{character_id}")
def character_tab(request, character_id: int):
    """The character sheet's Doctrines tab: who may see the sheet may see this."""
    character = viewable_character(request, character_id)
    return services.character_fits(character)


# --- managing ------------------------------------------------------------------------------------------------------


class ParseIn(Schema):
    eft: str


def _draft(parsed: dict) -> Fit:
    """An unsaved fit, to show or export what was read."""
    return Fit(name=parsed["name"], ship_type_id=parsed["ship_type_id"], items=eft.normalise(parsed["items"]))


def _preview(parsed: dict) -> dict:
    return {**parsed, "view": services.fit_view(_draft(parsed))}


@router.post("/parse")
@require_perm("doctrines.manage_doctrines")
def parse(request, payload: ParseIn):
    """Read an EFT fit and show it, without saving."""
    return _preview(_run(eft.parse, payload.eft))


@router.get("/my-fittings")
@require_perm("doctrines.manage_doctrines")
def my_fittings(request):
    """My characters' saved in-game fittings (synced by the character sheet), to start a fit from."""
    from conduit.sheet.fittings.models import Fitting

    rows = list(Fitting.objects.filter(character__user=request.user).select_related("character").order_by("character__name", "name"))
    ships = dict(ItemType.objects.filter(pk__in={r.ship_type_id for r in rows}).values_list("id", "name"))
    out = []
    for r in rows:
        draft = _draft(eft.from_ingame(r))
        types = {t.pk: t for t in ItemType.objects.filter(pk__in=services.fit_type_ids(draft))}
        out.append({"id": f"{r.character_id}:{r.fitting_id}", "name": r.name, "character": r.character.name,
                    "ship": ships.get(r.ship_type_id, f"Type {r.ship_type_id}"), "ship_type_id": r.ship_type_id,
                    "eft": eft.export(draft, types)})
    return out


@router.get("/skills")
@require_perm("doctrines.manage_doctrines")
def skills(request, q: str = ""):
    if len(q.strip()) < 2:
        return []
    qs = ItemType.objects.filter(group__category_id=16, published=True, name__icontains=q.strip()).select_related("group").order_by("name")[:20]
    return [{"id": t.pk, "name": t.name, "group": t.group.name} for t in qs]


@router.get("/fits")
@require_perm("doctrines.manage_doctrines")
def all_fits(request):
    fits = list(Fit.objects.prefetch_related("doctrines"))
    types = services._types({f.ship_type_id for f in fits})
    return [{**services.fit_brief(f, types), "doctrines": [d.name for d in f.doctrines.all()]} for f in fits]


class FitIn(Schema):
    eft: str
    name: str = ""
    role: str = ""
    notes: str = ""
    recommended: list[list[int]] = []
    doctrines: list[int] = []


def _apply_fit(f: Fit, payload: FitIn) -> list[str]:
    parsed = _run(eft.parse, payload.eft)
    if parsed["problems"]:
        raise HttpError(400, "This fit can't be fitted: " + "; ".join(parsed["problems"]))
    f.name = (payload.name.strip() or parsed["name"])[:100]
    f.ship_type_id = parsed["ship_type_id"]
    f.items = eft.normalise(parsed["items"])
    f.role = payload.role.strip()[:40]
    f.notes = payload.notes.strip()[:4000]
    f.recommended = _run(services.clean_recommended, payload.recommended)
    return parsed["unknown"]


def _set_doctrines(f: Fit, ids: list[int]):
    wanted = set(Doctrine.objects.filter(pk__in=ids).values_list("id", flat=True))
    DoctrineFit.objects.filter(fit=f).exclude(doctrine_id__in=wanted).delete()
    have = set(DoctrineFit.objects.filter(fit=f).values_list("doctrine_id", flat=True))
    for did in wanted - have:
        last = DoctrineFit.objects.filter(doctrine_id=did).order_by("-order").values_list("order", flat=True).first()
        DoctrineFit.objects.create(doctrine_id=did, fit=f, order=(last or 0) + 1)


def _saved(request, f: Fit, unknown: list[str], created: bool):
    from conduit.events import bus

    record("doctrines.fit_created" if created else "doctrines.fit_changed", f"{'added' if created else 'changed'} the fit \"{f.name}\"",
           request=request, target=f)
    bus.emit("doctrines.fit_saved", fit_id=f.pk, fit=f.name, title=f"Doctrine fit {'added' if created else 'updated'}: {f.name}",
             summary=", ".join(d.name for d in f.doctrines.all()) or "Not in a doctrine yet", link=f"/p/doctrines/fit/{f.pk}")
    return {**services.fit_detail(f, request.user), "unknown": unknown}


@router.post("/fits")
@require_perm("doctrines.manage_doctrines")
def create_fit(request, payload: FitIn):
    f = Fit(created_by=request.user)
    unknown = _apply_fit(f, payload)
    with transaction.atomic():
        f.save()
        _set_doctrines(f, payload.doctrines)
    return _saved(request, f, unknown, True)


@router.put("/fits/{fit_id}")
@require_perm("doctrines.manage_doctrines")
def edit_fit(request, fit_id: int, payload: FitIn):
    f = _fit(fit_id)
    unknown = _apply_fit(f, payload)
    with transaction.atomic():
        f.save()
        _set_doctrines(f, payload.doctrines)
    return _saved(request, f, unknown, False)


@router.delete("/fits/{fit_id}")
@require_perm("doctrines.manage_doctrines")
def delete_fit(request, fit_id: int):
    f = _fit(fit_id)
    record("doctrines.fit_deleted", f"deleted the fit \"{f.name}\"", request=request, target=f)
    f.delete()
    return {"ok": True}


class DoctrineIn(Schema):
    name: str
    description: str = ""
    icon_type_id: int | None = None
    order: int = 0
    active: bool = True
    #: Fit ids in the order they're shown.
    fits: list[int] = []


def _apply_doctrine(d: Doctrine, payload: DoctrineIn):
    name = payload.name.strip()[:100]
    if not name:
        raise HttpError(400, "Give the doctrine a name")
    if payload.icon_type_id and not ItemType.objects.filter(pk=payload.icon_type_id).exists():
        raise HttpError(400, "No such ship")
    d.name, d.description, d.icon_type_id = name, payload.description.strip()[:4000], payload.icon_type_id or None
    d.order, d.active = payload.order, payload.active
    with transaction.atomic():
        d.save()
        fits = [fid for fid in dict.fromkeys(payload.fits) if Fit.objects.filter(pk=fid).exists()]
        DoctrineFit.objects.filter(doctrine=d).exclude(fit_id__in=fits).delete()
        for order, fid in enumerate(fits):
            DoctrineFit.objects.update_or_create(doctrine=d, fit_id=fid, defaults={"order": order})


@router.post("/doctrines")
@require_perm("doctrines.manage_doctrines")
def create_doctrine(request, payload: DoctrineIn):
    d = Doctrine()
    _apply_doctrine(d, payload)
    record("doctrines.created", f"created the doctrine \"{d.name}\"", request=request, target=d)
    return services.doctrine_detail(d, request.user)


@router.put("/doctrines/{doctrine_id}")
@require_perm("doctrines.manage_doctrines")
def edit_doctrine(request, doctrine_id: int, payload: DoctrineIn):
    d = _doctrine(doctrine_id)
    _apply_doctrine(d, payload)
    record("doctrines.changed", f"changed the doctrine \"{d.name}\"", request=request, target=d)
    return services.doctrine_detail(d, request.user)


@router.delete("/doctrines/{doctrine_id}")
@require_perm("doctrines.manage_doctrines")
def delete_doctrine(request, doctrine_id: int):
    """Deletes the doctrine; its fits stay (they may be in other doctrines)."""
    d = _doctrine(doctrine_id)
    record("doctrines.deleted", f"deleted the doctrine \"{d.name}\"", request=request, target=d)
    d.delete()
    return {"ok": True}


# --- readiness -----------------------------------------------------------------------------------------------------


def _can_see_readiness(request):
    if not services.can_see_readiness(request.user):
        raise HttpError(403, "You do not have permission to do that")


@router.get("/doctrines/{doctrine_id}/readiness")
def readiness(request, doctrine_id: int):
    _can_see_readiness(request)
    return services.readiness(_doctrine(doctrine_id))


@router.get("/doctrines/{doctrine_id}/readiness.csv")
def readiness_csv(request, doctrine_id: int):
    _can_see_readiness(request)
    data = services.readiness(_doctrine(doctrine_id))
    resp = HttpResponse(content_type="text/csv; charset=utf-8")
    resp["Content-Disposition"] = f'attachment; filename="doctrine-{doctrine_id}-readiness.csv"'
    out = csv.writer(resp)
    out.writerow(["Member", *(f"{f['name']} ({f['ship']['name']})" for f in data["fits"]), "Fits they can fly"])
    for m in data["members"]:
        cells = []
        for f in data["fits"]:
            c = m["cells"][str(f["id"])]
            cells.append(f"{STATUS_WORDS[c['status']]} ({c['character']})" if c else "No characters")
        out.writerow([m["name"], *cells, m["flyable"]])
    return resp
