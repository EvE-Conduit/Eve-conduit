from django.db import transaction
from django.db.models import Q

from .models import GroupProfile, State


def is_site_member(user) -> bool:
    """Members are people in a state other than the public fallback (Guest); administrators always count."""
    if not user.is_authenticated or not user.is_active:
        return False
    return user.is_superuser or bool(user.state_id and not user.state.public)


def site_members(users=None):
    """``users`` (default: every active user) narrowed to members, as ``is_site_member`` decides."""
    from conduit.accounts.models import User

    users = User.objects.filter(is_active=True) if users is None else users
    return users.filter(Q(is_superuser=True) | Q(state__public=False))


def resolve_state(user) -> State | None:
    for state in State.objects.prefetch_related("member_characters").order_by("-priority"):
        if state.matches(user.main_character):
            return state
    return None


@transaction.atomic
def recompute_user_state(user) -> State | None:
    """Re-evaluate a user's state and drop groups the new state may not hold."""
    from conduit.events import bus

    state = resolve_state(user)
    if state != user.state:
        old = user.state
        user.state = state
        user.save(update_fields=["state"])
        bus.emit("user.state_changed", user_id=user.pk, user=user.display_name,
                 old_state=old.name if old else None, new_state=state.name if state else None,
                 summary=f"{user.display_name}: {old.name if old else 'no state'} → {state.name if state else 'no state'}")
    for profile in GroupProfile.objects.filter(group__user=user).select_related("group").prefetch_related("allowed_states"):
        if not profile.allows(user):
            from .groups import remove_member  # audited and announced as group.left like every other removal

            remove_member(user, profile.group, "state", note="state changed")
    return state


def recompute_all_states():
    from conduit.accounts.models import User

    for user in User.objects.select_related("main_character", "state"):
        recompute_user_state(user)


# Permissions that control the site itself. Only people who already manage access may hand these out:
# never group leaders, self-service joining, smart-group rules, or API keys.
ADMIN_PERMISSIONS = frozenset({
    "site.manage_site",
    "site.manage_access",
    "site.manage_plugins",
    "site.manage_api",
    "site.impersonate_users",
})


def admin_permissions_in(permissions) -> list[str]:
    """The administrator permissions among ``permissions`` (a Permission queryset)."""
    names = {f"{app}.{code}" for app, code in permissions.values_list("content_type__app_label", "codename")}
    return sorted(ADMIN_PERMISSIONS & names)


def is_administrator(user) -> bool:
    """Superusers and anyone holding an administrator permission, however it was granted (state or group)."""
    return bool(user.is_superuser or ADMIN_PERMISSIONS & set(user.get_all_permissions()))


#: Shown when a state edit would move an administrator to another state.
ADMIN_STATE_CHANGE = "That would change the state of an administrator; only an administrator can do that"


def administrators_in(kind: str, entity) -> list:
    """Administrators whose state could change when ``entity`` (a character, corporation or alliance,
    ``kind`` says which) is added to or removed from a state.

    States are resolved from the main character, so for a corporation or alliance these are the users whose main
    character is in it; for a character, its owner. A state edit can demote an administrator without touching the
    state's own permissions (a higher-priority state that outranks theirs, or the only state their admin group
    allows), so anyone who isn't an administrator themselves is refused these edits.
    """
    from conduit.accounts.models import User

    users = User.objects.filter(is_active=True).select_related("state", "main_character")
    if kind == "character":
        users = users.filter(characters__pk=entity.pk)
    elif kind == "corporation":
        users = users.filter(main_character__corporation_id=entity.pk)
    elif kind == "alliance":
        users = users.filter(main_character__alliance_id=entity.pk)
    else:
        return []
    return [u for u in users.distinct() if is_administrator(u)]
