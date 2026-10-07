import secrets

from django.db import transaction

from evecsm.access.services import recompute_user_state
from evecsm.esi.tokens import save_token
from evecsm.events import bus

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

    from evecsm.eve.tasks import update_affiliations
    from evecsm.sheet.tasks import sync_now

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
