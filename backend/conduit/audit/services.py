"""Recording audit events. Call ``record`` after the change it describes has been made."""

import ipaddress
import logging

from django.conf import settings
from django.core.cache import cache

from .models import AuditEvent, SnoopEvent

log = logging.getLogger(__name__)


def trusted_proxy(address: str | None) -> bool:
    """Whether a peer at this address is one of CONDUIT_TRUSTED_PROXIES, whose forwarded headers we believe."""
    try:
        ip = ipaddress.ip_address(address)
    except ValueError:
        return False
    return any(ip in net for net in settings.CONDUIT_TRUSTED_PROXIES)


def client_ip(request) -> str | None:
    """The caller's address: the last hop of X-Forwarded-For when a trusted proxy sent it (Caddy and nginx
    append the real client last), otherwise REMOTE_ADDR. TrustedProxyMiddleware already drops the header from
    other peers; the check here covers requests that didn't pass through it."""
    if request is None:
        return None
    remote = request.META.get("REMOTE_ADDR") or None
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    try:
        if forwarded and trusted_proxy(remote):
            hop = forwarded.split(",")[-1].strip()
            ipaddress.ip_address(hop)
            return hop
    except ValueError:
        pass
    return remote


def _actor(request) -> tuple[str, int | None, str, object | None]:
    """Who is acting, plus the user they're signed in as when that's someone else (impersonation)."""
    key = getattr(request, "api_key", None) if request is not None else None
    if key is not None:
        return AuditEvent.Actor.API_KEY, key.pk, f"API key {key.name}", None
    user = getattr(request, "user", None)
    if user is not None and user.is_authenticated and user.pk:
        from conduit.site.impersonation import impersonator  # it imports record() from here

        real = impersonator(request)
        if real is not None and real.pk != user.pk:
            # The admin behind the session did it, not the person they're helping.
            return AuditEvent.Actor.USER, real.pk, f"{real.display_name} (as {user.display_name})", user
        return AuditEvent.Actor.USER, user.pk, user.display_name, None
    return AuditEvent.Actor.SYSTEM, None, "System", None


def actor_of(request) -> tuple[str, int | None, str]:
    return _actor(request)[:3]


def record(action: str, summary: str, *, request=None, target=None, target_type: str = "",
           details: dict | None = None, actor=None) -> AuditEvent | None:
    """Store an event. ``summary`` completes the sentence started by the actor's name
    ("added Pilot One to Fleet Commanders"). ``target`` is any model instance; its type,
    primary key and str() are copied. ``actor`` overrides who did it (a User)."""
    if actor is not None:
        actor_type, actor_id, actor_name = AuditEvent.Actor.USER, actor.pk, actor.display_name
    else:
        actor_type, actor_id, actor_name, impersonated = _actor(request)
        if impersonated is not None:
            details = {**(details or {}), "impersonating": impersonated.pk}
    try:
        return AuditEvent.objects.create(
            action=action,
            summary=f"{actor_name} {summary}"[:400],
            actor_type=actor_type,
            actor_id=actor_id,
            actor_name=actor_name[:150],
            target_type=target_type or (target._meta.model_name if target is not None else ""),
            target_id=str(target.pk) if target is not None else "",
            target_name=str(target)[:200] if target is not None else "",
            details=details or {},
            ip=client_ip(request),
        )
    except Exception:  # an audit hiccup must never break the action itself
        log.exception("Could not record audit event %s", action)
        return None


SNOOP_DEDUPE_SECONDS = 600  # the same viewer, character and section is recorded once per 10 minutes


def record_snoop(request, character, section: str = "sheet") -> SnoopEvent | None:
    """Note that someone looked at a character that isn't theirs. Their own characters are
    skipped; while an admin is signed in as someone else, the admin is the viewer."""
    from conduit.site.impersonation import impersonator

    user = getattr(request, "user", None)
    if user is None or not user.is_authenticated or getattr(request, "api_key", None) is not None:
        return None  # API keys reading sheets are in the API request log already
    try:
        real = impersonator(request)
        viewer = real or user
        if character.user_id == viewer.pk:
            return None
        if not cache.add(f"snoop:{viewer.pk}:{character.pk}:{section}", 1, SNOOP_DEDUPE_SECONDS):
            return None
        owner = character.user
        return SnoopEvent.objects.create(
            viewer_id=viewer.pk,
            viewer_name=viewer.display_name[:150],
            impersonating=user.display_name[:150] if real else "",
            character_id=character.pk,
            character_name=character.name[:200],
            owner_id=owner.pk if owner else None,
            owner_name=owner.display_name[:150] if owner else "",
            section=section[:40],
            ip=client_ip(request),
        )
    except Exception:  # like record(): never break the page being looked at
        log.exception("Could not record snoop on character %s", getattr(character, "pk", None))
        return None
