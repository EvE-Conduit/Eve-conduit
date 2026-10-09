"""Compliance: does every character of a user have a working login with every scope the site needs?

A user is compliant when each of their characters has a valid token holding every required scope
(the character sheet's plus enabled plugins'), and enabled plugins' own checks (``Plugin.compliance``, e.g. being on
the Discord server) find nothing. Failing or stale character-sheet syncs are reported as warnings; they are often
ESI's fault, so they don't make anyone non-compliant.
"""

from __future__ import annotations

import logging
from datetime import timedelta

from django.utils import timezone

from conduit.events import bus

log = logging.getLogger(__name__)

# A sync that has failed this many times in a row is worth a warning.
FAILING_AFTER = 3
# No successful sync for this long (on top of the section's interval) is "stale".
STALE_AFTER = timedelta(days=2)


def _required() -> list[str]:
    from conduit.plugins.services import required_scopes

    return required_scopes()


def _plugin_checks() -> list:
    """The compliance checks of enabled plugins."""
    import importlib

    from conduit.plugins import registry
    from conduit.plugins.services import enabled_ids

    enabled = enabled_ids()
    checks = []
    for pid, plugin in registry.installed().items():
        if pid not in enabled:
            continue
        for path in getattr(plugin, "compliance", ()) or ():
            module, _, name = path.partition(":")
            try:
                checks.append((pid, getattr(importlib.import_module(module), name)))
            except Exception:
                log.exception("Could not load compliance check %s of plugin %s", path, pid)
    return checks


def plugin_problems(user) -> list[str]:
    out = []
    for pid, check in _plugin_checks():
        try:
            out += [str(p) for p in check(user) or []]
        except Exception:
            # A broken plugin mustn't make everyone non-compliant (or everyone compliant): log it and move on.
            log.exception("Compliance check of plugin %s failed for user %s", pid, user.pk)
    return out


def character_status(character, required: list[str], statuses: list, sources: dict[str, list[str]] | None = None) -> dict:
    from conduit.plugins.services import describe_missing
    from conduit.sheet import registry
    from conduit.sheet.models import SyncStatus

    token = getattr(character, "token", None)
    granted = token.scope_set if token else set()
    valid = bool(token and token.valid)
    missing = [s for s in required if s not in granted] if valid else []
    now = timezone.now()
    failing, stale = [], []
    for st in statuses:
        section = registry.SECTIONS.get(st.section)
        if section is None or section.virtual:
            continue
        if st.result == SyncStatus.Result.ERROR and st.failures >= FAILING_AFTER:
            failing.append({"section": st.section, "label": section.label, "message": st.message, "failures": st.failures})
        elif st.last_success and st.last_success < now - STALE_AFTER - timedelta(seconds=section.interval):
            stale.append({"section": st.section, "label": section.label, "last_success": st.last_success.isoformat()})
    problems = []
    if token is None:
        problems.append("never logged in with ESI access")
    elif not valid:
        problems.append("needs to log in again")
    elif missing:
        problems.append(f"missing {len(missing)} ESI scope{'s' if len(missing) != 1 else ''}")
    return {
        "id": character.pk,
        "name": character.name,
        "portrait": character.portrait,
        "corporation": {"id": character.corporation_id, "name": character.corporation.name, "ticker": character.corporation.ticker}
        if character.corporation_id and character.corporation else None,
        "token_valid": valid,
        "missing_scopes": missing,
        #: Each missing scope with what needs it (character sheet sections, plugins).
        "missing_detail": describe_missing(missing, sources) if missing else [],
        "failing_sections": failing,
        "stale_sections": stale,
        "problems": problems,
        "ok": not problems,
    }


def check_user(user, required: list[str] | None = None) -> dict:
    """The live compliance of a user."""
    from conduit.plugins.services import scope_sources
    from conduit.sheet.models import SyncStatus

    required = _required() if required is None else required
    sources = scope_sources()
    chars = list(user.characters.select_related("token", "corporation"))
    statuses: dict[int, list] = {}
    for st in SyncStatus.objects.filter(character__in=chars):
        statuses.setdefault(st.character_id, []).append(st)
    characters = [character_status(c, required, statuses.get(c.pk, []), sources) for c in chars]
    problems = [f"{c['name']}: {p}" for c in characters for p in c["problems"]]
    warnings = [f"{c['name']}: {s['label']} is failing to update" for c in characters for s in c["failing_sections"]]
    warnings += [f"{c['name']}: {s['label']} hasn't updated for a while" for c in characters for s in c["stale_sections"]]
    account_problems = [] if chars else ["No characters linked"]
    account_problems += plugin_problems(user)
    problems += account_problems
    return {
        "compliant": not problems,
        "problems": problems,
        #: Problems that aren't about one character (no characters, or a plugin's, such as not being on Discord).
        "account_problems": account_problems,
        "warnings": warnings,
        "characters": sorted(characters, key=lambda c: (c["ok"], c["name"].lower())),
    }


def refresh_user(user, required: list[str] | None = None) -> dict:
    """Re-check a user, store the result, and announce it when compliance changed."""
    from conduit.notify import notify

    from .models import ComplianceStatus

    result = check_user(user, required)
    now = timezone.now()
    status = ComplianceStatus.objects.filter(user=user).first()
    first = status is None
    changed = first or status.compliant != result["compliant"]
    if first:
        status = ComplianceStatus(user=user, changed_at=now)
    elif changed:
        status.changed_at = now
    status.compliant = result["compliant"]
    status.problems = result["problems"]
    status.warnings = result["warnings"]
    status.checked_at = now
    status.save()

    # Someone who has always been fine doesn't need to hear about it.
    if changed and not (first and result["compliant"]):
        bus.emit(
            "compliance.changed", user_id=user.pk, user=user.display_name, compliant=result["compliant"],
            problems=result["problems"][:20], level="success" if result["compliant"] else "warning",
            summary=f"{user.display_name} is {'now compliant' if result['compliant'] else 'no longer compliant'}",
        )
        if result["compliant"]:
            notify(user, "All your characters are in order", "Every character has a working login with all the access the site needs.",
                   link="/characters", level="success", category="compliance")
        elif not _only_lost_tokens(result):
            # A lost token already told its owner (esi.tokens.token_lost); don't say it twice.
            title = "Your account needs attention" if result["account_problems"] else "Some of your characters need attention"
            notify(user, title, "\n".join(result["problems"][:10]), link="/characters", level="warning", category="compliance")
    return result


def _only_lost_tokens(result: dict) -> bool:
    bad = [c for c in result["characters"] if c["problems"]]
    # Account-level problems (e.g. a plugin's: not on the Discord server) still need saying.
    account_level = len(result["problems"]) > sum(len(c["problems"]) for c in bad)
    return bool(bad) and not account_level and all(c["problems"] == ["needs to log in again"] for c in bad)


def refresh_all() -> int:
    from conduit.accounts.models import User

    required = _required()
    n = 0
    for user in User.objects.filter(is_active=True).select_related("main_character"):
        refresh_user(user, required)
        n += 1
    return n


def unregistered_members(corporation_id: int) -> list[dict] | None:
    """Members of a corporation (from the corporation sheet's member list) with no account here.

    None when the member list isn't available (no corporation sheet, or no director token).
    """
    try:
        from conduit.corp.services import member_ids
    except ImportError:
        return None
    try:
        ids = member_ids(corporation_id)
    except Exception:
        return None
    if ids is None:
        return None
    from conduit.accounts.models import Character
    from conduit.eve.models import EveName
    from conduit.eve.tasks import ensure_eve_names
    from conduit.esi.exceptions import EsiBackoff, EsiError

    registered = set(Character.objects.filter(pk__in=ids).values_list("pk", flat=True))
    missing = sorted(set(ids) - registered)
    try:
        ensure_eve_names(missing)
    except (EsiError, EsiBackoff):
        pass
    names = dict(EveName.objects.filter(pk__in=missing).values_list("pk", "name"))
    from conduit.eve.models import portrait_url

    return sorted(
        ({"id": i, "name": names.get(i, f"Character {i}"), "portrait": portrait_url(i, 64)} for i in missing),
        key=lambda r: r["name"].lower(),
    )
