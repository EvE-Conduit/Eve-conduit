"""Who may look at whose character data."""

from evecsm.accounts.models import Character


def can_view(user, character: Character) -> bool:
    if not user.is_authenticated:
        return False
    if character.user_id == user.pk or user.has_perm("sheet.view_all_characters"):
        return True
    main = user.main_character
    if main is None:
        return False
    if user.has_perm("sheet.view_alliance_characters") and main.alliance_id and character.alliance_id == main.alliance_id:
        return True
    return bool(
        user.has_perm("sheet.view_corporation_characters") and main.corporation_id and character.corporation_id == main.corporation_id
    )
