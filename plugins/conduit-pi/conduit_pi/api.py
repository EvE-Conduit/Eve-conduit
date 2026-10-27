"""Mounted at /api/p/pi/. Only reachable while the plugin is enabled, and only by members.

Every member sees their own colonies. The corporation view needs pi.view_corp_pi and covers only the characters the
officer's character sheet access (``sheet.view_*``) lets them see, and opening it goes in the snooper log. Members' reminder settings are kept with the core
per-user plugin settings (``/api/me/preferences/plugins/pi``), so there are no settings routes here.
"""

from ninja import Router
from ninja.errors import HttpError
from ninja.security import django_auth

from . import services
from .services import PiError

router = Router(tags=["pi"], auth=django_auth)


@router.get("/me")
def me(request):
    return services.me(request.user)


@router.get("/upcoming")
def upcoming(request, limit: int = 5):
    return services.upcoming(request.user, limit=min(20, max(1, limit)))


@router.get("/corp")
def corp(request, idle_days: int = 3, corporation: int = 0):
    try:
        return services.corp_overview(request.user, idle_days=idle_days, corporation_id=corporation or None, request=request)
    except PiError as exc:
        raise HttpError(exc.status, str(exc)) from None
