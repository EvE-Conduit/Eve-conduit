"""Bringing users, characters, SSO tokens and squads over from SeAT (driven by tools/seat-import).

Tokens only keep working if this site uses the same EVE application (client id and secret) as the SeAT install
they came from. Imported tokens are saved as already expired, so the first use refreshes them; ``verify_tokens``
does that straight away and reports which ones EVE no longer accepts.

Characters already on this site stay with their current account: an import never moves a character or replaces a
working token. Running the same import twice changes nothing the second time.

An import key must not be a way into someone's account, so characters are only added to an existing account when
the import proves it knows that account: one of its characters is listed with the same owner hash this site has
(only EVE, this site and SeAT know it). Without that proof the user's characters that aren't here yet are left
out (they can be added by signing in). An administrator's account is never added to at all.

When the user joined SeAT and last signed in there come along too: an account's join date only moves earlier and
its last sign-in only later, so group rules on membership age and the inactivity plugin see the member's real
history rather than the day of the move.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone as dt_timezone

from django.contrib.auth.models import Group
from django.db import transaction

from conduit.access.models import GroupProfile
from conduit.access.services import is_administrator, recompute_user_state

from .models import Character, Token, User
from .services import create_user

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
    joined: datetime | None = None
    last_login: datetime | None = None


def seat_time(value) -> datetime | None:
    """A SeAT date ("2024-01-02 03:04:05", in UTC like SeAT keeps them) as an aware datetime; None for an empty,
    zero, unreadable or future one."""
    text = str(value or "").strip().replace("T", " ").removesuffix("Z")
    if not text or text.startswith("0000"):
        return None
    try:
        when = datetime.fromisoformat(text)
    except ValueError:
        return None
    when = when.replace(tzinfo=dt_timezone.utc) if when.tzinfo is None else when.astimezone(dt_timezone.utc)
    return None if when > datetime.now(dt_timezone.utc) else when


def _carry_dates(user: User, u: SeatUser) -> bool:
    """Move the account's join date back and its last sign-in forward to SeAT's, never the other way."""
    changed = []
    if u.joined and u.joined < user.date_joined:
        user.date_joined = u.joined
        changed.append("date_joined")
    if u.last_login and (user.last_login is None or u.last_login > user.last_login):
        user.last_login = u.last_login
        changed.append("last_login")
    if changed:
        user.save(update_fields=changed)
    return bool(changed)


def wanted_scopes() -> set[str]:
    """Scopes the character sheet and enabled plugins need; a token without them works but leaves gaps."""
    from conduit.plugins.services import required_scopes

    return set(required_scopes())


def _sold(here: Character, seat: SeatCharacter) -> bool:
    """Whether the two systems know the character under different owners (sold since one of them last saw it)."""
    return bool(here.owner_hash and seat.owner_hash and here.owner_hash != seat.owner_hash)


def _same_owner(here: Character, seat: SeatCharacter) -> bool:
    """Whether the import lists the character with the owner hash this site has for it.

    A hash missing on both sides (a SeAT without owner hashes, and nobody has signed in here since) is no secret
    anyone had to know. It only counts while the whole account is like that, so a second run finds the accounts the
    first one made; once one of the account's characters has a known owner, a hashless alt of it proves nothing.
    """
    if here.owner_hash != seat.owner_hash:
        return False
    return bool(here.owner_hash) or not Character.objects.filter(user_id=here.user_id).exclude(owner_hash="").exists()


def _target_user(seat_user: SeatUser, existing: dict[int, Character]) -> User | None:
    """The account this SeAT user lands in: whoever owns their main here, else whoever owns any of their characters.

    Only characters listed with the owner hash this site has count. That is the proof the import knows the account
    (a made-up list naming someone's character can't give it), and it keeps an alt sold to someone who registered
    it here from pulling the seller's main and alts into the buyer's account. A hash missing on one side only
    proves nothing either way.
    """
    same_owner = {c.id: existing[c.id] for c in seat_user.characters if c.id in existing and _same_owner(existing[c.id], c)}
    main = same_owner.get(seat_user.main_character_id)
    if main is not None:
        return main.user
    return next((c.user for c in same_owner.values()), None)


#: Why a user's new characters are left out: nothing proves which account they belong to, or it is an
#: administrator's (who adds their own characters by signing in).
OWNER_UNKNOWN, ADMIN_ACCOUNT = "owner_unknown", "admin_account"


def _left_out(seat_user: SeatUser, target: User | None, existing: dict[int, Character]) -> str:
    """The reason this user's characters that aren't here yet must not be imported, or "".

    With no account proven, a character here whose owner hash is missing on one side might be this same person's
    (so a new account would split them in two, on every run) or someone else's (so their account must not be
    joined): either way the rest wait. Characters known to be sold don't hold anything up.
    """
    if target is None:
        unsure = any(c.id in existing and not _sold(existing[c.id], c) for c in seat_user.characters)
        return OWNER_UNKNOWN if unsure else ""
    return ADMIN_ACCOUNT if is_administrator(target) else ""


def preview(users: list[SeatUser]) -> list[dict]:
    """What importing would do, per user, without changing anything."""
    ids = [c.id for u in users for c in u.characters]
    existing = {c.pk: c for c in Character.objects.filter(pk__in=ids).select_related("user", "user__main_character", "token")}
    wanted = wanted_scopes()
    out = []
    for u in users:
        mine = {c.id: existing[c.id] for c in u.characters if c.id in existing}
        target = _target_user(u, mine)
        left_out = _left_out(u, target, mine)
        chars = []
        for c in u.characters:
            here = existing.get(c.id)
            if here is None:
                status = left_out or "new"
            elif _sold(here, c):
                status = "owner_changed"
            elif target is None or here.user_id != target.pk:
                status = "other_account"
            elif not left_out and (not hasattr(here, "token") or not here.token.valid):
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
    left_out = _left_out(u, user, existing)
    if left_out:
        # Nothing is written: not characters, not tokens, not dates.
        chars = [{"id": c.id, "status": left_out if c.id not in existing
                  else "owner_changed" if _sold(existing[c.id], c)
                  else "exists" if user is not None and existing[c.id].user_id == user.pk else "other_account"}
                 for c in u.characters]
        return {"seat_id": u.seat_id, "user_id": user.pk if user else None, "created": False, "characters": chars,
                "dates_carried": False}
    created = user is None
    if created:
        user = create_user(u.main_character_id)

    result = {"seat_id": u.seat_id, "user_id": user.pk, "created": created, "characters": [],
              "dates_carried": _carry_dates(user, u)}
    for c in u.characters:
        here = existing.get(c.id)
        if here is None:
            here = Character.objects.create(id=c.id, name=c.name[:100], owner_hash=c.owner_hash, user=user)
            status = "added"
        elif _sold(here, c):
            # Sold since one of the two systems last saw it; keep what this site has.
            result["characters"].append({"id": c.id, "status": "owner_changed"})
            continue
        elif here.user_id != user.pk:
            result["characters"].append({"id": c.id, "status": "other_account"})
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
    reused and only gains members, unless it grants any permission (who gets those is decided here, not by an
    import), limits who may be in it, or is a smart group. Leaders are only set on a group the import made."""
    from conduit.access.groups import add_member
    from conduit.access.services import admin_permissions_in

    group, created = Group.objects.get_or_create(name=name[:150])
    if not created and admin_permissions_in(group.permissions.all()):
        raise SquadError(f"{group.name} grants administrator permissions here, so the import leaves it alone")
    if not created and group.permissions.exists():
        raise SquadError(f"{group.name} grants permissions here, so the import leaves it alone; add its members by hand")
    profile, _ = GroupProfile.objects.get_or_create(
        group=group,
        defaults={"description": description[:300], "hidden": hidden,
                  "join_mode": GroupProfile.JoinMode.CLOSED, "leave_mode": GroupProfile.LeaveMode.REQUEST},
    )
    if profile.auto:
        raise SquadError(f"{group.name} is a smart group here, so its rules decide who is in it")
    members = [u for u in User.objects.filter(characters__in=member_mains).distinct() if profile.allows(u)]
    added = sum(add_member(u, group, "api", request=request, note="from SeAT") for u in members)
    leaders = User.objects.filter(characters__in=moderator_mains).distinct() if created else User.objects.none()
    profile.leaders.add(*leaders)
    return {"group_id": group.pk, "group": group.name, "created": created, "members": len(members), "added": added,
            "leaders": leaders.count()}
