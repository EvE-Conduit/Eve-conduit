from django.conf import settings
from django.contrib.auth import login
from ninja import Router, Schema
from ninja.errors import HttpError

from conduit.audit.services import record
from conduit.permissions import require_perm
from conduit.site.compare import same_secret

from . import database, state

router = Router(tags=["core"])
admin_router = Router(tags=["admin"])


class LoginIn(Schema):
    username: str
    password: str


@router.post("/demo/login")
def demo_login(request, payload: LoginIn):
    """Sign in to the demo with its shared account. Only while demo mode is on, and only into the demo."""
    from conduit.accounts.models import User

    if not state.active():
        raise HttpError(404, "Demo mode is off")
    user = User.objects.filter(username=state.USERNAME, is_active=True).first()
    if not (user and same_secret(payload.username.strip().lower(), state.USERNAME) and user.check_password(payload.password)):
        raise HttpError(400, f"Use the username {state.USERNAME} and the password {state.PASSWORD}")
    login(request, user, backend=settings.AUTHENTICATION_BACKENDS[0])
    request.session[state.SESSION_KEY] = True
    return {"ok": True}


class DemoOut(Schema):
    enabled: bool
    #: The demo database is being built; visitors see "being set up" until it's ready.
    preparing: bool
    error: str = ""
    username: str = state.USERNAME
    password: str = state.PASSWORD


class DemoIn(Schema):
    enabled: bool


def demo_out() -> dict:
    return {"enabled": state.enabled(), "preparing": database.building(), "error": database.last_error()}


def _switch(on: bool):
    from conduit.site.models import SiteSettings

    SiteSettings.objects.using("default").filter(pk=1).update(demo_mode=on)


@admin_router.get("/demo", response=DemoOut)
@require_perm("site.manage_site")
def get_demo(request):
    return demo_out()


@admin_router.put("/demo", response=DemoOut)
@require_perm("site.manage_site")
def set_demo(request, payload: DemoIn):
    """Switch demo mode on or off. Switching on builds the demo database if it isn't there yet (a minute or so;
    visitors are asked to come back until it's ready). The real data isn't touched either way."""
    from conduit.site.models import SiteSettings

    if state.active():
        raise HttpError(403, "This is a demo: changes can't be saved")
    SiteSettings.load()  # the row the switch lives on
    if payload.enabled == state.enabled():
        return demo_out()
    _switch(payload.enabled)
    if payload.enabled:
        if not database.ready():
            database.build_in_background()
        record("site.demo_on", "switched demo mode on", request=request, target_type="site")
    else:
        record("site.demo_off", "switched demo mode off", request=request, target_type="site")
    return demo_out()
