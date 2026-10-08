import secrets

from django.db import transaction

from conduit.access.services import recompute_user_state
from conduit.esi.tokens import save_token
from conduit.events import bus

from .models import Character, User


class CharacterOwnedElsewhere(Exception):
    pass


def _new_username(character_id: int) -> str:
    # Usernames are internal; a sold character's old account may already hold the plain one.
    name = f"char_{character_id}"
    while User.objects.filter(username=name).exists():
        name = f"char_{character_id}_{secrets.token_hex(3)}"
    return name


@transaction.atomic
def link_character(info: dict, token_data: dict, current_user: User | None) -> Character:
    """Attach the SSO character to ``current_user``, or find/create its owner when logging in.

    ``info`` is the output of ``esi.tokens.character_from_claims``.
    """
    character = Character.objects.select_related("user").filter(pk=info["id"]).first()

    # A changed owner hash means the character was sold: forget the old link entirely.
    if character and character.owner_hash != info["owner_hash"]:
        character.delete()
        character = None

    if character and current_user and character.user_id != current_user.pk:
        raise CharacterOwnedElsewhere(info["name"])

    if character is None:
        user = current_user
        if user is None:
            user = User.objects.create(username=_new_username(info["id"]))
            bus.emit("user.created", user_id=user.pk, user=info["name"], summary=f"{info['name']} signed in for the first time")
        character = Character.objects.create(
            id=info["id"], name=info["name"], owner_hash=info["owner_hash"], user=user
        )
        bus.emit("character.added", user_id=user.pk, user=user.display_name if user.main_character_id else info["name"],
                 character_id=character.pk, character=character.name,
                 summary=f"{character.name} was linked to {user.display_name if user.main_character_id else info['name']}")
    elif character.name != info["name"]:
        character.name = info["name"]
        character.save(update_fields=["name"])

    user = character.user
    if user.main_character_id is None:
        user.main_character = character
        user.save(update_fields=["main_character"])

    save_token(character, token_data, info["scopes"])

    from conduit.eve.tasks import update_affiliations
    from conduit.sheet.tasks import sync_now

    transaction.on_commit(lambda: update_affiliations.delay([character.pk]))
    transaction.on_commit(lambda: sync_now(character))
    recompute_user_state(user)
    return character


@transaction.atomic
def set_main(user: User, character_id: int) -> Character:
    character = user.characters.get(pk=character_id)
    user.main_character = character
    user.save(update_fields=["main_character"])
    recompute_user_state(user)
    return character


@transaction.atomic
def remove_character(user: User, character_id: int):
    character = user.characters.get(pk=character_id)
    if user.main_character_id == character.pk:
        raise ValueError("Choose a different main character before removing this one")
    character.delete()


# --- moving characters between accounts ----------------------------------------------------------------------------


class MoveError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def can_move_characters(actor: User, source: User, target: User) -> str | None:
    """None if ``actor`` may move characters from ``source`` to ``target``, otherwise why not.

    Whoever owns a character can sign in with it, into the account that holds it, so moving a character into an
    account is like handing out that account: as with signing in as someone, nobody may move characters into an
    account that has permissions they don't hold themselves, and only administrators touch administrators' accounts.
    """
    if not actor.has_perm("site.manage_access"):
        return "You don't have permission to move characters between accounts"
    if source.pk == target.pk:
        return "Pick a different account to move them to"
    if not target.is_active:
        return "That account is switched off"
    if (source.is_superuser or target.is_superuser) and not actor.is_superuser:
        return "Only administrators can move characters to or from an administrator's account"
    if not actor.is_superuser:
        extra = sorted(set(target.get_all_permissions()) - set(actor.get_all_permissions()))
        if extra:
            return (f"{target.display_name} has permissions you don't ({', '.join(extra[:5])}); whoever owns the "
                    "characters could sign in as them, so an administrator has to do this")
    return None


@transaction.atomic
def move_characters(actor: User, source: User, target: User, character_ids: list[int], request=None) -> dict:
    """Move characters (with their logins and everything synced for them) from ``source`` to ``target``, e.g. when
    someone signed up twice instead of adding an alt. An account left without characters is switched off (it can't
    sign in any more) and leaves its groups; its history (requests, applications...) stays with it for the record.
    """
    from conduit.audit.services import record

    problem = can_move_characters(actor, source, target)
    if problem:
        raise MoveError(problem, 403)
    ids = {int(i) for i in character_ids}
    chars = list(Character.objects.select_for_update().filter(user=source, pk__in=ids))
    if not ids or len(chars) != len(ids):
        raise MoveError("Pick characters of that account")
    Character.objects.filter(pk__in=ids).update(user=target)
    moved_main = source.main_character_id in ids
    remaining = list(Character.objects.filter(user=source).order_by("name"))
    emptied = not remaining
    fields = []
    if moved_main:
        source.main_character = remaining[0] if remaining else None
        fields.append("main_character")
    if emptied:
        source.is_active = False
        fields.append("is_active")
    if fields:
        source.save(update_fields=fields)
    if emptied:
        source.groups.clear()
    if target.main_character_id is None:
        target.main_character = chars[0]
        target.save(update_fields=["main_character"])

    names = sorted(c.name for c in chars)
    for c in chars:
        bus.emit("character.moved", character_id=c.pk, character=c.name, from_user_id=source.pk, to_user_id=target.pk,
                 user_id=target.pk, user=target.display_name, summary=f"{c.name} moved to {target.display_name}'s account")
    if emptied:
        bus.emit("user.merged", from_user_id=source.pk, to_user_id=target.pk, user_id=target.pk, user=target.display_name,
                 summary=f"{source.display_name}'s account was merged into {target.display_name}'s")
    record("account.characters_moved", f"moved {', '.join(names)} from {source.display_name} to {target.display_name}"
           + (" (the old account is now switched off)" if emptied else ""), request=request, actor=actor, target=target,
           details={"characters": [c.pk for c in chars], "from_user_id": source.pk, "to_user_id": target.pk, "emptied": emptied})

    for user in (source, target):
        if user.is_active:
            recompute_user_state(user)

    def recheck():
        from conduit.access.tasks import update_user_groups

        update_user_groups.delay(target.pk)
        if not emptied:
            update_user_groups.delay(source.pk)

    transaction.on_commit(recheck)
    return {"moved": names, "emptied": emptied}
