import re
import secrets
import uuid

from django.conf import settings
from django.contrib.auth import logout
from django.http import HttpResponse, HttpResponseNotModified
from django.templatetags.static import static
from django.middleware.csrf import get_token
from ninja import File, Router, Schema
from ninja.files import UploadedFile
from ninja.errors import HttpError
from ninja.security import django_auth
from pydantic import Field, field_validator

from conduit import __version__
from conduit.audit.services import record
from conduit.esi.tokens import sso_configured
from conduit.plugins import registry
from conduit.plugins.services import can_use, is_enabled, sync_installed
from conduit.permissions import require_perm
from conduit.schemas import CharacterBrief, StateBrief, character_brief
from conduit.updates.services import progress as update_progress

from .landing import DEFAULT_LANDING, ICONS, LandingIn, _link, landing_content
from . import images
from .models import SiteImage, SiteSettings

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
    #: Where people land after signing in ("" = the dashboard).
    start_page: str = ""
    #: Extra sidebar links admins added ({label, url, icon}); only sent to people who are signed in.
    nav_links: list[dict] = []
    nav_links_title: str = "Links"
    #: Newest available version, only for people who can install it.
    update_available: str | None = None
    #: Set while the updater is installing a release or plugins (the site restarts at the end).
    updating: dict | None = None
    #: An install that's waiting for the updater to pick it up; only for people who can manage the site.
    update_pending: dict | None = None


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
    #: The super admin, who claimed the site; always an administrator.
    is_owner: bool = False
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
    #: Not usable by this visitor except for its public pages.
    public_only: bool = False


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
        "start_page": site.start_page,
        "nav_links": site.nav_links,
        "nav_links_title": site.nav_links_title,
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
        "is_owner": user.pk == SiteSettings.load().owner_id,
        "permissions": sorted(user.get_all_permissions()),
    }


@router.get("/bootstrap", response=BootstrapOut)
def bootstrap(request):
    """Everything the web UI needs on first load. Also sets the CSRF cookie."""
    get_token(request)
    site = SiteSettings.load()
    plugins = []
    for mid, mod in registry.installed().items():
        if request.user.is_authenticated and can_use(request.user, mid):
            nav, public_only = [vars(n) for n in mod.nav if not n.permission or request.user.has_perm(n.permission)], False
        elif mod.public_pages and mod.frontend and is_enabled(mid):
            nav, public_only = [], True  # signed out or not a member: only its public pages
        else:
            continue
        plugins.append(
            {
                "id": mid,
                "name": mod.name,
                "version": mod.version,
                "nav": nav,
                # The version in the URL makes browsers fetch a plugin's new bundle after an update
                # (static files keep their name and may be cached for days).
                "entry": f"{static(mod.frontend)}?v={mod.version}" if mod.frontend else None,
                "public_only": public_only,
            }
        )
    out = {"site": site_out(site), "setup": setup_out(site), "user": user_out(request.user, request), "plugins": plugins}
    if not request.user.is_authenticated:
        # Sidebar links may point at members-only places (a Discord invite, the wiki); keep them off the login page.
        out["site"]["nav_links"] = []
    if request.user.is_authenticated and request.user.has_perm("site.manage_site"):
        from conduit.updates.services import newest_for_bootstrap, pending_for_bootstrap

        out["site"]["update_available"] = newest_for_bootstrap()
        out["site"]["update_pending"] = pending_for_bootstrap()
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
    if site.owner_id is None:
        site.owner = request.user
        site.save(update_fields=["owner"])
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


class NavLinkIn(Schema):
    label: str = Field(..., min_length=1, max_length=40)
    url: str = Field(..., min_length=1, max_length=500)
    icon: str = "globe"

    @field_validator("label")
    @classmethod
    def _label(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("every link needs a label")
        return v

    @field_validator("url")
    @classmethod
    def _url(cls, v):
        if not _link(v):
            raise ValueError("every link needs an address")
        return _link(v)

    @field_validator("icon")
    @classmethod
    def _icon(cls, v):
        return v if v in ICONS else "globe"


class SiteIn(Schema):
    name: str
    tagline: str = ""
    accent: str
    logo_url: str = ""
    maintenance_mode: bool = False
    maintenance_message: str = ""
    start_page: str = ""
    nav_links: list[NavLinkIn] = Field(default_factory=list, max_length=20)
    nav_links_title: str = "Links"

    @field_validator("nav_links")
    @classmethod
    def _nav_links(cls, v):
        urls = [link.url for link in v]
        if len(set(urls)) != len(urls):
            raise ValueError("each sidebar link needs its own address")
        return v

    @field_validator("nav_links_title")
    @classmethod
    def _nav_links_title(cls, v):
        v = v.strip() or "Links"
        if len(v) > 40:
            raise ValueError("the sidebar links heading must be at most 40 characters")
        return v

    @field_validator("start_page")
    @classmethod
    def _start_page(cls, v):
        v = v.strip()
        if v in ("", "/"):
            return ""
        if not v.startswith("/") or v.startswith("//") or "\\" in v or len(v) > 200:
            raise ValueError("the start page must be a page on this site, like /p/news")
        return v

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


# --- admin: administrators ------------------------------------------------------
# Administrators have every permission, so only an administrator can see, add or remove them.


def _require_admin(request):
    if not request.user.is_superuser:
        raise HttpError(403, "Only administrators can change who is an administrator")


def _admin_out(u, request) -> dict:
    return {
        "id": u.pk,
        "name": u.display_name,
        "main": character_brief(u.main_character),
        "is_you": u.pk == request.user.pk,
        "is_owner": u.pk == SiteSettings.load().owner_id,
        "last_login": u.last_login.isoformat() if u.last_login else None,
    }


# --- landing page ---------------------------------------------------------------


def landing_out(site: SiteSettings) -> dict:
    return {"content": landing_content(site), "is_default": not site.landing, "default": DEFAULT_LANDING}


@router.get("/landing", auth=django_auth)
def landing(request):
    """The landing page everyone sees at /home."""
    return landing_out(SiteSettings.load())


@admin_router.put("/landing")
@require_perm("site.manage_site")
def update_landing(request, payload: LandingIn):
    site = SiteSettings.load()
    site.landing = payload.dict()
    site.save(update_fields=["landing"])
    record("site.landing_changed", "changed the landing page", request=request, target_type="site")
    images.prune(site)
    return landing_out(site)


@admin_router.delete("/landing")
@require_perm("site.manage_site")
def reset_landing(request):
    site = SiteSettings.load()
    if site.landing:
        site.landing = {}
        site.save(update_fields=["landing"])
        record("site.landing_reset", "reset the landing page to the default", request=request, target_type="site")
        images.prune(site)
    return landing_out(site)


# --- uploaded images -------------------------------------------------------------


@admin_router.post("/images")
@require_perm("site.manage_site")
def upload_image(request, file: UploadedFile = File(...)):
    """Upload a PNG, JPEG, WebP or GIF (up to 5 MB) for the site; returns the address to use it by."""
    if file.size > images.MAX_SIZE:
        raise HttpError(400, "The image is too big: 5 MB at most")
    content = file.read()
    content_type = images.sniff(content[:16])
    if not content_type:
        raise HttpError(400, "That isn't a PNG, JPEG, WebP or GIF image")
    image = SiteImage.objects.create(
        content=content, content_type=content_type, size=len(content), name=(file.name or "")[:200], uploaded_by=request.user
    )
    record("site.image_uploaded", f"uploaded an image ({image.name or image.url})", request=request, target_type="site",
           details={"url": image.url, "size": image.size})
    return {"url": image.url, "content_type": content_type, "size": image.size}


@router.get("/images/{image_id}")
def site_image(request, image_id: str):
    """An image an admin uploaded. Its address never changes content, so browsers revalidate with a cheap 304."""
    try:
        pk = uuid.UUID(image_id)
    except ValueError:
        raise HttpError(404, "No such image")
    etag = f'"{pk.hex}"'
    exists = SiteImage.objects.filter(pk=pk)
    if request.headers.get("If-None-Match") == etag and exists.exists():
        return HttpResponseNotModified(headers={"ETag": etag})
    image = exists.first()
    if not image:
        raise HttpError(404, "No such image")
    resp = HttpResponse(bytes(image.content), content_type=image.content_type)
    resp["ETag"] = etag
    resp["X-Content-Type-Options"] = "nosniff"
    resp["Content-Security-Policy"] = "default-src 'none'; sandbox"
    return resp


@admin_router.get("/admins")
def list_admins(request):
    from conduit.accounts.models import User

    _require_admin(request)
    admins = User.objects.filter(is_superuser=True, is_active=True).select_related("main_character__corporation", "main_character__alliance")
    return [_admin_out(u, request) for u in admins.order_by("main_character__name")]


@admin_router.post("/admins/{user_id}")
def add_admin(request, user_id: int):
    from conduit.accounts.models import User
    from conduit.notify import notify

    _require_admin(request)
    user = User.objects.filter(pk=user_id, is_active=True).select_related("main_character").first()
    if user is None:
        raise HttpError(404, "User not found")
    if user.is_superuser:
        raise HttpError(400, f"{user.display_name} is already an administrator")
    user.is_superuser = True
    user.is_staff = True
    user.save(update_fields=["is_superuser", "is_staff"])
    record("site.admin_added", f"made {user.display_name} an administrator", request=request, target=user)
    notify(user, "You're now an administrator", f"{request.user.display_name} gave you full access to the site.",
           link="/admin/settings", level="warning", force=True)
    return [_admin_out(u, request) for u in User.objects.filter(is_superuser=True, is_active=True).select_related("main_character")]


@admin_router.delete("/admins/{user_id}")
def remove_admin(request, user_id: int):
    from conduit.accounts.models import User

    _require_admin(request)
    user = User.objects.filter(pk=user_id, is_superuser=True).select_related("main_character").first()
    if user is None:
        raise HttpError(404, "That user isn't an administrator")
    if user.pk == SiteSettings.load().owner_id:
        raise HttpError(400, f"{user.display_name} is the super admin, who claimed the site, and always stays an administrator")
    if not User.objects.filter(is_superuser=True, is_active=True).exclude(pk=user.pk).exists():
        raise HttpError(400, "The site needs at least one administrator")
    user.is_superuser = False
    user.is_staff = False
    user.save(update_fields=["is_superuser", "is_staff"])
    record("site.admin_removed", f"removed {user.display_name} as an administrator", request=request, target=user)
    return [_admin_out(u, request) for u in User.objects.filter(is_superuser=True, is_active=True).select_related("main_character")]


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
