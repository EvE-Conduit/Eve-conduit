"""Mounted at /api/p/secretsanta/. Only reachable while the plugin is enabled.

Members see the events open to them and the ones they're in, and only their own giftee. Everything that runs an event
needs secretsanta.organise_events; organisers see progress, and the pairings only through /reveal, which is audited.
"""

from datetime import datetime

from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.permissions import require_perm

from . import services
from .services import ORGANISE_PERM, SantaError

router = Router(tags=["secretsanta"], auth=django_auth)


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except SantaError as exc:
        raise HttpError(exc.status, str(exc)) from None


def _event(request, event_id: int):
    return _run(services.get_event, request.user, event_id)


def _detail(request, event_id: int):
    return services.detail(_event(request, event_id), request.user)


@router.get("/events")
def events(request):
    return services.list_events(request.user)


@router.get("/widget")
def widget(request):
    """The viewer's current event and who they give to, or an event they can still join."""
    return services.widget(request.user)


@router.get("/events/{event_id}")
def event(request, event_id: int):
    return _detail(request, event_id)


# --- taking part ---------------------------------------------------------------------------------------------------


class SignUpIn(Schema):
    #: Left out, the main character.
    character_id: int | None = None
    wishlist: str = ""


@router.put("/events/{event_id}/me")
def sign_up(request, event_id: int, payload: SignUpIn):
    """Join, or change the receiving character and wish list."""
    _run(services.sign_up, _event(request, event_id), request.user, payload.character_id, payload.wishlist)
    return _detail(request, event_id)


@router.delete("/events/{event_id}/me")
def withdraw(request, event_id: int):
    _run(services.withdraw, _event(request, event_id), request.user)
    return _detail(request, event_id)


class SentIn(Schema):
    note: str = ""


@router.post("/events/{event_id}/sent")
def sent(request, event_id: int, payload: SentIn):
    _run(services.mark_sent, _event(request, event_id), request.user, payload.note)
    return _detail(request, event_id)


@router.delete("/events/{event_id}/sent")
def unsent(request, event_id: int):
    _run(services.unmark_sent, _event(request, event_id), request.user)
    return _detail(request, event_id)


class ReceivedIn(Schema):
    thanks: str = ""


@router.post("/events/{event_id}/received")
def received(request, event_id: int, payload: ReceivedIn):
    """The viewer got their gift; the thank-you reaches whoever sent it without naming them."""
    _run(services.mark_received, _event(request, event_id), request.user, payload.thanks)
    return _detail(request, event_id)


# --- organising ----------------------------------------------------------------------------------------------------


@router.get("/audience")
@require_perm(ORGANISE_PERM)
def audience(request):
    return services.audience()


class EventIn(Schema):
    name: str
    description: str = ""
    notes: str = ""
    signup_closes_at: datetime
    gift_deadline: datetime
    budget_isk: int | None = None
    states: list[int] = []
    groups: list[int] = []
    #: Only when creating: tell everyone who may join.
    announce: bool = False


@router.post("/events")
@require_perm(ORGANISE_PERM)
def create(request, payload: EventIn):
    e = _run(services.save_event, None, request.user, **payload.model_dump(), request=request)
    return services.detail(e, request.user)


@router.put("/events/{event_id}")
@require_perm(ORGANISE_PERM)
def update(request, event_id: int, payload: EventIn):
    data = payload.model_dump()
    data.pop("announce")
    e = _run(services.save_event, _event(request, event_id), request.user, **data, request=request)
    return services.detail(e, request.user)


@router.delete("/events/{event_id}")
@require_perm(ORGANISE_PERM)
def delete(request, event_id: int):
    services.delete_event(_event(request, event_id), request=request)
    return {"ok": True}


class ExclusionIn(Schema):
    first: int
    second: int


@router.post("/events/{event_id}/exclusions")
@require_perm(ORGANISE_PERM)
def add_exclusion(request, event_id: int, payload: ExclusionIn):
    """Keep two participants from drawing each other. A draw that hasn't been sent is thrown away."""
    _run(services.add_exclusion, _event(request, event_id), payload.first, payload.second, request=request)
    return _detail(request, event_id)


@router.delete("/events/{event_id}/exclusions/{exclusion_id}")
@require_perm(ORGANISE_PERM)
def remove_exclusion(request, event_id: int, exclusion_id: int):
    _run(services.remove_exclusion, _event(request, event_id), exclusion_id, request=request)
    return _detail(request, event_id)


@router.post("/events/{event_id}/draw")
@require_perm(ORGANISE_PERM)
def draw(request, event_id: int):
    """Draw, or draw again until the results are sent. The answer never holds the pairings."""
    _run(services.run_draw, _event(request, event_id), request=request)
    return _detail(request, event_id)


@router.post("/events/{event_id}/publish")
@require_perm(ORGANISE_PERM)
def publish(request, event_id: int):
    """Tell everyone who they give to. The draw is fixed from here on."""
    _run(services.publish, _event(request, event_id), request=request)
    return _detail(request, event_id)


@router.post("/events/{event_id}/reveal")
@require_perm(ORGANISE_PERM)
def reveal(request, event_id: int):
    """Every pair, for the organiser asking. Each look is in the audit log."""
    return {"pairs": _run(services.reveal_pairs, _event(request, event_id), request=request)}


@router.delete("/events/{event_id}/participants/{participant_id}")
@require_perm(ORGANISE_PERM)
def remove(request, event_id: int, participant_id: int):
    """Take someone out. After the draw, whoever gave to them gets their giftee."""
    _run(services.remove_participant, _event(request, event_id), participant_id, request=request)
    return _detail(request, event_id)


@router.post("/events/{event_id}/end")
@require_perm(ORGANISE_PERM)
def end(request, event_id: int):
    _run(services.end, _event(request, event_id), request=request)
    return _detail(request, event_id)


class RevealAllIn(Schema):
    on: bool


@router.put("/events/{event_id}/reveal-all")
@require_perm(ORGANISE_PERM)
def reveal_all(request, event_id: int, payload: RevealAllIn):
    """After the end: show every pair to the participants, or hide them again."""
    _run(services.set_reveal_all, _event(request, event_id), payload.on, request=request)
    return _detail(request, event_id)
