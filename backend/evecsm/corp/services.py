"""Things other parts of EVECSM ask about corporations."""

from .models import CorporationMember, CorpSyncStatus


def member_ids(corporation_id: int) -> set[int] | None:
    """Character ids of every member of the corporation, from its member list.

    None when we don't know (the members section has never synced for it).
    """
    known = CorpSyncStatus.objects.filter(corporation_id=corporation_id, section="members", last_success__isnull=False).exists()
    if not known:
        return None
    return set(CorporationMember.objects.filter(corporation_id=corporation_id).values_list("character_id", flat=True))
