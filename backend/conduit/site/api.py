import re
import secrets

from django.conf import settings
from django.contrib.auth import logout
from django.templatetags.static import static
from django.middleware.csrf import get_token
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth
from pydantic import field_validator

from conduit import __version__
from conduit.audit.services import record
from conduit.esi.tokens import sso_configured
from conduit.plugins import registry
from conduit.plugins.services import enabled_ids, sync_installed
from conduit.permissions import require_perm
from conduit.schemas import CharacterBrief, StateBrief, character_brief
from conduit.updates.services import progress as update_progress

from .models import SiteSettings

router = Router(tags=["core"])
setup_router = Router(tags=["setup"])
admin_router = Router(tags=["admin"])

HEX_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")


class SiteOut(Schema):
    name: str
    tagline: str
    accent: str
    logo_url: str
    version: str
    maintenance: dict
    django_admin: bool
    #: Newest available version, only for people who can install it.
    update_available: str | None = None
    #: Set while the updater is installing a release or plugins (the site restarts at the end).
    updating: dict | None = None


class SetupOut(Schema):
    completed: bool
    sso_configured: bool
    callback_url: str
    admin_claimed: bool


class UserOut(Schema):
    id: int
    name: str
    main: CharacterBrief | None
    state: StateBrief | None
    is_admin: bool
    permissions: list[str]
    unread_notifications: int
    preferences: dict
    #: Set while an admin is signed in as this user: who they really are.
    impersonated_by: dict | None
    leads_groups: bool
    pending_group_requests: int


class PluginEntry(Schema):
    id: str
    name: str
    version: str
    nav: list[dict]
    entry: str | None


class BootstrapOut(Schema):
    site: SiteOut
    setup: SetupOut
    user: UserOut | None
    plugins: list[PluginEntry]


def site_out(site: SiteSettings) -> dict:
    return {
        "name": site.name,
        "tagline": site.tagline,
        "accent": site.accent,
        "logo_url": site.logo_url,
        "version": __version__,
        "maintenance": {"enabled": site.maintenance_mode, "message": site.maintenance_message},
        "django_admin": settings.CONDUIT_DJANGO_ADMIN,
        "updating": update_progress(),
    }


def setup_out(site: SiteSettings) -> dict:
    from conduit.accounts.models import User

    return {
        "completed": site.setup_completed,
        "sso_configured": sso_configured(),
        "callback_url": settings.ESI_CALLBACK_URL,
        "admin_claimed": User.objects.filter(is_superuser=True).exists(),
    }


def user_out(user, request=None) -> dict | None:
    from conduit.accounts.api import preferences_out
    from conduit.accounts.models import UserPreferences
    from conduit.notify.services import unread_count

    from .impersonation import impersonator

    if not user.is_authenticated:
        return None
    main = user.main_character
    from conduit.access.groups import led_group_ids
    from conduit.access.models import GroupRequest

    real = impersonator(request) if request is not None else None
    led = led_group_ids(user)
    return {
        "leads_groups": bool(led),
        "pending_group_requests": GroupRequest.objects.filter(group_id__in=led, status="pending").count() if led else 0,
        "unread_notifications": unread_count(user),
        "preferences": preferences_out(UserPreferences.for_user(user)),
        "impersonated_by": {"id": real.pk, "name": real.display_name} if real else None,
        "id": user.pk,
        "name": user.display_name,
        "main": character_brief(main),
        "state": {"id": user.state.pk, "name": user.state.name, "color": user.state.color} if user.state else None,
        "is_admin": user.is_superuser,
        "permissions": sorted(user.get_all_permissions()),
    }


@router.get("/bootstrap", response=BootstrapOut)
def bootstrap(request):
    """Everything the web UI needs on first load. Also sets the CSRF cookie."""
    get_token(request)
    site = SiteSettings.load()
    on = enabled_ids()
    plugins = []
    if request.user.is_authenticated:
        for mid, mod in registry.installed().items():
            if mid in on:
                plugins.append(
                    {
                        "id": mid,
                        "name": mod.name,
                        "version": mod.version,
                        "nav": [vars(n) for n in mod.nav if not n.permission or request.user.has_perm(n.permission)],
                        "entry": static(mod.frontend) if mod.frontend else None,
                    }
                )
    out = {"site": site_out(site), "setup": setup_out(site), "user": user_out(request.user, request), "plugins": plugins}
    if request.user.is_authenticated and request.user.has_perm("site.manage_site"):
        from conduit.updates.services import newest_for_bootstrap

        out["site"]["update_available"] = newest_for_bootstrap()
    return out


@router.post("/logout", auth=django_auth)
def do_logout(request):
    from .impersonation import impersonator, stop

    if impersonator(request) is not None:
        stop(request)  # signing out while helping someone returns to your own account
        return {"ok": True, "impersonation_ended": True}
    record("auth.logout", "signed out", request=request)
    logout(request)
    return {"ok": True}


@router.post("/impersonate/stop", auth=django_auth)
def impersonate_stop(request):
    from .impersonation import stop

    if not stop(request):
        raise HttpError(400, "You are not signed in as someone else")
    return {"ok": True}


# --- first-run setup ---------------------------------------------------------


class ClaimIn(Schema):
    token: str


@setup_router.get("/status", response=SetupOut)
def setup_status(request):
    return setup_out(SiteSettings.load())


@setup_router.post("/claim", auth=django_auth)
def claim_admin(request, payload: ClaimIn):
    """The first person to present the setup token from the server logs becomes admin."""
    site = SiteSettings.load()
    if site.setup_completed:
        raise HttpError(400, "Setup is already complete")
    if not site.setup_token or not secrets.compare_digest(site.setup_token, payload.token.strip()):
        raise HttpError(403, "That setup code is not correct")
    request.user.is_superuser = True
    request.user.is_staff = True
    request.user.save(update_fields=["is_superuser", "is_staff"])
    record("setup.admin_claimed", "claimed the administrator role with the setup code", request=request)
    sync_installed()
    return {"ok": True}


@setup_router.post("/complete", auth=django_auth)
@require_perm("site.manage_site")
def complete_setup(request):
    site = SiteSettings.load()
    site.setup_completed = True
    site.setup_token = ""
    site.save(update_fields=["setup_completed", "setup_token"])
    record("setup.completed", "completed the first-run setup", request=request)
    return setup_out(site)


# --- admin: site settings ----------------------------------------------------


class SiteIn(Schema):
    name: str
    tagline: str = ""
    accent: str
    logo_url: str = ""
    maintenance_mode: bool = False
    maintenance_message: str = ""

    @field_validator("maintenance_message")
    @classmethod
    def _message(cls, v):
        v = v.strip()
        if len(v) > 300:
            raise ValueError("maintenance message must be at most 300 characters")
        return v

    @field_validator("name")
    @classmethod
    def _name(cls, v):
        v = v.strip()
        if not 1 <= len(v) <= 60:
            raise ValueError("name must be 1-60 characters")
        return v

    @field_validator("accent")
    @classmethod
    def _accent(cls, v):
        if not HEX_COLOR.match(v):
            raise ValueError("accent must be a colour like #22d3ee")
        return v.lower()

    @field_validator("logo_url")
    @classmethod
    def _logo(cls, v):
        if v and not v.startswith("https://"):
            raise ValueError("logo must be an https:// URL")
        return v


@admin_router.put("/site", response=SiteOut)
@require_perm("site.manage_site")
def update_site(request, payload: SiteIn):
    site = SiteSettings.load()
    changed = {f: v for f, v in payload.dict().items() if getattr(site, f) != v}
    for field, value in payload.dict().items():
        setattr(site, field, value)
    site.save()
    if changed:
        record("site.settings_changed", f"changed the site settings ({', '.join(changed)})", request=request,
               target_type="site", details=changed)
    return site_out(site)


# --- admin: impersonation --------------------------------------------------------


@admin_router.post("/impersonate/{user_id}")
def impersonate(request, user_id: int):
    """Sign in as another user to see the site as they do. Return with /api/core/impersonate/stop."""
    from conduit.accounts.models import User

    from .impersonation import can_impersonate, impersonator, start

    real = impersonator(request) or request.user
    target = User.objects.filter(pk=user_id).first()
    if target is None:
        raise HttpError(404, "User not found")
    problem = can_impersonate(real, target)
    if problem:
        raise HttpError(403, problem)
    start(request, target)
    return {"ok": True}
