"""Mounted at /api/p/tax/. Only reachable while the plugin is enabled."""

import csv
from decimal import Decimal

from django.http import HttpResponse
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.audit.services import record
from conduit.permissions import require_perm

from . import services
from .models import TAX_REF_TYPES, Invoice, TaxSettings

router = Router(tags=["tax"], auth=django_auth)


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


def _all_corporations(request, month=None):
    try:
        services.require_all_corporations(request.user, month)
    except services.LedgerError as exc:
        raise HttpError(403, str(exc)) from None


def _csv_row(cells) -> list[str]:
    """Spreadsheets run cells starting with = + - @ as formulas; quote those."""
    return ["'" + str(c) if str(c)[:1] in ("=", "+", "-", "@", "\t", "\r") else str(c) for c in cells]


def settings_out(s: TaxSettings) -> dict:
    return {
        "rate": float(s.rate), "minimum": float(s.minimum), "corporations": s.corporations, "ref_types": s.ref_types,
        "payment_instructions": s.payment_instructions, "payment_reason": s.payment_reason, "reminder_days": s.reminder_days,
    }


def _settings_page(request, s: TaxSettings) -> dict:
    return {
        **settings_out(s),
        "available_corporations": services.corporations(request.user),
        "available_ref_types": [{"value": k, "label": v} for k, v in TAX_REF_TYPES.items()],
    }


@router.get("/months")
def months(request):
    return {"current": services.parse_month(None).strftime("%Y-%m"), "months": services.months()}


@router.get("/me")
def me(request, month: str = ""):
    """The signed-in member's own tax, and every month they've been billed for."""
    s = TaxSettings.load()
    invoices = Invoice.objects.filter(user=request.user).select_related("month")
    return {
        "ledger": services.ledger(_month(month), user=request.user),
        "invoices": [services.invoice_out(i) for i in invoices],
        "outstanding": float(sum((i.amount for i in invoices if not i.paid), Decimal(0))),
        "rate": float(s.rate),
        "payment_instructions": s.payment_instructions,
        "payment_reason": s.payment_reason,
    }


@router.get("/ledger")
@require_perm("tax.view_ledger")
def ledger(request, month: str = ""):
    return services.ledger(_month(month), viewer=request.user)


@router.get("/ledger.csv")
@require_perm("tax.view_ledger")
def ledger_csv(request, month: str = ""):
    data = services.ledger(_month(month), viewer=request.user)
    resp = HttpResponse(content_type="text/csv; charset=utf-8")
    resp["Content-Disposition"] = f'attachment; filename="corp-tax-{data["month"]}.csv"'
    out = csv.writer(resp)
    out.writerow(_csv_row(["Member", "Character", "Registered", "Corporation took (ISK)", "Earned, estimated (ISK)",
                           f"Owed at {data['rate']:g}% (ISK)", "Paid"]))
    for m in data["members"]:
        for c in m["characters"]:
            out.writerow(_csv_row([m["name"], c["name"], "yes" if m["registered"] else "no", round(c["collected"]), round(c["earned"]), "", ""]))
        if m["invoice"]:
            out.writerow(_csv_row([m["name"], "(total owed)", "yes", round(m["collected"]), round(m["earned"]), round(m["invoice"]["amount"]),
                                   "yes" if m["invoice"]["paid"] else "no"]))
    return resp


@router.get("/settings")
@require_perm("tax.view_ledger")
def get_settings(request):
    return _settings_page(request, TaxSettings.load())


class SettingsIn(Schema):
    rate: float
    minimum: float = 0
    corporations: list[int] = []
    ref_types: list[str] = []
    payment_instructions: str = ""
    payment_reason: str = ""
    reminder_days: int = 7


@router.put("/settings")
@require_perm("tax.manage_ledger")
def put_settings(request, payload: SettingsIn):
    if not 0 <= payload.rate <= 1000:
        raise HttpError(400, "The rate must be between 0 and 1000 %")
    if payload.minimum < 0:
        raise HttpError(400, "The minimum can't be negative")
    if not 0 <= payload.reminder_days <= 365:
        raise HttpError(400, "Reminders must be between 0 and 365 days apart")
    unknown = set(payload.ref_types) - set(TAX_REF_TYPES)
    if unknown:
        raise HttpError(400, f"Unknown kinds of tax: {', '.join(sorted(unknown))}")
    _all_corporations(request)  # the settings apply to every corporation's members
    s = TaxSettings.load()
    s.rate = Decimal(str(round(payload.rate, 2)))
    s.minimum = Decimal(str(round(payload.minimum)))
    s.corporations = sorted(set(payload.corporations))
    s.ref_types = [k for k in TAX_REF_TYPES if k in payload.ref_types]
    s.payment_instructions = payload.payment_instructions.strip()[:2000]
    s.payment_reason = payload.payment_reason.strip()[:40]
    s.reminder_days = payload.reminder_days
    s.save()
    record("tax.settings", f"set corp tax to {s.rate}%", request=request, target_type="plugin", details={"plugin": "tax"})
    return _settings_page(request, s)


@router.post("/months/{month}/close")
@require_perm("tax.manage_ledger")
def close_month(request, month: str):
    m = _month(month)
    _all_corporations(request, m)
    _run(services.close_month, m, request.user)
    record("tax.close_month", f"closed corp tax for {services.label(m)}", request=request, target_type="plugin")
    return services.ledger(m, viewer=request.user)


@router.post("/months/{month}/reopen")
@require_perm("tax.manage_ledger")
def reopen_month(request, month: str):
    m = _month(month)
    _all_corporations(request, m)
    _run(services.reopen_month, m)
    record("tax.reopen_month", f"reopened corp tax for {services.label(m)}", request=request, target_type="plugin")
    return services.ledger(m, viewer=request.user)


class PaidIn(Schema):
    paid: bool


@router.post("/invoices/{invoice_id}")
@require_perm("tax.manage_ledger")
def mark_paid(request, invoice_id: int, payload: PaidIn):
    inv = _run(services.set_paid, invoice_id, payload.paid, request.user)
    record("tax.payment", f"marked corp tax for {inv.month.month:%B %Y} as {'paid' if inv.paid else 'unpaid'}",
           request=request, target=inv.user, details={"amount": float(inv.amount)})
    return services.invoice_out(inv)


@router.post("/payments/match")
@require_perm("tax.manage_ledger")
def match_payments(request):
    """Look for payments in the wallet journals now instead of waiting for the daily run."""
    return {"found": services.match_payments()}
