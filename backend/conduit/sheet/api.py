"""``/api/characters/<id>/...`` (one character) and ``/api/me/...`` (all of mine)."""

from django.shortcuts import get_object_or_404
from ninja import Router
from ninja.errors import HttpError

from conduit.accounts.models import Character
from conduit.audit.services import record_snoop
from conduit.schemas import character_brief

from . import registry
from .access import can_view
from .models import SyncStatus

router = Router(tags=["character sheet"])
me_router = Router(tags=["me"])


def viewable_character(request, character_id: int) -> Character:
    character = get_object_or_404(
        Character.objects.select_related("user", "corporation", "alliance", "token"), pk=character_id
    )
    if not can_view(request.user, character):
        raise HttpError(403, "You can't view this character")
    record_snoop(request, character, _section_of(request, character_id))
    return character


def _section_of(request, character_id: int) -> str:
    """``/api/characters/<id>/wallet/journal`` -> "wallet"; the bare header is "sheet"."""
    path = getattr(request, "path", "") or ""
    marker = f"/{character_id}/"
    rest = path.split(marker, 1)[1] if marker in path else ""
    return rest.split("/", 1)[0] or "sheet"


def my_characters(request):
    return Character.objects.filter(user=request.user).select_related("corporation", "alliance")


@router.get("/{character_id}")
def character_header(request, character_id: int):
    """Who the character is, which sections exist, and how fresh each one is."""
    character = viewable_character(request, character_id)
    token = getattr(character, "token", None)
    granted = token.scope_set if token else set()
    statuses = {s.section: s for s in SyncStatus.objects.filter(character=character)}

    def section_out(s):
        if s.virtual:
            sources = [registry.SECTIONS[k] for k in s.sources if k in registry.SECTIONS]
            last = max((statuses[k.key].last_success for k in sources if k.key in statuses and statuses[k.key].last_success), default=None)
            return {
                "key": s.key,
                "label": s.label,
                "available": bool(token and token.valid and any(k.can_sync(granted) for k in sources)),
                "missing_scopes": [],
                "result": SyncStatus.Result.OK if last else SyncStatus.Result.PENDING,
                "message": "",
                "last_success": last.isoformat() if last else None,
            }
        st = statuses.get(s.key)
        return {
            "key": s.key,
            "label": s.label,
            "available": bool(token and token.valid and s.can_sync(granted)),
            "missing_scopes": sorted(set(s.scopes) - granted),
            "result": st.result if st else SyncStatus.Result.PENDING,
            "message": st.message if st else "",
            "last_success": st.last_success.isoformat() if st and st.last_success else None,
        }

    return {
        **character_brief(character),
        "owner": {"id": character.user_id, "name": character.user.display_name},
        "is_mine": character.user_id == request.user.pk,
        "is_main": character.user.main_character_id == character.pk,
        "token_valid": bool(token and token.valid),
        "sections": [section_out(s) for s in registry.ordered()],
    }


@router.post("/{character_id}/refresh")
def refresh(request, character_id: int):
    """Queue a sync of every section now (owner only)."""
    from .tasks import sync_now

    character = viewable_character(request, character_id)
    if character.user_id != request.user.pk:
        raise HttpError(403, "Only the owner can refresh a character")
    sync_now(character)
    return {"ok": True}
