"""Mounted at /api/p/leaderboard/. Only reachable while the plugin is enabled."""

from datetime import date

from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.audit.services import record
from conduit.permissions import require_perm

from . import services
from .models import LeaderboardSettings

router = Router(tags=["leaderboard"], auth=django_auth)


def _period(text: str | None) -> services.Period:
    try:
        return services.parse_period(text)
    except services.LeaderboardError as exc:
        raise HttpError(400, str(exc)) from None


def _category(key: str) -> services.Category:
    try:
        return services.get_category(key)
    except services.LeaderboardError as exc:
        raise HttpError(404, str(exc)) from None


@router.get("/periods")
def periods(request):
    return {
        "current": services.parse_period(None).key,
        "periods": services.periods(),
        "corporations": services.corporations(),
        "categories": [services.category_out(c) for c in services.enabled_categories()],
    }


@router.get("/overview")
def overview(request, period: str = "", corporation: int | None = None):
    return services.overview(_period(period), request.user, corporation)


@router.get("/board/{category}")
def board(request, category: str, period: str = "", corporation: int | None = None):
    return services.board(_category(category), _period(period), request.user, corporation)


@router.get("/me")
def me(request):
    """The signed-in member's ranks this month and medals, for the dashboard."""
    return services.my_ranks(request.user)


class HiddenIn(Schema):
    hidden: bool


@router.put("/me/hidden")
def set_hidden(request, payload: HiddenIn):
    services.set_hidden(request.user, payload.hidden)
    return {"hidden": payload.hidden}


@router.get("/medals")
def medals(request, user: int | None = None):
    """Every medal handed out (or one member's), and who has the most."""
    from conduit.accounts.models import User

    target = None
    if user is not None:
        target = User.objects.filter(pk=user).first()
        if target is None:
            raise HttpError(404, "No such member")
    return {"awards": services.awards(target), "hall_of_fame": services.hall_of_fame(), "mine": services.medal_counts(request.user)}


# --- settings (leaderboard.manage_leaderboard) --------------------------------------------------------------


def settings_out(s: LeaderboardSettings) -> dict:
    return {
        "categories": s.categories,
        "corporations": s.corporations,
        "show_characters": s.show_characters,
        "places": s.places,
        "medals": s.medals,
        "available_categories": [{**services.category_out(c), "available": c.available()} for c in services.CATEGORIES.values()],
        "available_corporations": services.all_corporations(),
    }


@router.get("/settings")
@require_perm("leaderboard.manage_leaderboard")
def get_settings(request):
    return settings_out(LeaderboardSettings.load())


class SettingsIn(Schema):
    categories: list[str] = []
    corporations: list[int] = []
    show_characters: bool = True
    places: int = 25
    medals: bool = True


@router.put("/settings")
@require_perm("leaderboard.manage_leaderboard")
def put_settings(request, payload: SettingsIn):
    unknown = [k for k in payload.categories if k not in services.CATEGORIES]
    if unknown:
        raise HttpError(400, f"Unknown category: {', '.join(unknown)}")
    if not 3 <= payload.places <= 200:
        raise HttpError(400, "Show between 3 and 200 places")
    s = LeaderboardSettings.load()
    s.categories = [k for k in services.CATEGORIES if k in payload.categories]  # keep the standard order
    s.corporations = sorted(set(payload.corporations))
    s.show_characters = payload.show_characters
    s.places = payload.places
    s.medals = payload.medals
    s.save()
    services.bump()
    record("leaderboard.settings", "changed the leaderboard settings", request=request, target_type="plugin", details={"plugin": "leaderboard"})
    return settings_out(s)


@router.post("/medals/{month}/award")
@require_perm("leaderboard.manage_leaderboard")
def award_month(request, month: str):
    """Hand out a finished month's medals now instead of waiting for the daily job."""
    p = _period(month)
    if p.all_time:
        raise HttpError(400, "Pick a month")
    try:
        made = services.award_month(date(p.start.year, p.start.month, 1))
    except services.LeaderboardError as exc:
        raise HttpError(400, str(exc)) from None
    record("leaderboard.award", f"awarded the medals for {p.label}", request=request, target_type="plugin", details={"medals": len(made)})
    return {"awarded": len(made), "awards": services.awards()}
