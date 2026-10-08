"""Mounted at /api/p/srp/. Only reachable while the plugin is enabled."""

import csv
from decimal import Decimal

from django.db.models import Sum
from django.http import HttpResponse
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth
from pydantic import Field

from conduit.audit.services import record
from conduit.permissions import require_perm

from . import services
from .models import ShipRule, SrpRequest, SrpSettings

router = Router(tags=["srp"], auth=django_auth)


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except services.SrpError as exc:
        raise HttpError(exc.status, str(exc)) from None


def _request(pk: int) -> SrpRequest:
    req = services.base_queryset().filter(pk=pk).first()
    if req is None:
        raise HttpError(404, "No such request")
    return req


def settings_out(s: SrpSettings) -> dict:
    return {
        "default_percent": float(s.default_percent),
        "covered_only": s.covered_only,
        "max_age_days": s.max_age_days,
        "require_fleet": s.require_fleet,
        "corporations": s.corporations,
        "rules_text": s.rules_text,
    }


# --- members ---------------------------------------------------------------------------------------------------


@router.get("/me")
def me(request):
    """The signed-in member's claimable losses and their requests."""
    mine = list(services.base_queryset().filter(user=request.user)[:200])
    totals = SrpRequest.objects.filter(user=request.user)
    return {
        "settings": settings_out(SrpSettings.load()),
        "losses": services.claimable(request.user),
        "requests": services.requests_out(mine),
        "totals": {
            "pending": totals.filter(status="pending").count(),
            "approved": float(totals.filter(status="approved").aggregate(s=Sum("payout"))["s"] or 0),
            "paid": float(totals.filter(status="paid").aggregate(s=Sum("payout"))["s"] or 0),
        },
    }


class ClaimIn(Schema):
    killmail_id: int | None = None
    link: str = Field("", max_length=500)
    fleet: str = ""
    fc: str = ""
    notes: str = ""


@router.post("/requests")
def create_request(request, payload: ClaimIn):
    if not payload.killmail_id and not payload.link.strip():
        raise HttpError(400, "Pick a loss or paste its kill link")
    req = _run(services.submit, request.user, killmail_id=payload.killmail_id, link=payload.link.strip(),
               fleet=payload.fleet, fc=payload.fc, notes=payload.notes)
    return services.detail(_request(req.pk))


@router.get("/requests/{request_id}")
def get_request(request, request_id: int):
    req = _request(request_id)
    if req.user_id != request.user.pk and not services.can_review(request.user):
        raise HttpError(404, "No such request")
    return {**services.detail(req), "can_review": request.user.has_perm("srp.review_requests"),
            "can_pay": request.user.has_perm("srp.pay_requests"), "mine": req.user_id == request.user.pk}


@router.delete("/requests/{request_id}")
def withdraw(request, request_id: int):
    _run(services.withdraw, _request(request_id), request.user)
    return {"ok": True}


# --- reviewers ---------------------------------------------------------------------------------------------------


@router.get("/queue")
def queue(request, status: str = "pending", q: str = ""):
    if not services.can_review(request.user):
        raise HttpError(403, "You can't review SRP requests")
    if status not in (*SrpRequest.Status.values, "all"):
        raise HttpError(400, "Unknown status")
    return services.queue(status, q.strip())


def _csv_row(cells) -> list[str]:
    """Spreadsheets run cells starting with = + - @ as formulas; the fleet is text members type, so quote those."""
    return ["'" + str(c) if str(c)[:1] in ("=", "+", "-", "@", "\t", "\r") else str(c) for c in cells]


@router.get("/queue.csv")
@require_perm("srp.pay_requests")
def payouts_csv(request):
    """Approved requests waiting for payment, for whoever sends the ISK."""
    reqs = services.requests_out(list(services.base_queryset().filter(status="approved").order_by("user_id", "created_at")))
    resp = HttpResponse(content_type="text/csv; charset=utf-8")
    resp["Content-Disposition"] = 'attachment; filename="srp-payouts.csv"'
    out = csv.writer(resp)
    out.writerow(["Request", "Member", "Pay to", "Ship", "Lost", "Fleet", "Payout (ISK)"])
    for r in reqs:
        out.writerow(_csv_row([r["id"], r["user"]["name"], r["character"]["name"], r["ship"]["name"], r["time"][:16].replace("T", " "),
                               r["fleet"], round(r["payout"] or 0)]))
    return resp


class DecideIn(Schema):
    decision: str  # approve, reject, reopen
    payout: float | None = None
    note: str = ""


@router.post("/requests/{request_id}/decide")
@require_perm("srp.review_requests")
def decide(request, request_id: int, payload: DecideIn):
    req = _request(request_id)
    if payload.decision == "approve":
        req = _run(services.approve, req, request.user, payload.payout, payload.note)
        record("srp.approve", f"approved SRP for {req.character_name} ({req.payout:,.0f} ISK)", request=request, target=req.user,
               details={"request_id": req.pk, "payout": float(req.payout)})
    elif payload.decision == "reject":
        req = _run(services.reject, req, request.user, payload.note)
        record("srp.reject", f"rejected SRP for {req.character_name}", request=request, target=req.user, details={"request_id": req.pk})
    elif payload.decision == "reopen":
        req = _run(services.reopen, req, request.user)
        record("srp.reopen", f"reopened SRP for {req.character_name}", request=request, target=req.user, details={"request_id": req.pk})
    else:
        raise HttpError(400, "Unknown decision")
    return get_request(request, request_id)


class PaidIn(Schema):
    ids: list[int]


@router.post("/paid")
@require_perm("srp.pay_requests")
def mark_paid(request, payload: PaidIn):
    reqs, own = services.mark_paid(payload.ids[:1000], request.user)
    if reqs:
        total = sum((r.payout for r in reqs), Decimal(0))
        record("srp.paid", f"marked {len(reqs)} SRP request{'s' if len(reqs) != 1 else ''} paid ({total:,.0f} ISK)", request=request,
               target_type="plugin", details={"plugin": "srp", "ids": [r.pk for r in reqs]})
    return {"paid": len(reqs), "skipped_own": len(own)}


# --- settings and rules ------------------------------------------------------------------------------------------


@router.get("/settings")
def get_settings(request):
    if not services.can_review(request.user) and not request.user.has_perm("srp.manage_srp"):
        raise HttpError(403, "You can't see the SRP settings")
    return {
        **settings_out(SrpSettings.load()),
        "rules": [services.rule_out(r) for r in ShipRule.objects.all()],
        "available_corporations": services.corporations(),
    }


class SettingsIn(Schema):
    default_percent: float
    covered_only: bool = False
    max_age_days: int = 30
    require_fleet: bool = True
    corporations: list[int] = []
    rules_text: str = ""


@router.put("/settings")
@require_perm("srp.manage_srp")
def put_settings(request, payload: SettingsIn):
    if not 0 <= payload.default_percent <= 1000:
        raise HttpError(400, "The percentage must be between 0 and 1000")
    if not 1 <= payload.max_age_days <= 365:
        raise HttpError(400, "Claims can be allowed for 1 to 365 days")
    s = SrpSettings.load()
    s.default_percent = Decimal(str(round(payload.default_percent, 2)))
    s.covered_only = payload.covered_only
    s.max_age_days = payload.max_age_days
    s.require_fleet = payload.require_fleet
    s.corporations = sorted(set(payload.corporations))
    s.rules_text = payload.rules_text.strip()[:4000]
    s.save()
    record("srp.settings", "changed the SRP settings", request=request, target_type="plugin", details={"plugin": "srp"})
    return get_settings(request)


@router.get("/ships")
@require_perm("srp.manage_srp")
def ships(request, q: str = ""):
    return services.ship_search(q)


class RuleIn(Schema):
    type_id: int | None = None
    group_id: int | None = None
    covered: bool = True
    payout: float | None = None
    percent: float | None = None
    note: str = ""


@router.post("/rules")
@require_perm("srp.manage_srp")
def create_rule(request, payload: RuleIn):
    rule = _run(services.save_rule, rule_id=None, **payload.model_dump())
    record("srp.rule", f"added an SRP rule for {rule.name}", request=request, target_type="plugin", details={"plugin": "srp"})
    return services.rule_out(rule)


@router.put("/rules/{rule_id}")
@require_perm("srp.manage_srp")
def update_rule(request, rule_id: int, payload: RuleIn):
    rule = _run(services.save_rule, rule_id=rule_id, **payload.model_dump())
    record("srp.rule", f"changed the SRP rule for {rule.name}", request=request, target_type="plugin", details={"plugin": "srp"})
    return services.rule_out(rule)


@router.delete("/rules/{rule_id}")
@require_perm("srp.manage_srp")
def delete_rule(request, rule_id: int):
    rule = ShipRule.objects.filter(pk=rule_id).first()
    if rule is None:
        raise HttpError(404, "No such rule")
    rule.delete()
    record("srp.rule", f"removed the SRP rule for {rule.name}", request=request, target_type="plugin", details={"plugin": "srp"})
    return {"ok": True}
