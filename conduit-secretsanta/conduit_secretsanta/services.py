"""Who sees which event, signing up, the draw, gifts, and telling people.

The pairings are the secret. A participant only ever gets their own giftee. Organisers get progress (who joined, who
sent, who got theirs) without the pairings, unless they ask for them with ``reveal_pairs``, which is audited. After the
end an organiser can show every pair to the participants.
"""

from __future__ import annotations

from datetime import UTC, timedelta

from django.contrib.auth.models import Group
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from conduit.access.models import State
from conduit.audit.services import record
from conduit.eve.models import portrait_url

from . import draw as drawing
from .models import Exclusion, Participant, SantaEvent

ORGANISE_PERM = "secretsanta.organise_events"
CATEGORY = "p.secretsanta"
#: The reminder goes out this long before the gift deadline.
REMIND_BEFORE = timedelta(days=2)
MAX_WISHLIST = 2000
MAX_THANKS = 1000
MAX_BUDGET = 10**15


class SantaError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def link(event: SantaEvent) -> str:
    return f"/p/secretsanta/{event.pk}"


def can_organise(user) -> bool:
    return user.has_perm(ORGANISE_PERM)


def phase(event: SantaEvent, now=None) -> str:
    """signup, closed (waiting for the draw), drawn (not sent yet), running (results sent) or ended."""
    now = now or timezone.now()
    if event.ended_at:
        return "ended"
    if event.published_at:
        return "running"
    if event.drawn_at:
        return "drawn"
    return "signup" if now < event.signup_closes_at else "closed"


# --- who sees what -------------------------------------------------------------------------------------------------


def _audience_q(user) -> Q:
    group_ids = list(user.groups.values_list("pk", flat=True))
    q = Q(states__isnull=True, groups__isnull=True) | Q(groups__in=group_ids)
    if user.state_id:
        q |= Q(states=user.state_id)
    return q


def may_join(event: SantaEvent, user) -> bool:
    return SantaEvent.objects.filter(pk=event.pk).filter(_audience_q(user)).exists()


def visible_to(user):
    """Events this user may join, and ones they're already in. Organisers see every event."""
    if can_organise(user):
        return SantaEvent.objects.all()
    mine = Participant.objects.filter(user=user).values("event_id")
    return SantaEvent.objects.filter(_audience_q(user) | Q(pk__in=mine)).distinct()


def get_event(user, event_id: int) -> SantaEvent:
    event = visible_to(user).filter(pk=event_id).first()
    if event is None:
        raise SantaError("No such event", 404)
    return event


def _mine(event: SantaEvent, user) -> Participant | None:
    return Participant.objects.filter(event=event, user=user).select_related("character", "user__main_character").first()


# --- output --------------------------------------------------------------------------------------------------------


def _iso(dt):
    return dt.isoformat() if dt else None


def _receiver(p: Participant) -> dict:
    """The character a participant's gift goes to: the one they picked, or their main if that one is gone or now
    belongs to someone else."""
    char = p.character if p.character and p.character.user_id == p.user_id else p.user.main_character
    return {"id": char.pk, "name": char.name, "portrait": portrait_url(char.pk, 64)} if char else None


def _person(p: Participant) -> dict:
    main = p.user.main_character
    return {"id": p.pk, "name": p.user.display_name, "portrait": portrait_url(main.pk, 64) if main else None}


def event_summary(e: SantaEvent, user, me: Participant | None = None) -> dict:
    return {
        "id": e.pk,
        "name": e.name,
        "description": e.description,
        "signup_closes_at": e.signup_closes_at.isoformat(),
        "gift_deadline": e.gift_deadline.isoformat(),
        "budget_isk": e.budget_isk,
        "phase": phase(e),
        "reveal_all": e.reveal_all,
        "participants": e.participants.count(),
        "joined": me is not None,
    }


def list_events(user) -> dict:
    events = list(visible_to(user).prefetch_related("states", "groups"))
    mine = {p.event_id: p for p in Participant.objects.filter(user=user, event__in=events)}
    return {"events": [event_summary(e, user, mine.get(e.pk)) for e in events], "can_organise": can_organise(user)}


def detail(event: SantaEvent, user) -> dict:
    """The event page. Only ever carries the viewer's own giftee, unless every pair has been shown."""
    me = _mine(event, user)
    p = phase(event)
    out = event_summary(event, user, me)
    out |= {
        "may_join": p == "signup" and me is None and may_join(event, user),
        # Main first: it's the one picked unless they choose another.
        "characters": [{"id": c.pk, "name": c.name, "portrait": portrait_url(c.pk, 64)}
                       for c in sorted(user.characters.all(), key=lambda c: (c.pk != user.main_character_id, c.name))],
        "me": None,
        "pairs": None,
        "organiser": None,
    }
    if me is not None:
        mine = {
            "id": me.pk,
            "character": _receiver(me),
            "wishlist": me.wishlist,
            "can_withdraw": event.drawn_at is None,
            "giving_to": None,
            "my_gift": None,
        }
        # What the viewer gives, once the results are out.
        if event.published_at and me.giftee_id:
            g = Participant.objects.select_related("character", "user__main_character").get(pk=me.giftee_id)
            mine["giving_to"] = {
                "name": g.user.display_name,
                "character": _receiver(g),
                "wishlist": g.wishlist,
                "sent_at": _iso(me.sent_at),
                "sent_note": me.sent_note,
                "received_at": _iso(me.received_at),
                "thanks": me.thanks,
            }
        # What the viewer gets: the gift's progress, never who sends it.
        if event.published_at:
            santa = Participant.objects.filter(giftee=me).first()
            if santa is not None:
                mine["my_gift"] = {"sent_at": _iso(santa.sent_at), "sent_note": santa.sent_note,
                                   "received_at": _iso(santa.received_at), "thanks": santa.thanks}
        out["me"] = mine
    if event.ended_at and event.reveal_all and (me is not None or can_organise(user)):
        out["pairs"] = _pairs(event)
    if can_organise(user):
        out["organiser"] = organiser_view(event)
    return out


def organiser_view(event: SantaEvent) -> dict:
    """Progress without the pairings: who joined, who sent a gift and who got one."""
    rows = list(event.participants.select_related("character", "user__main_character"))
    got = {p.giftee_id: p.received_at for p in rows if p.giftee_id}
    return {
        "notes": event.notes,
        "states": [{"id": s.pk, "name": s.name, "color": s.color} for s in event.states.all()],
        "groups": [{"id": g.pk, "name": g.name} for g in event.groups.all()],
        "drawn_at": _iso(event.drawn_at),
        "published_at": _iso(event.published_at),
        "ended_at": _iso(event.ended_at),
        "participants": [
            _person(p) | {
                "character": _receiver(p),
                "joined_at": p.joined_at.isoformat(),
                "has_wishlist": bool(p.wishlist.strip()),
                "sent_at": _iso(p.sent_at),
                # Whether the gift this person should get arrived, without saying who sent it.
                "received_at": _iso(got.get(p.pk)),
            }
            for p in rows
        ],
        "exclusions": [{"id": x.pk, "first": x.first_id, "second": x.second_id}
                       for x in event.exclusions.all()],
        "sent": sum(1 for p in rows if p.sent_at),
        "received": sum(1 for p in rows if p.received_at),
    }


def _pairs(event: SantaEvent) -> list[dict]:
    rows = {p.pk: p for p in event.participants.select_related("character", "user__main_character")}
    return [{"giver": _person(p), "giftee": _person(rows[p.giftee_id]) | {"character": _receiver(rows[p.giftee_id])},
             "sent_at": _iso(p.sent_at), "received_at": _iso(p.received_at)}
            for p in rows.values() if p.giftee_id in rows]


def widget(user) -> dict:
    """The dashboard: the viewer's current event and giftee, or one they can still join."""
    mine = (Participant.objects.filter(user=user, event__ended_at__isnull=True)
            .select_related("event").order_by("event__gift_deadline").first())
    if mine is not None:
        e = mine.event
        giving_to = None
        if e.published_at and mine.giftee_id:
            g = Participant.objects.select_related("character", "user__main_character").get(pk=mine.giftee_id)
            giving_to = {"name": g.user.display_name, "character": _receiver(g), "sent_at": _iso(mine.sent_at)}
        return {"event": event_summary(e, user, mine), "giving_to": giving_to}
    now = timezone.now()
    open_one = (visible_to(user).filter(signup_closes_at__gt=now, drawn_at__isnull=True)
                .filter(_audience_q(user)).order_by("signup_closes_at").first())
    return {"event": event_summary(open_one, user) if open_one else None, "giving_to": None}


# --- organising ----------------------------------------------------------------------------------------------------


def audience() -> dict:
    return {
        "states": [{"id": s.pk, "name": s.name, "color": s.color} for s in State.objects.all()],
        "groups": [{"id": g.pk, "name": g.name} for g in Group.objects.order_by("name")],
    }


def save_event(event: SantaEvent | None, by, *, name: str, description: str, notes: str, signup_closes_at, gift_deadline,
               budget_isk: int | None, states: list[int], groups: list[int], announce: bool = False,
               request=None) -> SantaEvent:
    name = name.strip()
    if not name:
        raise SantaError("Give it a name")
    # Times without a zone are EVE time.
    signup_closes_at, gift_deadline = (t if timezone.is_aware(t) else timezone.make_aware(t, UTC) for t in (signup_closes_at, gift_deadline))
    if gift_deadline <= signup_closes_at:
        raise SantaError("The gift deadline has to be after sign-up closes")
    if budget_isk is not None and budget_isk < 0:
        raise SantaError("The budget can't be negative")
    if budget_isk is not None and budget_isk > MAX_BUDGET:
        raise SantaError("That budget is too large")
    if event is not None and event.ended_at:
        raise SantaError("This event has ended")
    state_objs = list(State.objects.filter(pk__in=states))
    group_objs = list(Group.objects.filter(pk__in=groups))
    if len(state_objs) != len(set(states)) or len(group_objs) != len(set(groups)):
        raise SantaError("Some of those states or groups don't exist")
    new = event is None
    if new:
        event = SantaEvent(created_by=by)
    event.name, event.description, event.notes = name[:100], description.strip()[:5000], notes.strip()[:5000]
    event.signup_closes_at, event.gift_deadline, event.budget_isk = signup_closes_at, gift_deadline, budget_isk
    if not new and event.reminded_at and gift_deadline - REMIND_BEFORE > timezone.now():
        event.reminded_at = None  # a deadline moved later gets its reminder again
    with transaction.atomic():
        event.save()
        event.states.set(state_objs)
        event.groups.set(group_objs)
    record("secretsanta.create" if new else "secretsanta.update",
           f"{'created' if new else 'edited'} the Secret Santa \"{event.name}\"", request=request, target=event)
    if new and announce:
        _announce(event)
    return event


def _announce(event: SantaEvent):
    from conduit.access.services import site_members
    from conduit.notify.services import notify

    users = site_members()
    state_ids = list(event.states.values_list("pk", flat=True))
    group_ids = list(event.groups.values_list("pk", flat=True))
    if state_ids or group_ids:
        users = users.filter(Q(state_id__in=state_ids) | Q(groups__in=group_ids)).distinct()
    notify(list(users), f"Secret Santa: {event.name}", "Sign-up is open.", link=link(event), category=CATEGORY)


def delete_event(event: SantaEvent, request=None):
    record("secretsanta.delete", f"deleted the Secret Santa \"{event.name}\"", request=request, target=event)
    event.delete()


def _locked(event_id: int) -> SantaEvent:
    return SantaEvent.objects.select_for_update().get(pk=event_id)


def add_exclusion(event: SantaEvent, first_id: int, second_id: int, request=None) -> Exclusion:
    """Keep two participants from drawing each other. Changing exclusions after a draw throws the draw away."""
    with transaction.atomic():
        event = _locked(event.pk)
        if event.published_at:
            raise SantaError("The results have been sent; the draw can't change now")
        if first_id == second_id:
            raise SantaError("Pick two different people")
        people = {p.pk: p for p in event.participants.filter(pk__in=[first_id, second_id]).select_related("user__main_character")}
        if len(people) != 2:
            raise SantaError("Both have to be in this event")
        a, b = sorted((first_id, second_id))
        if Exclusion.objects.filter(first_id=a, second_id=b).exists():
            raise SantaError("Those two are already kept apart")
        x = Exclusion.objects.create(event=event, first_id=a, second_id=b)
        _clear_draw(event)
    record("secretsanta.exclusion", f"kept {people[a]} and {people[b]} apart in the Secret Santa \"{event.name}\"",
           request=request, target=event)
    return x


def remove_exclusion(event: SantaEvent, exclusion_id: int, request=None):
    with transaction.atomic():
        event = _locked(event.pk)
        x = event.exclusions.filter(pk=exclusion_id).select_related("first__user__main_character", "second__user__main_character").first()
        if x is None:
            raise SantaError("No such exclusion", 404)
        x.delete()
        # Fewer exclusions can't break a stored draw, so it stays.
    record("secretsanta.exclusion_removed", f"stopped keeping {x.first} and {x.second} apart in the Secret Santa \"{event.name}\"",
           request=request, target=event)


def _clear_draw(event: SantaEvent):
    if event.drawn_at:
        event.participants.update(giftee=None)
        event.drawn_at = None
        event.save(update_fields=["drawn_at"])


def run_draw(event: SantaEvent, request=None) -> SantaEvent:
    """Draw, or draw again while the results haven't been sent. Stored on the participants; never recomputed."""
    with transaction.atomic():
        event = _locked(event.pk)
        if event.published_at:
            raise SantaError("The results have been sent; the draw can't be done again")
        if event.ended_at:
            raise SantaError("This event has ended")
        if timezone.now() < event.signup_closes_at:
            raise SantaError("Sign-up is still open. Wait until it closes, or move its closing time to now.")
        rows = list(event.participants.select_related("user__main_character"))
        apart = [frozenset((x.first_id, x.second_id)) for x in event.exclusions.all()]
        try:
            pairs = drawing.draw([p.pk for p in rows], apart, {p.pk: str(p) for p in rows})
        except drawing.DrawError as exc:
            raise SantaError(str(exc)) from None
        again = event.drawn_at is not None
        event.participants.update(giftee=None)
        by_pk = {p.pk: p for p in rows}
        for giver, giftee in pairs.items():
            p = by_pk[giver]
            p.giftee_id = giftee
            p.save(update_fields=["giftee"])
        event.drawn_at = timezone.now()
        event.save(update_fields=["drawn_at"])
    record("secretsanta.draw", f"{'redrew' if again else 'drew'} the Secret Santa \"{event.name}\" ({len(rows)} people)",
           request=request, target=event)
    return event


def publish(event: SantaEvent, request=None) -> SantaEvent:
    """Send everyone their giftee. From here on the draw is fixed."""
    from conduit.notify.services import notify

    with transaction.atomic():
        event = _locked(event.pk)
        if not event.drawn_at:
            raise SantaError("Draw first")
        if event.published_at:
            raise SantaError("The results have already been sent")
        event.published_at = timezone.now()
        event.save(update_fields=["published_at"])
        rows = list(event.participants.select_related("user", "giftee__user__main_character", "giftee__character"))
    for p in rows:
        if p.giftee is None:
            continue
        to = _receiver(p.giftee)
        notify(p.user, f"Secret Santa: you're giving to {to['name'] if to else p.giftee.user.display_name}",
               f"{event.name}. Gift deadline {event.gift_deadline:%d %b %Y %H:%M} ET. Their wish list is on the event page.",
               link=link(event), level="success", category=CATEGORY)
    record("secretsanta.publish", f"sent the results of the Secret Santa \"{event.name}\"", request=request, target=event)
    return event


def reveal_pairs(event: SantaEvent, request=None) -> list[dict]:
    """Every pair, for an organiser who asked. Recorded each time."""
    if not event.drawn_at:
        raise SantaError("There's no draw yet")
    record("secretsanta.reveal", f"looked at who gives to whom in the Secret Santa \"{event.name}\"", request=request, target=event)
    return _pairs(event)


def remove_participant(event: SantaEvent, participant_id: int, request=None):
    """Take someone out. After a draw, whoever gave to them gets their giftee, and is told once the results are out."""
    from conduit.notify.services import notify

    mend(event)
    with transaction.atomic():
        event = _locked(event.pk)
        if event.ended_at:
            raise SantaError("This event has ended")
        p = event.participants.select_related("user__main_character").filter(pk=participant_id).first()
        if p is None:
            raise SantaError("No such participant", 404)
        giver = new_giftee = None
        if event.drawn_at:
            rows = list(event.participants.all())
            pairs = {r.pk: r.giftee_id for r in rows}
            names = {r.pk: str(r) for r in event.participants.select_related("user__main_character")}
            apart = [frozenset((x.first_id, x.second_id)) for x in event.exclusions.all()]
            try:
                giver_id, giftee_id = drawing.repair(pairs, p.pk, apart, names)
            except drawing.DrawError as exc:
                raise SantaError(str(exc)) from None
            p.giftee = None
            p.save(update_fields=["giftee"])
            if giver_id is not None and giftee_id is not None:
                giver = Participant.objects.select_related("user").get(pk=giver_id)
                new_giftee = Participant.objects.select_related("character", "user__main_character").get(pk=giftee_id)
                _give_to(giver, new_giftee)
        name, user = str(p), p.user
        p.delete()
    record("secretsanta.remove", f"took {name} out of the Secret Santa \"{event.name}\"", request=request, target=event)
    notify(user, f"Secret Santa: you were taken out of {event.name}", "An organiser took you out of the event.",
           link="/p/secretsanta", category=CATEGORY)
    if event.published_at and giver is not None:
        to = _receiver(new_giftee)
        notify(giver.user, f"Secret Santa: you're now giving to {to['name'] if to else new_giftee.user.display_name}",
               f"Someone left {event.name}, so your giftee changed. Their wish list is on the event page.",
               link=link(event), level="warning", category=CATEGORY, force=True)


def _give_to(giver: Participant, giftee: Participant):
    """A new giftee, so a new gift: what the giver did for the one before no longer counts."""
    giver.giftee = giftee
    giver.sent_at = giver.received_at = None
    giver.sent_note = giver.thanks = ""
    giver.save(update_fields=["giftee", "sent_at", "received_at", "sent_note", "thanks"])


def mend(event: SantaEvent) -> bool:
    """Close a gap in a stored draw. Someone who vanished without being taken out (their account was deleted) leaves
    one person giving to nobody and one getting from nobody: those two are joined up, like ``remove_participant``
    does. Returns whether anything changed. Left alone when the two are kept apart, or it isn't that simple."""
    from conduit.notify.services import notify

    with transaction.atomic():
        event = _locked(event.pk)
        if not event.drawn_at or event.ended_at:
            return False
        rows = list(event.participants.select_related("character", "user__main_character"))
        has_santa = {p.giftee_id for p in rows if p.giftee_id}
        givers = [p for p in rows if not p.giftee_id]
        waiting = [p for p in rows if p.pk not in has_santa]
        if len(givers) != 1 or len(waiting) != 1 or givers[0].pk == waiting[0].pk:
            return False
        giver, giftee = givers[0], waiting[0]
        a, b = sorted((giver.pk, giftee.pk))
        if event.exclusions.filter(first_id=a, second_id=b).exists():
            return False
        _give_to(giver, giftee)
    record("secretsanta.mend", f"joined up the Secret Santa \"{event.name}\" after someone in it was deleted",
           target=event)
    if event.published_at:
        to = _receiver(giftee)
        notify(giver.user, f"Secret Santa: you're now giving to {to['name'] if to else giftee.user.display_name}",
               f"Someone left {event.name}, so your giftee changed. Their wish list is on the event page.",
               link=link(event), level="warning", category=CATEGORY, force=True)
    return True


def end(event: SantaEvent, request=None) -> SantaEvent:
    if not event.published_at:
        raise SantaError("Send the results first")
    if event.ended_at:
        raise SantaError("This event has already ended")
    event.ended_at = timezone.now()
    event.save(update_fields=["ended_at"])
    record("secretsanta.end", f"ended the Secret Santa \"{event.name}\"", request=request, target=event)
    return event


def set_reveal_all(event: SantaEvent, on: bool, request=None) -> SantaEvent:
    if on and not event.ended_at:
        raise SantaError("Everyone can only see the pairs after the event ends")
    event.reveal_all = on
    event.save(update_fields=["reveal_all"])
    record("secretsanta.reveal_all", f"{'showed' if on else 'hid'} every pair of the Secret Santa \"{event.name}\" "
           f"{'to' if on else 'from'} its participants", request=request, target=event)
    return event


# --- taking part ---------------------------------------------------------------------------------------------------


def _own_character(user, character_id: int | None):
    if character_id is None:
        return user.main_character
    char = user.characters.filter(pk=character_id).first()
    if char is None:
        raise SantaError("That isn't one of your characters")
    return char


def sign_up(event: SantaEvent, user, character_id: int | None, wishlist: str) -> Participant:
    """Join, or change the receiving character and wish list. Joining is only while sign-up is open; changes are
    fine until the end."""
    char = _own_character(user, character_id)
    wishlist = wishlist.strip()[:MAX_WISHLIST]
    with transaction.atomic():
        event = _locked(event.pk)
        if event.ended_at:
            raise SantaError("This event has ended")
        me = Participant.objects.filter(event=event, user=user).first()
        if me is None:
            if phase(event) != "signup":
                raise SantaError("Sign-up has closed")
            if not may_join(event, user):
                raise SantaError("This event isn't open to you", 403)
            me = Participant.objects.create(event=event, user=user, character=char, wishlist=wishlist)
        else:
            me.character, me.wishlist = char, wishlist
            me.save(update_fields=["character", "wishlist"])
    return me


def withdraw(event: SantaEvent, user):
    with transaction.atomic():
        event = _locked(event.pk)
        me = Participant.objects.filter(event=event, user=user).first()
        if me is None:
            raise SantaError("You haven't signed up", 404)
        if event.drawn_at:
            raise SantaError("The draw has been done. Ask an organiser to take you out.")
        me.delete()


def _giving(event: SantaEvent, user) -> Participant:
    me = _mine(event, user)
    if me is None or not event.published_at or not me.giftee_id:
        raise SantaError("You have nobody to give to yet")
    return me


def mark_sent(event: SantaEvent, user, note: str) -> Participant:
    """The viewer sent their gift, with a note for their giftee (a contract, ISK). Their giftee is told."""
    from conduit.notify.services import notify

    me = _giving(event, user)
    first = me.sent_at is None
    me.sent_at = me.sent_at or timezone.now()
    me.sent_note = note.strip()[:500]
    me.save(update_fields=["sent_at", "sent_note"])
    if first:
        giftee = Participant.objects.select_related("user").get(pk=me.giftee_id)
        notify(giftee.user, "Secret Santa: your gift is on its way", me.sent_note or event.name, link=link(event),
               level="success", category=CATEGORY)
    return me


def unmark_sent(event: SantaEvent, user) -> Participant:
    me = _giving(event, user)
    if me.received_at:
        raise SantaError("Your giftee already has it")
    me.sent_at, me.sent_note = None, ""
    me.save(update_fields=["sent_at", "sent_note"])
    return me


def mark_received(event: SantaEvent, user, thanks: str) -> Participant:
    """The viewer got their gift, optionally with a thank-you. It reaches whoever sent it without naming them."""
    from conduit.notify.services import notify

    me = _mine(event, user)
    santa = Participant.objects.filter(giftee=me).select_related("user").first() if me and event.published_at else None
    if santa is None:
        raise SantaError("There's no gift for you to mark yet")
    thanks = thanks.strip()[:MAX_THANKS]
    first, new_thanks = santa.received_at is None, bool(thanks) and thanks != santa.thanks
    santa.received_at = santa.received_at or timezone.now()
    if thanks:
        santa.thanks = thanks
    santa.save(update_fields=["received_at", "thanks"])
    if first or new_thanks:
        title = "Secret Santa: your giftee got your gift" if first else "Secret Santa: a thank-you from your giftee"
        notify(santa.user, title, santa.thanks or event.name, link=link(event), level="success", category=CATEGORY)
    return santa


# --- reminders -----------------------------------------------------------------------------------------------------


def remind_due() -> int:
    """Hourly. Once per event, from two days before the gift deadline: remind everyone who hasn't marked their gift
    sent. Also closes any gap a deleted account left in a draw."""
    from conduit.notify.services import notify

    now = timezone.now()
    sent = 0
    for event in SantaEvent.objects.filter(drawn_at__isnull=False, ended_at__isnull=True,
                                           participants__giftee__isnull=True).distinct():
        mend(event)
    for event in SantaEvent.objects.filter(published_at__isnull=False, ended_at__isnull=True, reminded_at__isnull=True,
                                           gift_deadline__lte=now + REMIND_BEFORE):
        if not SantaEvent.objects.filter(pk=event.pk, reminded_at__isnull=True).update(reminded_at=now):
            continue
        late = event.participants.filter(sent_at__isnull=True, giftee__isnull=False).select_related("user")
        for p in late:
            notify(p.user, f"Secret Santa: gift due {event.gift_deadline:%d %b %H:%M} ET",
                   f"You haven't marked your gift for {event.name} sent yet.", link=link(event), level="warning",
                   category=CATEGORY)
            sent += 1
    return sent
