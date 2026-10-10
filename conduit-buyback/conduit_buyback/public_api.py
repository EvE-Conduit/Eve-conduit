"""Mounted at /api/public/p/buyback/ for everyone, signed in or not. Only programs marked public show up here.

Quotes made here never belong to an account (even when the visitor is signed in), so another site can't make
quotes in a member's name.
"""

from django.core.cache import cache
from ninja import Router, Schema
from ninja.errors import HttpError
from pydantic import Field

from conduit.audit.services import client_ip

from . import services
from .models import Program, Quote

router = Router(tags=["buyback (public)"])
#: Quotes per visitor (by IP address) in ``WINDOW`` seconds.
QUOTE_LIMIT = 30
WINDOW = 600


def _public(program_id: int) -> Program:
    p = Program.objects.filter(pk=program_id, public=True, active=True).select_related("owner__corporation").first()
    if p is None:
        raise HttpError(404, "No such program")
    return p


@router.get("/programs")
def programs(request):
    qs = Program.objects.filter(public=True, active=True).select_related("owner__corporation").prefetch_related("locations", "item_rules")
    return {"programs": [services.program_out(p) for p in qs], "prices": services.prices_out()}


@router.get("/programs/{program_id}")
def program(request, program_id: int):
    return {**services.program_out(_public(program_id)), "prices": services.prices_out()}


class QuoteIn(Schema):
    text: str = Field(max_length=200_000)


def _count(request) -> None:
    key = f"buyback:public-quotes:{client_ip(request) or 'unknown'}"
    cache.add(key, 0, timeout=WINDOW)
    try:
        used = cache.incr(key)
    except ValueError:  # expired between add and incr
        cache.set(key, 1, timeout=WINDOW)
        used = 1
    if used > QUOTE_LIMIT:
        raise HttpError(429, "Too many quotes; wait a few minutes")


@router.post("/programs/{program_id}/quote")
def make_quote(request, program_id: int, payload: QuoteIn):
    p = _public(program_id)
    _count(request)
    try:
        return services.quote(p, payload.text, user=None, public=True)
    except services.BuybackError as exc:
        raise HttpError(exc.status, str(exc)) from None


@router.get("/quotes/{tracking_number}")
def get_quote(request, tracking_number: str):
    """A public quote, for whoever has its tracking number. Contracts show only their state, not who made them."""
    q = Quote.objects.select_related("program__owner__corporation").filter(tracking_number=tracking_number.lower(), public=True).first()
    if q is None:
        raise HttpError(404, "No such quote")
    latest = q.contracts.first()
    return {
        **services.quote_out(q, with_lines=True),
        "contract": {"status": latest.status, "status_label": services.STATUS_LABELS.get(latest.status, latest.status)} if latest else None,
    }
