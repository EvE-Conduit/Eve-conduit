"""Who may look at whose character data."""

import logging
from functools import cache

from django.db.models import Q
from django.utils.module_loading import import_string

from conduit.accounts.models import Character

log = logging.getLogger(__name__)


def can_view(user, character: Character) -> bool:
    if not user.is_authenticated:
        return False
    if character.user_id == user.pk or user.has_perm("sheet.view_all_characters"):
        return True
    main = user.main_character
    if main is not None:
        if user.has_perm("sheet.view_alliance_characters") and main.alliance_id and character.alliance_id == main.alliance_id:
            return True
        if user.has_perm("sheet.view_corporation_characters") and main.corporation_id and character.corporation_id == main.corporation_id:
            return True
    return plugin_grants(user, character)


def viewable_characters(user):
    """Every character ``can_view`` lets the user see through their own permissions, as a queryset.
    Plugin grants are per character and are left out."""
    qs = Character.objects.select_related("corporation", "user")
    if user.has_perm("sheet.view_all_characters"):
        return qs
    rule = Q(user=user)
    main = user.main_character
    if main is not None:
        if user.has_perm("sheet.view_alliance_characters") and main.alliance_id:
            rule |= Q(alliance_id=main.alliance_id)
        if user.has_perm("sheet.view_corporation_characters") and main.corporation_id:
            rule |= Q(corporation_id=main.corporation_id)
    return qs.filter(rule)


@cache
def _provider(path: str):
    return import_string(path.replace(":", "."))


def plugin_grants(user, character: Character) -> bool:
    """Enabled plugins the user may use can let more people in (``Plugin.sheet_access``), e.g. recruiters seeing applicants."""
    from conduit.plugins import registry
    from conduit.plugins.services import can_use

    for mid, plugin in registry.installed().items():
        if not can_use(user, mid):
            continue
        for path in plugin.sheet_access:
            try:
                if _provider(path)(user, character):
                    return True
            except Exception:  # a broken plugin must not break the character sheet
                log.exception("Sheet access check %s failed", path)
    return False
