"""Mounted at /api/public/p/freight/ for everyone, signed in or not. Only services marked public show up here.

Quotes store nothing, so there's nothing here for a stranger to fill up.
"""

from ninja import Router, Schema
from ninja.errors import HttpError

from . import services
from .models import Service

router = Router(tags=["freight (public)"])


def _public(service_id: int) -> Service:
    s = Service.objects.filter(pk=service_id, public=True, active=True).select_related("owner__corporation").first()
    if s is None:
        raise HttpError(404, "No such service")
    return s


@router.get("/services")
def list_services(request):
    qs = Service.objects.filter(public=True, active=True).select_related("owner__corporation")
    return {"services": [services.service_out(s) for s in qs]}


@router.get("/services/{service_id}")
def service(request, service_id: int):
    return services.service_out(_public(service_id))


class QuoteIn(Schema):
    route_id: int
    volume: float
    collateral: float = 0


@router.post("/services/{service_id}/quote")
def make_quote(request, service_id: int, payload: QuoteIn):
    try:
        return services.quote(_public(service_id), payload.route_id, payload.volume, payload.collateral)
    except services.FreightError as exc:
        raise HttpError(exc.status, str(exc)) from None
