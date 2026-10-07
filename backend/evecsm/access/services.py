from django.db import transaction

from .models import GroupProfile, State


def resolve_state(user) -> State | None:
    for state in State.objects.prefetch_related("member_characters").order_by("-priority"):
        if state.matches(user.main_character):
            return state
    return None


@transaction.atomic
def recompute_user_state(user) -> State | None:
    """Re-evaluate a user's state and drop groups the new state may not hold."""
    from evecsm.events import bus

    state = resolve_state(user)
    if state != user.state:
        old = user.state
        user.state = state
        user.save(update_fields=["state"])
        bus.emit("user.state_changed", user_id=user.pk, user=user.display_name,
                 old_state=old.name if old else None, new_state=state.name if state else None,
                 summary=f"{user.display_name}: {old.name if old else 'no state'} → {state.name if state else 'no state'}")
    for profile in GroupProfile.objects.filter(group__user=user).prefetch_related("allowed_states"):
        if not profile.allows(user):
            user.groups.remove(profile.group)
            bus.emit("group.left", user_id=user.pk, user=user.display_name, group_id=profile.group_id,
                     group=profile.group.name, via="state", summary=f"{user.display_name} lost {profile.group.name} (state changed)")
    return state


def recompute_all_states():
    from evecsm.accounts.models import User

    for user in User.objects.select_related("main_character", "state"):
        recompute_user_state(user)


# Permissions that control the site itself. Only people who already manage access may hand these out:
# never group leaders, self-service joining, smart-group rules, or API keys.
ADMIN_PERMISSIONS = frozenset({
    "site.manage_site",
    "site.manage_access",
    "site.manage_modules",
    "site.manage_api",
    "site.impersonate_users",
})


def admin_permissions_in(permissions) -> list[str]:
    """The administrator permissions among ``permissions`` (a Permission queryset)."""
    names = {f"{app}.{code}" for app, code in permissions.values_list("content_type__app_label", "codename")}
    return sorted(ADMIN_PERMISSIONS & names)
