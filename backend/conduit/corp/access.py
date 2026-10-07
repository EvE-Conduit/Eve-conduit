"""Who may look at which corporation's sheet."""

from . import registry


def _ids(corporation) -> tuple[int, int | None]:
    if isinstance(corporation, int):
        from conduit.eve.models import EveCorporation

        alliance_id = EveCorporation.objects.filter(pk=corporation).values_list("alliance_id", flat=True).first()
        return corporation, alliance_id
    return corporation.pk, corporation.alliance_id


def can_view(user, corporation) -> bool:
    """``corporation`` is an ``EveCorporation`` or its id."""
    if not user.is_authenticated:
        return False
    if user.has_perm("corp.view_all_corporations"):
        return True
    main = user.main_character
    if main is None:
        return False
    corp_id, alliance_id = _ids(corporation)
    if user.has_perm("corp.view_alliance_corporations") and main.alliance_id and alliance_id == main.alliance_id:
        return True
    return bool(user.has_perm("corp.view_own_corporation") and main.corporation_id == corp_id)


def can_view_corporation(user, corporation_id: int) -> bool:
    """Used by global search to decide whether a corporation hit links to its sheet."""
    return can_view(user, int(corporation_id))


def can_view_section(user, corporation, section_key: str) -> bool:
    section = registry.SECTIONS.get(section_key)
    if section is None or not can_view(user, corporation):
        return False
    return not section.financial or user.has_perm("corp.view_corporation_wallets")


def has_any_corp_permission(user) -> bool:
    return any(user.has_perm(f"corp.{p}") for p in ("view_own_corporation", "view_alliance_corporations", "view_all_corporations"))


def viewers(corporation) -> list:
    """Every active user who may view this corporation's sheet."""
    from conduit.accounts.models import User
    from conduit.notify.services import users_with_perm

    seen, out = set(), []
    for perm in ("corp.view_own_corporation", "corp.view_alliance_corporations", "corp.view_all_corporations"):
        for user in users_with_perm(perm):
            if user.pk not in seen and can_view(user, corporation):
                seen.add(user.pk)
                out.append(user)
    return out
