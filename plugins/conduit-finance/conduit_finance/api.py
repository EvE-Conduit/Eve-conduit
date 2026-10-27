"""Mounted at /api/p/finance/. Only reachable while the plugin is enabled, and by members (``members_only``).

Everything needs finance.view_finance and then shows only corporations whose wallets the person may see on the
corporation sheet; the settings need finance.manage_finance.
"""

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.permissions import require_perm

from . import services
from .models import CounterpartyRule
from .services import MANAGE_PERM, VIEW_PERM, FinanceError

router = Router(tags=["finance"], auth=django_auth)


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except FinanceError as exc:
        raise HttpError(exc.status, str(exc)) from None


def _month(text: str | None):
    return _run(services.parse_month, text)


def _internal(text: str) -> bool | None:
    return {"yes": True, "no": False}.get(text)


# --- viewing ----------------------------------------------------------------------------------------------------------


@router.get("/months")
@require_perm(VIEW_PERM)
def months(request):
    return {"current": services.parse_month(None).strftime("%Y-%m"), "months": services.months_with_data(request.user),
            "corporations": services.corporations_out(services.visible_corporations(request.user)),
            "can_manage": request.user.has_perm(MANAGE_PERM)}


@router.get("/overview")
@require_perm(VIEW_PERM)
def overview(request, corporation: int | None = None, months: int = 12):
    return _run(services.overview, request.user, corporation, months)


@router.get("/summary")
@require_perm(VIEW_PERM)
def summary(request):
    return services.summary(request.user)


@router.get("/report")
@require_perm(VIEW_PERM)
def report(request, month: str = "", corporation: int | None = None):
    return _run(services.report, request.user, _month(month), corporation)


@router.get("/balances")
@require_perm(VIEW_PERM)
def balances(request, corporation: int | None = None, days: int = 180):
    return _run(services.balances, request.user, corporation, days)


@router.get("/journal")
@require_perm(VIEW_PERM)
def journal(request, month: str = "", corporation: int | None = None, category: str = "", internal: str = "", q: str = ""):
    return _run(services.journal, request.user, _month(month), corporation, category, _internal(internal), q.strip()[:100])


@router.get("/journal.csv")
@require_perm(VIEW_PERM)
def journal_csv(request, month: str = "", corporation: int | None = None, category: str = "", internal: str = "", q: str = ""):
    m = _month(month)
    body = _run(services.journal_csv, request.user, m, corporation, category, _internal(internal), q.strip()[:100])
    resp = HttpResponse(body, content_type="text/csv; charset=utf-8")
    resp["Content-Disposition"] = f'attachment; filename="corp-finance-{m:%Y-%m}.csv"'
    return resp


# --- settings ---------------------------------------------------------------------------------------------------------


@router.get("/settings")
@require_perm(MANAGE_PERM)
def get_settings(request):
    return services.settings_out(request.user)


class SettingsIn(Schema):
    corporations: list[int] = []
    report_group: int | None = None


@router.put("/settings")
@require_perm(MANAGE_PERM)
def put_settings(request, payload: SettingsIn):
    _run(services.save_settings, payload.dict(), request.user, request=request)
    return services.settings_out(request.user)


class OverrideIn(Schema):
    category: str = ""


@router.put("/categories/{ref_type}")
@require_perm(MANAGE_PERM)
def put_category(request, ref_type: str, payload: OverrideIn):
    _run(services.set_override, ref_type, payload.category, request.user, request=request)
    return {"ok": True}


@router.get("/parties")
@require_perm(MANAGE_PERM)
def parties(request, q: str = ""):
    return services.search_parties(q)


class RuleIn(Schema):
    party_id: int
    party_name: str = ""
    direction: str = "both"
    category: str
    corporation_id: int | None = None
    note: str = ""


@router.post("/rules")
@require_perm(MANAGE_PERM)
def create_rule(request, payload: RuleIn):
    return services.rule_out(_run(services.save_rule, None, payload.dict(), request.user, request=request))


@router.put("/rules/{rule_id}")
@require_perm(MANAGE_PERM)
def update_rule(request, rule_id: int, payload: RuleIn):
    rule = get_object_or_404(CounterpartyRule, pk=rule_id)
    return services.rule_out(_run(services.save_rule, rule, payload.dict(), request.user, request=request))


@router.delete("/rules/{rule_id}")
@require_perm(MANAGE_PERM)
def delete_rule(request, rule_id: int):
    _run(services.delete_rule, get_object_or_404(CounterpartyRule, pk=rule_id), request.user, request=request)
    return {"ok": True}
