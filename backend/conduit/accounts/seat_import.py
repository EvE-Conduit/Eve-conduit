"""Bringing users, characters, SSO tokens and squads over from SeAT (driven by tools/seat-import).

Tokens only keep working if this site uses the same EVE application (client id and secret) as the SeAT install
they came from. Imported tokens are saved as already expired, so the first use refreshes them; ``verify_tokens``
does that straight away and reports which ones EVE no longer accepts.

Characters already on this site stay with their current account: an import never moves a character or replaces a
working token. Running the same import twice changes nothing the second time.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone as dt_timezone

from django.contrib.auth.models import Group
from django.db import transaction

from conduit.access.models import GroupProfile
from conduit.access.services import recompute_user_state

from .models import Character, Token, User
from .services import _new_username

#: Saved as the expiry of imported tokens, so the first use refreshes them.
EXPIRED = datetime(2000, 1, 1, tzinfo=dt_timezone.utc)


@dataclass
class SeatCharacter:
    id: int
    name: str
    owner_hash: str = ""
    refresh_token: str = ""
    scopes: list[str] = field(default_factory=list)


@dataclass
class SeatUser:
    seat_id: int
    name: str
    main_character_id: int
    characters: list[SeatCharacter]


def wanted_scopes() -> set[str]:
    """Scopes the character sheet and enabled plugins need; a token without them works but leaves gaps."""
    from conduit.plugins.services import required_scopes

    return set(required_scopes())


def _target_user(seat_user: SeatUser, existing: dict[int, Character]) -> User | None:
    """The account this SeAT user lands in: whoever owns their main here, else whoever owns any of their characters."""
    main = existing.get(seat_user.main_character_id)
    if main is not None:
        return main.user
    return next((c.user for c in existing.values()), None)


def preview(users: list[SeatUser]) -> list[dict]:
    """What importing would do, per user, without changing anything."""
    ids = [c.id for u in users for c in u.characters]
    existing = {c.pk: c for c in Character.objects.filter(pk__in=ids).select_related("user", "user__main_character", "token")}
    wanted = wanted_scopes()
    out = []
    for u in users:
        mine = {c.id: existing[c.id] for c in u.characters if c.id in existing}
        target = _target_user(u, mine)
        chars = []
        for c in u.characters:
            here = existing.get(c.id)
            if here is None:
                status = "new"
            elif target is not None and here.user_id != target.pk:
                status = "other_account"
            elif here.owner_hash and c.owner_hash and here.owner_hash != c.owner_hash:
                status = "owner_changed"
            elif not hasattr(here, "token") or not here.token.valid:
                status = "token_replaced"
            else:
                status = "exists"
            chars.append({"id": c.id, "status": status, "missing_scopes": sorted(wanted - set(c.scopes))})
        out.append({
            "seat_id": u.seat_id,
            "account": None if target is None else {"id": target.pk, "name": target.display_name},
            "characters": chars,
        })
    return out


@transaction.atomic
def import_user(u: SeatUser) -> dict:
    """Create or extend the account for one SeAT user. Returns what happened, per character."""
    existing = {c.pk: c for c in Character.objects.select_for_update().filter(pk__in=[c.id for c in u.characters]).select_related("user")}
    user = _target_user(u, existing)
    created = user is None
    if created:
        user = User.objects.create(username=_new_username(u.main_character_id))

    result = {"seat_id": u.seat_id, "user_id": user.pk, "created": created, "characters": []}
    for c in u.characters:
        here = existing.get(c.id)
        if here is None:
            here = Character.objects.create(id=c.id, name=c.name, owner_hash=c.owner_hash, user=user)
            status = "added"
        elif here.user_id != user.pk:
            result["characters"].append({"id": c.id, "status": "other_account"})
            continue
        elif here.owner_hash and c.owner_hash and here.owner_hash != c.owner_hash:
            # Sold since one of the two systems last saw it; keep what this site has.
            result["characters"].append({"id": c.id, "status": "owner_changed"})
            continue
        else:
            status = "exists"

        token = Token.objects.filter(character=here).first()
        if c.refresh_token and (token is None or not token.valid):
            Token.objects.update_or_create(
                character=here,
                defaults={
                    "access_token": "",
                    "refresh_token": c.refresh_token,
                    "expires_at": EXPIRED,
                    "scopes": " ".join(sorted(set(c.scopes))),
                    "valid": True,
                },
            )
            if status == "exists":
                status = "token_replaced"
        result["characters"].append({"id": c.id, "status": status})

    if user.main_character_id is None:
        main = Character.objects.filter(pk=u.main_character_id, user=user).first() or user.characters.first()
        if main is not None:
            user.main_character = main
            user.save(update_fields=["main_character"])
    recompute_user_state(user)
    return result


class SquadError(Exception):
    pass


@transaction.atomic
def import_squad(name: str, description: str, hidden: bool, member_mains: list[int], moderator_mains: list[int],
                 *, request=None) -> dict:
    """A SeAT squad becomes a group (closed, so only leaders and admins add people). Members are found by their
    SeAT main character, so this works whichever account they landed in. An existing group of the same name is
    reused and only gains members, unless it grants administrator permissions or is a smart group."""
    from conduit.access.groups import add_member
    from conduit.access.services import admin_permissions_in

    group, created = Group.objects.get_or_create(name=name[:150])
    if not created and admin_permissions_in(group.permissions.all()):
        raise SquadError(f"{group.name} grants administrator permissions here, so the import leaves it alone")
    profile, _ = GroupProfile.objects.get_or_create(
        group=group,
        defaults={"description": description[:300], "hidden": hidden,
                  "join_mode": GroupProfile.JoinMode.CLOSED, "leave_mode": GroupProfile.LeaveMode.REQUEST},
    )
    if profile.auto:
        raise SquadError(f"{group.name} is a smart group here, so its rules decide who is in it")
    members = list(User.objects.filter(characters__in=member_mains).distinct())
    added = sum(add_member(u, group, "api", request=request, note="from SeAT") for u in members)
    leaders = User.objects.filter(characters__in=moderator_mains).distinct()
    profile.leaders.add(*leaders)
    return {"group_id": group.pk, "group": group.name, "created": created, "members": len(members), "added": added,
            "leaders": leaders.count()}
