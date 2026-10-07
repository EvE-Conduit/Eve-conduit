"""Group membership: joining, leaving, requests to leaders, and smart groups run by rules.

Every membership change goes through ``add_member``/``remove_member`` so it is audited and
announced as ``group.joined``/``group.left`` with ``via`` set to self, request, admin, leader,
api, auto or state.
"""

from __future__ import annotations

import logging
from datetime import timedelta

from django.contrib.auth.models import Group
from django.db import IntegrityError, transaction
from django.utils import timezone

from conduit.audit.services import record
from conduit.events import bus
from conduit.notify import notify

from . import rules
from .models import AutoGroupGrace, GroupProfile, GroupRequest


log = logging.getLogger(__name__)


class GroupError(Exception):
    """A membership change that isn't allowed; the message is shown to the user."""

    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def profile_of(group: Group) -> GroupProfile:
    profile, _ = GroupProfile.objects.get_or_create(group=group)
    return profile


def can_manage(user, profile: GroupProfile) -> bool:
    """Leaders of the group, and anyone who manages access, handle its requests and members."""
    return user.has_perm("site.manage_access") or profile.is_leader(user)


def led_groups(user):
    if user.has_perm("site.manage_access"):
        return Group.objects.filter(profile__isnull=False)
    return Group.objects.filter(profile__in=GroupProfile.objects.filter(leaders=user)).union(
        Group.objects.filter(profile__leader_groups__user=user)
    )


def led_group_ids(user) -> set[int]:
    if user.has_perm("site.manage_access"):
        return set(GroupProfile.objects.values_list("group_id", flat=True))
    direct = set(GroupProfile.objects.filter(leaders=user).values_list("group_id", flat=True))
    via = set(GroupProfile.objects.filter(leader_groups__user=user).values_list("group_id", flat=True))
    return direct | via


def is_member(user, group: Group) -> bool:
    return user.groups.filter(pk=group.pk).exists()


def failed_requirements(user, profile: GroupProfile) -> list[str]:
    """Why the user can't be in the group, in words; empty when they may."""
    out = []
    if not profile.allows(user):
        names = ", ".join(profile.allowed_states.values_list("name", flat=True))
        out.append(f"Only for: {names}")
    if not _passes(user, profile):
        out += [c["text"] for c in rules.check_ruleset(user, profile.requirements) if not c["ok"]]
    return out


def _passes(user, profile: GroupProfile) -> bool:
    return rules.evaluate_ruleset(user, profile.requirements)


def requirement_checklist(user, profile: GroupProfile) -> list[dict]:
    items = []
    if profile.allowed_states.exists():
        names = ", ".join(profile.allowed_states.values_list("name", flat=True))
        items.append({"text": f"State is {names}", "ok": profile.allows(user)})
    return items + rules.check_ruleset(user, profile.requirements)


def eligible(user, profile: GroupProfile) -> bool:
    return profile.allows(user) and _passes(user, profile)


# --- membership --------------------------------------------------------------------------


def _may_grant_admin(via: str, request=None, actor=None) -> bool:
    """Groups carrying administrator permissions are only filled by people who manage access."""
    if via == "admin":
        return True  # the admin endpoints already require site.manage_access
    approver = actor or (request.user if via == "leader" and request is not None else None)
    return bool(approver is not None and approver.has_perm("site.manage_access"))


def add_member(user, group: Group, via: str, *, request=None, actor=None, note: str = "") -> bool:
    if is_member(user, group):
        return False
    from .services import admin_permissions_in

    if admin_permissions_in(group.permissions.all()) and not _may_grant_admin(via, request, actor):
        if via == "auto":
            log.warning("Smart group %s grants administrator permissions; not adding %s automatically", group.name, user)
            return False
        raise GroupError(f"{group.name} grants administrator permissions, so only an administrator can add members", 403)
    user.groups.add(group)
    AutoGroupGrace.objects.filter(user=user, group=group).delete()
    who = actor.display_name if actor else ("System" if via in ("auto", "state") else user.display_name)
    summary = f"{user.display_name} joined {group.name}" if via == "self" else f"{who} added {user.display_name} to {group.name}"
    if via == "self":
        record("group.joined", f"joined {group.name}", request=request, target=group, actor=actor)
    else:
        record("group.member_added", f"added {user.display_name} to {group.name}" + (f" ({note})" if note else ""),
               request=request, target=group, actor=actor, details={"user_id": user.pk, "user": user.display_name, "via": via})
    bus.emit("group.joined", user_id=user.pk, user=user.display_name, group_id=group.pk, group=group.name, via=via, summary=summary)
    return True


def remove_member(user, group: Group, via: str, *, request=None, actor=None, note: str = "") -> bool:
    if not is_member(user, group):
        return False
    user.groups.remove(group)
    AutoGroupGrace.objects.filter(user=user, group=group).delete()
    who = actor.display_name if actor else ("System" if via in ("auto", "state") else user.display_name)
    summary = f"{user.display_name} left {group.name}" if via == "self" else f"{who} removed {user.display_name} from {group.name}"
    if via == "self":
        record("group.left", f"left {group.name}", request=request, target=group, actor=actor)
    else:
        record("group.member_removed", f"removed {user.display_name} from {group.name}" + (f" ({note})" if note else ""),
               request=request, target=group, actor=actor, details={"user_id": user.pk, "user": user.display_name, "via": via})
    bus.emit("group.left", user_id=user.pk, user=user.display_name, group_id=group.pk, group=group.name, via=via, summary=summary)
    return True


# --- self service and requests --------------------------------------------------------------


def pending_request(user, group: Group, kind: str) -> GroupRequest | None:
    return GroupRequest.objects.filter(user=user, group=group, kind=kind, status=GroupRequest.Status.PENDING).first()


def _create_request(user, group: Group, kind: str, message: str, request=None) -> GroupRequest:
    if pending_request(user, group, kind):
        raise GroupError("You already asked; a leader will get back to you")
    try:
        with transaction.atomic():
            req = GroupRequest.objects.create(user=user, group=group, kind=kind, message=message[:500])
    except IntegrityError:
        raise GroupError("You already asked; a leader will get back to you") from None
    verb = "join" if kind == GroupRequest.Kind.JOIN else "leave"
    record("group.request_created", f"asked to {verb} {group.name}", request=request, target=group,
           details={"request_id": req.pk, "message": req.message})
    bus.emit("group.request_created", user_id=user.pk, user=user.display_name, group_id=group.pk, group=group.name,
             kind=kind, request_id=req.pk, link="/groups/manage",
             summary=f"{user.display_name} asked to {verb} {group.name}" + (f": “{req.message}”" if req.message else ""))
    leaders = list(profile_of(group).leader_users().exclude(pk=user.pk))
    if not leaders:
        from conduit.notify.services import users_with_perm

        leaders = [u for u in users_with_perm("site.manage_access") if u.pk != user.pk]
    notify(leaders, f"{user.display_name} asked to {verb} {group.name}", req.message, link="/groups/manage",
           category="groups", data={"request_id": req.pk, "group_id": group.pk})
    return req


def join(user, group: Group, message: str = "", request=None) -> tuple[str, GroupRequest | None]:
    """Join an open group, or ask to join one that needs approval. Returns ("joined"|"requested", request)."""
    profile = profile_of(group)
    if is_member(user, group):
        raise GroupError("You're already a member")
    if profile.auto:
        raise GroupError("Membership of this group is automatic", 403)
    if profile.join_mode == GroupProfile.JoinMode.CLOSED:
        raise GroupError("You can't join or leave this group yourself", 403)
    if profile.hidden and not profile.allows(user):
        raise GroupError("Group not found", 404)
    missing = failed_requirements(user, profile)
    if missing:
        raise GroupError("You don't meet the requirements: " + "; ".join(missing), 403)
    if profile.join_mode == GroupProfile.JoinMode.OPEN:
        add_member(user, group, "self", request=request)
        return "joined", None
    return "requested", _create_request(user, group, GroupRequest.Kind.JOIN, message, request)


def leave(user, group: Group, message: str = "", request=None) -> tuple[str, GroupRequest | None]:
    profile = profile_of(group)
    if not is_member(user, group):
        raise GroupError("You're not a member")
    if profile.auto:
        raise GroupError("Membership of this group is automatic", 403)
    if profile.leave_mode == GroupProfile.LeaveMode.CLOSED:
        raise GroupError("You can't join or leave this group yourself", 403)
    if profile.leave_mode == GroupProfile.LeaveMode.OPEN:
        remove_member(user, group, "self", request=request)
        return "left", None
    return "requested", _create_request(user, group, GroupRequest.Kind.LEAVE, message, request)


def cancel(req: GroupRequest, user, request=None):
    if req.user_id != user.pk:
        raise GroupError("Request not found", 404)
    if req.status != GroupRequest.Status.PENDING:
        raise GroupError("That request has already been answered")
    req.status = GroupRequest.Status.CANCELLED
    req.decided_at = timezone.now()
    req.save(update_fields=["status", "decided_at"])
    record("group.request_cancelled", f"withdrew their request to {req.kind} {req.group.name}", request=request, target=req.group)


def decide(req: GroupRequest, leader, approve: bool, response: str = "", request=None):
    profile = profile_of(req.group)
    if not can_manage(leader, profile):
        raise GroupError("You don't lead this group", 403)
    if req.status != GroupRequest.Status.PENDING:
        raise GroupError("That request has already been answered")
    if approve and req.kind == GroupRequest.Kind.JOIN and not profile.allows(req.user):
        raise GroupError(f"{req.user.display_name}'s state isn't allowed in this group")
    with transaction.atomic():
        req.status = GroupRequest.Status.APPROVED if approve else GroupRequest.Status.REJECTED
        req.response = response[:500]
        req.decided_by = leader
        req.decided_at = timezone.now()
        req.save()
        if approve:
            if req.kind == GroupRequest.Kind.JOIN:
                add_member(req.user, req.group, "request", request=request, actor=leader)
            else:
                remove_member(req.user, req.group, "request", request=request, actor=leader)
    verb = "join" if req.kind == GroupRequest.Kind.JOIN else "leave"
    outcome = "approved" if approve else "rejected"
    record("group.request_decided", f"{outcome} {req.user.display_name}'s request to {verb} {req.group.name}",
           request=request, target=req.group, actor=leader if request is None else None,
           details={"request_id": req.pk, "response": req.response, "approved": approve})
    bus.emit("group.request_decided", user_id=req.user_id, user=req.user.display_name, group_id=req.group_id,
             group=req.group.name, kind=req.kind, approved=approve, decided_by=leader.display_name,
             level="success" if approve else "warning",
             summary=f"{leader.display_name} {outcome} {req.user.display_name}'s request to {verb} {req.group.name}")
    if approve:
        title = f"You're now in {req.group.name}" if req.kind == GroupRequest.Kind.JOIN else f"You've left {req.group.name}"
    else:
        title = f"Your request to {verb} {req.group.name} was declined"
    notify(req.user, title, req.response, link="/groups", level="success" if approve else "warning", category="groups",
           data={"request_id": req.pk, "group_id": req.group_id})


# --- smart groups -----------------------------------------------------------------------------


def matches(user, profile: GroupProfile) -> bool:
    return bool((profile.rules or {}).get("rules")) and profile.allows(user) and rules.evaluate_ruleset(user, profile.rules)


def _apply(user, profile: GroupProfile, now) -> str | None:
    group = profile.group
    member = is_member(user, group)
    if matches(user, profile):
        AutoGroupGrace.objects.filter(user=user, group=group).delete()
        if not member:
            add_member(user, group, "auto", note="matches the group's rules")
            notify(user, f"You've been added to {group.name}", "You now meet the rules for this group.",
                   link="/groups", level="success", category="groups")
            return "added"
        return None
    if not member or not profile.auto_remove:
        return None
    if profile.grace_hours:
        grace, _ = AutoGroupGrace.objects.get_or_create(user=user, group=group, defaults={"failing_since": now})
        if grace.failing_since > now - timedelta(hours=profile.grace_hours):
            return "grace"
    remove_member(user, group, "auto", note="no longer matches the group's rules")
    notify(user, f"You've been removed from {group.name}", "You no longer meet the rules for this group: "
           + rules.describe_ruleset(profile.rules), link="/groups", level="warning", category="groups")
    return "removed"


def evaluate_group(profile: GroupProfile, users=None) -> dict:
    """Bring a smart group's membership in line with its rules."""
    from conduit.accounts.models import User

    counts = {"added": 0, "removed": 0, "grace": 0}
    if not profile.auto:
        return counts
    now = timezone.now()
    users = users if users is not None else User.objects.filter(is_active=True).select_related("main_character", "state")
    for user in users:
        outcome = _apply(user, profile, now)
        if outcome:
            counts[outcome] += 1
    profile.last_evaluated = now
    profile.save(update_fields=["last_evaluated"])
    return counts


def evaluate_user(user) -> dict:
    out = {}
    now = timezone.now()
    for profile in GroupProfile.objects.filter(auto=True).select_related("group").prefetch_related("allowed_states"):
        outcome = _apply(user, profile, now)
        if outcome:
            out[profile.group.name] = outcome
    return out


def evaluate_all() -> dict:
    return {
        p.group.name: evaluate_group(p)
        for p in GroupProfile.objects.filter(auto=True).select_related("group").prefetch_related("allowed_states")
    }


def preview(ruleset: dict, allowed_states: list[int] | None = None, limit: int = 50) -> dict:
    """Who matches a rule set right now (before it's saved)."""
    from conduit.accounts.models import User
    from conduit.schemas import character_brief

    hits = []
    for user in User.objects.filter(is_active=True).select_related("main_character__corporation", "main_character__alliance", "state"):
        if allowed_states and user.state_id not in allowed_states:
            continue
        if (ruleset or {}).get("rules") and rules.evaluate_ruleset(user, ruleset):
            hits.append(user)
    return {
        "count": len(hits),
        "users": [{"id": u.pk, "name": u.display_name, "main": character_brief(u.main_character)} for u in hits[:limit]],
    }
