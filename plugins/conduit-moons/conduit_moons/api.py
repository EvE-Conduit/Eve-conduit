"""Mounted at /api/p/moons/. Only reachable while the plugin is enabled."""

import csv
from decimal import Decimal

from django.http import HttpResponse
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.audit.services import record
from conduit.permissions import require_perm

from . import services
from .models import Invoice, MoonSettings

router = Router(tags=["moons"], auth=django_auth)


def _month(text: str | None):
    try:
        return services.parse_month(text)
    except services.LedgerError as exc:
        raise HttpError(400, str(exc)) from None


def _run(fn, *args):
    try:
        return fn(*args)
    except services.LedgerError as exc:
        raise HttpError(400, str(exc)) from None


def settings_out(s: MoonSettings) -> dict:
    return {"tax_rate": float(s.tax_rate), "corporations": s.corporations, "payment_instructions": s.payment_instructions}


@router.get("/months")
def months(request):
    return {"current": services.parse_month(None).strftime("%Y-%m"), "months": services.months()}


@router.get("/me")
def me(request, month: str = ""):
    """The signed-in member's own mining, and every month they owe tax for."""
    s = MoonSettings.load()
    invoices = Invoice.objects.filter(user=request.user).select_related("month")
    return {
        "ledger": services.ledger(_month(month), user=request.user),
        "invoices": [services.invoice_out(i) for i in invoices],
        "outstanding": float(sum((i.amount for i in invoices if not i.paid), Decimal(0))),
        "tax_rate": float(s.tax_rate),
        "payment_instructions": s.payment_instructions,
    }


@router.get("/ledger")
@require_perm("moons.view_ledger")
def ledger(request, month: str = ""):
    return services.ledger(_month(month))


@router.get("/ledger.csv")
@require_perm("moons.view_ledger")
def ledger_csv(request, month: str = ""):
    data = services.ledger(_month(month))
    resp = HttpResponse(content_type="text/csv; charset=utf-8")
    resp["Content-Disposition"] = f'attachment; filename="moon-mining-{data["month"]}.csv"'
    out = csv.writer(resp)
    out.writerow(["Member", "Character", "Registered", "Ore units", "Value (ISK)", f"Tax at {data['tax_rate']:g}% (ISK)", "Paid"])
    for m in data["members"]:
        for c in m["characters"]:
            out.writerow([m["name"], c["name"], "yes" if m["registered"] else "no", c["quantity"], round(c["value"]),
                          round(c["value"] * data["tax_rate"] / 100) if m["registered"] else "", ""])
        if m["invoice"]:
            out.writerow([m["name"], "(total owed)", "yes", m["quantity"], round(m["value"]), round(m["invoice"]["amount"]),
                          "yes" if m["invoice"]["paid"] else "no"])
    return resp


@router.get("/settings")
@require_perm("moons.view_ledger")
def get_settings(request):
    return {**settings_out(MoonSettings.load()), "available_corporations": services.corporations()}


class SettingsIn(Schema):
    tax_rate: float
    corporations: list[int] = []
    payment_instructions: str = ""


@router.put("/settings")
@require_perm("moons.manage_ledger")
def put_settings(request, payload: SettingsIn):
    if not 0 <= payload.tax_rate <= 100:
        raise HttpError(400, "The tax rate must be between 0 and 100 %")
    s = MoonSettings.load()
    s.tax_rate = Decimal(str(round(payload.tax_rate, 2)))
    s.corporations = sorted(set(payload.corporations))
    s.payment_instructions = payload.payment_instructions.strip()[:2000]
    s.save()
    record("moons.settings", f"set moon tax to {s.tax_rate}%", request=request, target_type="plugin", details={"plugin": "moons"})
    return {**settings_out(s), "available_corporations": services.corporations()}


@router.post("/months/{month}/close")
@require_perm("moons.manage_ledger")
def close_month(request, month: str):
    m = _month(month)
    _run(services.close_month, m, request.user)
    record("moons.close_month", f"closed moon mining for {services.label(m)}", request=request, target_type="plugin")
    return services.ledger(m)


@router.post("/months/{month}/reopen")
@require_perm("moons.manage_ledger")
def reopen_month(request, month: str):
    m = _month(month)
    _run(services.reopen_month, m)
    record("moons.reopen_month", f"reopened moon mining for {services.label(m)}", request=request, target_type="plugin")
    return services.ledger(m)


class PaidIn(Schema):
    paid: bool


@router.post("/invoices/{invoice_id}")
@require_perm("moons.manage_ledger")
def mark_paid(request, invoice_id: int, payload: PaidIn):
    inv = _run(services.set_paid, invoice_id, payload.paid, request.user)
    record("moons.payment", f"marked moon tax for {inv.month.month:%B %Y} as {'paid' if inv.paid else 'unpaid'}",
           request=request, target=inv.user, details={"amount": float(inv.amount)})
    return services.invoice_out(inv)
