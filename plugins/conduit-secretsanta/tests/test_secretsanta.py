"""Secret Santa: the draw (nobody gets themselves, exclusions, impossible exclusions, taking someone out), who sees
which pairing, and an event from sign-up to the thank-you."""

import json
import random
from datetime import timedelta

import pytest
from django.contrib.auth.models import Group, Permission
from django.utils import timezone

from conduit.access.models import State
from conduit.accounts.models import Character
from conduit.audit.models import AuditEvent
from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit_secretsanta import draw, services
from conduit_secretsanta.models import Participant, SantaEvent
from tests.conftest import make_user

BASE = "/api/p/secretsanta"


# --- the draw on its own -------------------------------------------------------------------------------------------


def _is_one_cycle(pairs: dict) -> bool:
    start = next(iter(pairs))
    seen, at = set(), start
    while at not in seen:
        seen.add(at)
        at = pairs[at]
    return at == start and seen == set(pairs)


@pytest.mark.parametrize("n", [3, 4, 7, 30])
def test_nobody_gets_themselves_and_everyone_is_one_cycle(n):
    rng = random.Random(n)
    for _ in range(50):
        pairs = draw.draw(range(n), rng=rng)
        assert set(pairs) == set(range(n)) and set(pairs.values()) == set(range(n))
        assert all(g != r for g, r in pairs.items())
        assert _is_one_cycle(pairs)


def test_the_draw_is_random():
    rng = random.Random(1)
    assert len({tuple(sorted(draw.draw(range(6), rng=rng).items())) for _ in range(40)}) > 10


def test_exclusions_are_kept_both_ways():
    couples = [frozenset((0, 1)), frozenset((2, 3)), frozenset((4, 5))]
    rng = random.Random(2)
    for _ in range(100):
        pairs = draw.draw(range(8), couples, rng=rng)
        for g, r in pairs.items():
            assert frozenset((g, r)) not in couples
        assert _is_one_cycle(pairs)


def test_heavy_exclusions_are_solved_by_searching():
    # Each of 0..11 may only be paired with its two neighbours on a ring: only the ring itself (either way round) fits,
    # which shuffles practically never hit, so the search has to find it.
    ring = {frozenset((i, (i + 1) % 12)) for i in range(12)}
    apart = {frozenset((a, b)) for a in range(12) for b in range(12) if a != b} - ring
    pairs = draw.draw(range(12), apart, rng=random.Random(3))
    assert all(frozenset((g, r)) in ring for g, r in pairs.items()) and _is_one_cycle(pairs)


def test_too_few_people():
    with pytest.raises(draw.DrawError, match="at least 3 people; 2 signed up"):
        draw.draw(["a", "b"])


def test_impossible_exclusions_name_who_is_stuck():
    names = {1: "Alice", 2: "Bob", 3: "Carol", 4: "Dan"}
    with pytest.raises(draw.DrawError) as e:
        draw.draw([1, 2, 3, 4], [frozenset((1, 2)), frozenset((1, 3))], names)
    assert "Alice can only be paired with Dan" in str(e.value)
    with pytest.raises(draw.DrawError) as e:
        draw.draw([1, 2, 3], [frozenset((1, 2)), frozenset((1, 3))], names)
    assert "Alice is kept apart from everyone" in str(e.value)


def test_impossible_exclusions_without_anyone_stuck():
    # Two triangles sharing Carol: everyone has two people left, but any chain through everyone passes Carol twice.
    allowed = {frozenset(p) for p in [("a", "b"), ("a", "c"), ("b", "c"), ("c", "d"), ("c", "e"), ("d", "e")]}
    people = "abcde"
    apart = {frozenset((x, y)) for x in people for y in people if x != y} - allowed
    with pytest.raises(draw.DrawError, match="no single chain through everyone"):
        draw.draw(people, apart, rng=random.Random(4))


def test_repair_hands_the_removed_persons_giftee_to_their_giver():
    pairs = {"a": "b", "b": "c", "c": "d", "d": "a"}
    assert draw.repair(pairs, "c") == ("b", "d")


def test_repair_refuses_to_break_an_exclusion_or_leave_a_pair_alone():
    names = {"a": "Alice", "b": "Bob", "c": "Carol", "d": "Dan"}
    with pytest.raises(draw.DrawError, match="Bob give to Dan, but they are kept apart"):
        draw.repair({"a": "b", "b": "c", "c": "d", "d": "a"}, "c", [frozenset(("b", "d"))], names)
    with pytest.raises(draw.DrawError, match="Only two people"):
        draw.repair({"a": "b", "b": "a"}, "a")


# --- through the site ----------------------------------------------------------------------------------------------


@pytest.fixture
def site(db, corp):
    sync_installed()
    set_enabled("secretsanta", True)
    member = State.objects.create(name="Member", priority=10)
    public = State.objects.create(name="Guest", priority=0, public=True)  # before the users: saving a state re-sorts everyone
    people = {}
    for i, name in enumerate(["Alice", "Bob", "Carol", "Dan"]):
        u = make_user(91000001 + i, f"{name} Main", corporation=corp)
        u.state = member
        u.save()
        people[name] = u
    # Bob's gift should go to his alt.
    Character.objects.create(id=91000100, name="Bob Alt", owner_hash="hash-alt", user=people["Bob"], corporation=corp)
    organiser = make_user(91000050, "Olivia Organiser")
    organiser.user_permissions.add(Permission.objects.get(codename="organise_events"))
    guest = make_user(91000060, "Guest Pilot", member=False)
    guest.state = public
    guest.save()
    return {"people": people, "organiser": organiser, "guest": guest, "member": member}


def as_(api_client, user):
    api_client.force_login(user)
    return api_client


def ok(resp):
    assert resp.status_code == 200, resp.content
    return resp.json()


def create_event(api_client, organiser, **extra):
    now = timezone.now()
    body = {"name": "Winter gifts", "description": "One gift each.", "notes": "Budget is a hint.",
            "signup_closes_at": (now + timedelta(days=3)).isoformat(), "gift_deadline": (now + timedelta(days=20)).isoformat(),
            "budget_isk": 100_000_000, **extra}
    return ok(as_(api_client, organiser).call("post", f"{BASE}/events", body))


def close_signup(event_id):
    SantaEvent.objects.filter(pk=event_id).update(signup_closes_at=timezone.now() - timedelta(minutes=1))


def join_all(api_client, site, event_id):
    for name, u in site["people"].items():
        body = {"wishlist": f"{name} wants ships"}
        if name == "Bob":
            body["character_id"] = 91000100
        ok(as_(api_client, u).call("put", f"{BASE}/events/{event_id}/me", body))


@pytest.fixture
def drawn(site, api_client):
    """An event with everyone in, drawn and sent."""
    e = create_event(api_client, site["organiser"])
    join_all(api_client, site, e["id"])
    close_signup(e["id"])
    as_(api_client, site["organiser"])
    ok(api_client.call("post", f"{BASE}/events/{e['id']}/draw"))
    ok(api_client.call("post", f"{BASE}/events/{e['id']}/publish"))
    return e["id"]


def giftee_of(user, event_id):
    p = Participant.objects.get(event_id=event_id, user=user)
    return p.giftee.user


def test_signing_up_per_account_with_a_chosen_character(site, api_client):
    e = create_event(api_client, site["organiser"])
    bob = site["people"]["Bob"]
    d = ok(as_(api_client, bob).call("put", f"{BASE}/events/{e['id']}/me", {"character_id": 91000100, "wishlist": "A Gila"}))
    assert d["me"]["character"]["name"] == "Bob Alt" and d["me"]["wishlist"] == "A Gila"
    # Signing up again changes the same entry: one per person, however many alts.
    ok(api_client.call("put", f"{BASE}/events/{e['id']}/me", {"wishlist": "A Gila, or PLEX"}))
    assert Participant.objects.filter(event_id=e["id"], user=bob).count() == 1
    assert Participant.objects.get(event_id=e["id"], user=bob).character.name == "Bob Main"
    # Someone else's character isn't allowed.
    resp = api_client.call("put", f"{BASE}/events/{e['id']}/me", {"character_id": 91000001})
    assert resp.status_code == 400 and "isn't one of your characters" in resp.json()["detail"]
    # A picked character that moves to another account no longer gets the gift: their main does.
    ok(api_client.call("put", f"{BASE}/events/{e['id']}/me", {"character_id": 91000100}))
    Character.objects.filter(pk=91000100).update(user=site["people"]["Dan"])
    assert ok(api_client.call("get", f"{BASE}/events/{e['id']}"))["me"]["character"]["name"] == "Bob Main"
    # Withdrawing is fine until the draw.
    assert ok(api_client.call("delete", f"{BASE}/events/{e['id']}/me"))["me"] is None


def test_sign_up_closes_and_withdrawing_stops_at_the_draw(site, api_client):
    e = create_event(api_client, site["organiser"])
    join_all(api_client, site, e["id"])
    resp = as_(api_client, site["organiser"]).call("post", f"{BASE}/events/{e['id']}/draw")
    assert resp.status_code == 400 and "still open" in resp.json()["detail"]
    close_signup(e["id"])
    ok(api_client.call("post", f"{BASE}/events/{e['id']}/draw"))
    resp = as_(api_client, site["people"]["Alice"]).call("delete", f"{BASE}/events/{e['id']}/me")
    assert resp.status_code == 400 and "Ask an organiser" in resp.json()["detail"]
    late = make_user(91000070, "Late Larry")
    resp = as_(api_client, late).call("put", f"{BASE}/events/{e['id']}/me", {})
    assert resp.status_code == 400 and "closed" in resp.json()["detail"]


def test_who_may_join(site, api_client):
    elves = Group.objects.create(name="Elves")
    e = create_event(api_client, site["organiser"], groups=[elves.pk])
    alice, bob = site["people"]["Alice"], site["people"]["Bob"]
    bob.groups.add(elves)
    assert ok(as_(api_client, alice).call("get", f"{BASE}/events"))["events"] == []
    assert api_client.call("get", f"{BASE}/events/{e['id']}").status_code == 404
    assert api_client.call("put", f"{BASE}/events/{e['id']}/me", {}).status_code == 404
    assert ok(as_(api_client, bob).call("get", f"{BASE}/events/{e['id']}"))["may_join"] is True
    # Guests don't get the plugin at all.
    assert as_(api_client, site["guest"]).call("get", f"{BASE}/events").status_code == 403


def test_announcing_a_new_event_tells_who_may_join(site, api_client):
    e = create_event(api_client, site["organiser"], states=[site["member"].pk], announce=True)
    assert Notification.objects.filter(title="Secret Santa: Winter gifts", category="p.secretsanta").count() == 4
    assert not Notification.objects.filter(user=site["guest"]).exists()
    assert e["organiser"]["states"][0]["name"] == "Member"


def test_only_organisers_organise(site, api_client):
    e = create_event(api_client, site["organiser"])
    alice = site["people"]["Alice"]
    as_(api_client, alice)
    for method, path in [("post", "/draw"), ("post", "/publish"), ("post", "/reveal"), ("post", "/end"), ("delete", "")]:
        assert api_client.call(method, f"{BASE}/events/{e['id']}{path}").status_code == 403
    assert api_client.call("post", f"{BASE}/events", {"name": "x", "signup_closes_at": e["signup_closes_at"],
                                                       "gift_deadline": e["gift_deadline"]}).status_code == 403
    d = ok(api_client.call("get", f"{BASE}/events/{e['id']}"))
    assert d["organiser"] is None  # no notes, no progress


def test_draw_is_stored_and_redrawn_only_before_the_results_go_out(site, api_client):
    e = create_event(api_client, site["organiser"])
    join_all(api_client, site, e["id"])
    close_signup(e["id"])
    as_(api_client, site["organiser"])
    d = ok(api_client.call("post", f"{BASE}/events/{e['id']}/draw"))
    assert d["phase"] == "drawn"
    stored = dict(Participant.objects.filter(event_id=e["id"]).values_list("pk", "giftee_id"))
    assert all(g != r for g, r in stored.items()) and _is_one_cycle(stored)
    # Reading the event again doesn't change it: the draw is stored.
    ok(api_client.call("get", f"{BASE}/events/{e['id']}"))
    assert dict(Participant.objects.filter(event_id=e["id"]).values_list("pk", "giftee_id")) == stored
    # Nobody knows yet, not even the people in it.
    assert ok(as_(api_client, site["people"]["Alice"]).call("get", f"{BASE}/events/{e['id']}"))["me"]["giving_to"] is None
    as_(api_client, site["organiser"])
    ok(api_client.call("post", f"{BASE}/events/{e['id']}/draw"))
    assert AuditEvent.objects.filter(action="secretsanta.draw", summary__contains="redrew").exists()
    ok(api_client.call("post", f"{BASE}/events/{e['id']}/publish"))
    resp = api_client.call("post", f"{BASE}/events/{e['id']}/draw")
    assert resp.status_code == 400 and "can't be done again" in resp.json()["detail"]


def test_exclusions_through_the_site(site, api_client):
    e = create_event(api_client, site["organiser"])
    join_all(api_client, site, e["id"])
    close_signup(e["id"])
    ids = {p.user.display_name: p.pk for p in Participant.objects.filter(event_id=e["id"]).select_related("user__main_character")}
    as_(api_client, site["organiser"])
    ok(api_client.call("post", f"{BASE}/events/{e['id']}/draw"))
    # A new exclusion throws away a draw that hasn't been sent.
    d = ok(api_client.call("post", f"{BASE}/events/{e['id']}/exclusions", {"first": ids["Alice Main"], "second": ids["Bob Main"]}))
    assert d["phase"] == "closed" and len(d["organiser"]["exclusions"]) == 1
    for _ in range(10):
        ok(api_client.call("post", f"{BASE}/events/{e['id']}/draw"))
        a, b = (Participant.objects.get(pk=ids[n]) for n in ("Alice Main", "Bob Main"))
        assert a.giftee_id != b.pk and b.giftee_id != a.pk
    # Alice kept apart from Carol too leaves her only Dan: explained, and nothing stored.
    ok(api_client.call("post", f"{BASE}/events/{e['id']}/exclusions", {"first": ids["Carol Main"], "second": ids["Alice Main"]}))
    resp = api_client.call("post", f"{BASE}/events/{e['id']}/draw")
    assert resp.status_code == 400 and "Alice Main can only be paired with Dan Main" in resp.json()["detail"]
    assert not Participant.objects.filter(event_id=e["id"], giftee__isnull=False).exists()


def test_everyone_sees_only_their_own_giftee(site, api_client, drawn):
    people = site["people"]
    for name, u in people.items():
        d = ok(as_(api_client, u).call("get", f"{BASE}/events/{drawn}"))
        giftee = giftee_of(u, drawn)
        assert d["me"]["giving_to"]["name"] == giftee.display_name
        assert d["me"]["giving_to"]["wishlist"].endswith("wants ships")
        assert d["pairs"] is None and d["organiser"] is None
        # Nothing in the answer names their Secret Santa, or anyone else in the event.
        santa = Participant.objects.get(event_id=drawn, giftee__user=u).user
        others = [p for p in people.values() if p not in (u, giftee)]
        text = json.dumps(d)
        assert santa.display_name not in text or santa == giftee
        for o in others:
            assert o.display_name not in text
    # Bob's santa sends to his alt.
    santa = Participant.objects.get(event_id=drawn, giftee__user=people["Bob"]).user
    assert ok(as_(api_client, santa).call("get", f"{BASE}/events/{drawn}"))["me"]["giving_to"]["character"]["name"] == "Bob Alt"
    # Everyone got their giftee in a notification.
    for u in people.values():
        assert Notification.objects.filter(user=u, title__startswith="Secret Santa: you're giving to").count() == 1


def test_organisers_see_progress_but_not_pairings_until_they_reveal(site, api_client, drawn):
    d = ok(as_(api_client, site["organiser"]).call("get", f"{BASE}/events/{drawn}"))
    assert d["pairs"] is None and d["me"] is None
    org = d["organiser"]
    assert len(org["participants"]) == 4 and org["sent"] == 0
    assert not any(k in json.dumps(org) for k in ("giftee", "giving_to", "santa"))
    assert not AuditEvent.objects.filter(action="secretsanta.reveal").exists()
    pairs = ok(api_client.call("post", f"{BASE}/events/{drawn}/reveal"))["pairs"]
    assert len(pairs) == 4
    for row in pairs:
        giver = Participant.objects.get(pk=row["giver"]["id"])
        assert giver.giftee_id == row["giftee"]["id"]
    audit = AuditEvent.objects.get(action="secretsanta.reveal")
    assert audit.actor_id == site["organiser"].pk and "Winter gifts" in audit.summary


def test_gift_sent_received_and_an_anonymous_thank_you(site, api_client, drawn):
    alice = site["people"]["Alice"]
    giftee = giftee_of(alice, drawn)
    d = ok(as_(api_client, alice).call("post", f"{BASE}/events/{drawn}/sent", {"note": "Contract in Jita"}))
    assert d["me"]["giving_to"]["sent_at"] and d["me"]["giving_to"]["sent_note"] == "Contract in Jita"
    assert Notification.objects.filter(user=giftee, title="Secret Santa: your gift is on its way", body="Contract in Jita").exists()
    # The organiser sees that Alice sent something, not to whom.
    org = ok(as_(api_client, site["organiser"]).call("get", f"{BASE}/events/{drawn}"))["organiser"]
    assert org["sent"] == 1 and "Contract in Jita" not in json.dumps(org)
    # The giftee sees the gift coming and thanks whoever sent it.
    mine = ok(as_(api_client, giftee).call("get", f"{BASE}/events/{drawn}"))["me"]["my_gift"]
    assert mine["sent_note"] == "Contract in Jita" and mine["received_at"] is None
    d = ok(api_client.call("post", f"{BASE}/events/{drawn}/received", {"thanks": "Love the Gila!"}))
    assert d["me"]["my_gift"]["received_at"] and d["me"]["my_gift"]["thanks"] == "Love the Gila!"
    assert alice.display_name not in json.dumps(d) or giftee_of(giftee, drawn) == alice
    n = Notification.objects.get(user=alice, title="Secret Santa: your giftee got your gift")
    assert n.body == "Love the Gila!"
    # Once it's received the giver can't take back "sent".
    resp = as_(api_client, alice).call("delete", f"{BASE}/events/{drawn}/sent")
    assert resp.status_code == 400
    # The giver sees the thanks; the organiser counts it.
    assert ok(api_client.call("get", f"{BASE}/events/{drawn}"))["me"]["giving_to"]["thanks"] == "Love the Gila!"
    assert ok(as_(api_client, site["organiser"]).call("get", f"{BASE}/events/{drawn}"))["organiser"]["received"] == 1


def test_nothing_to_mark_before_the_results(site, api_client):
    e = create_event(api_client, site["organiser"])
    join_all(api_client, site, e["id"])
    as_(api_client, site["people"]["Alice"])
    assert api_client.call("post", f"{BASE}/events/{e['id']}/sent", {}).status_code == 400
    assert api_client.call("post", f"{BASE}/events/{e['id']}/received", {}).status_code == 400


def test_taking_someone_out_repairs_the_chain(site, api_client, drawn):
    people = site["people"]
    carol = people["Carol"]
    carols_santa = Participant.objects.get(event_id=drawn, giftee__user=carol)
    carols_giftee = giftee_of(carol, drawn)
    # Her santa had already sent a gift to Carol; it doesn't count for the new giftee.
    carols_santa.sent_at = timezone.now()
    carols_santa.save()
    carol_pk = Participant.objects.get(event_id=drawn, user=carol).pk
    ok(as_(api_client, site["organiser"]).call("delete", f"{BASE}/events/{drawn}/participants/{carol_pk}"))
    carols_santa.refresh_from_db()
    assert carols_santa.giftee.user == carols_giftee and carols_santa.sent_at is None
    left = dict(Participant.objects.filter(event_id=drawn).values_list("pk", "giftee_id"))
    assert len(left) == 3 and _is_one_cycle(left)
    # Named by the character the gift goes to (Bob's alt, if it's Bob).
    to = carols_santa.giftee.character.name
    assert Notification.objects.filter(user=carols_santa.user, title=f"Secret Santa: you're now giving to {to}").exists()
    assert Notification.objects.filter(user=carol, title="Secret Santa: you were taken out of Winter gifts").exists()
    assert AuditEvent.objects.filter(action="secretsanta.remove", summary__contains="Carol Main").exists()


def test_taking_someone_out_is_refused_when_it_breaks_an_exclusion(site, api_client, drawn):
    carol = Participant.objects.get(event_id=drawn, user=site["people"]["Carol"])
    santa, giftee = Participant.objects.get(giftee=carol), carol.giftee
    a, b = sorted((santa.pk, giftee.pk))
    from conduit_secretsanta.models import Exclusion

    Exclusion.objects.create(event_id=drawn, first_id=a, second_id=b)
    resp = as_(api_client, site["organiser"]).call("delete", f"{BASE}/events/{drawn}/participants/{carol.pk}")
    assert resp.status_code == 400 and "Remove that exclusion first" in resp.json()["detail"]
    assert Participant.objects.filter(pk=carol.pk).exists()


def test_a_deleted_account_does_not_leave_a_gap_in_the_chain(site, api_client, drawn):
    carol = site["people"]["Carol"]
    carols_santa = Participant.objects.get(event_id=drawn, giftee__user=carol)
    carols_giftee = giftee_of(carol, drawn)
    carol.delete()  # not taken out by an organiser: the account itself went
    carols_santa.refresh_from_db()
    assert carols_santa.giftee is None
    services.remind_due()  # the hourly task
    carols_santa.refresh_from_db()
    assert carols_santa.giftee.user == carols_giftee
    left = dict(Participant.objects.filter(event_id=drawn).values_list("pk", "giftee_id"))
    assert len(left) == 3 and _is_one_cycle(left)
    assert Notification.objects.filter(user=carols_santa.user, title__startswith="Secret Santa: you're now giving to").exists()
    assert services.mend(SantaEvent.objects.get(pk=drawn)) is False  # nothing left to do


def test_taking_out_someone_at_a_gap_that_cannot_be_closed(site, api_client, drawn):
    from conduit_secretsanta.models import Exclusion

    carol = site["people"]["Carol"]
    santa = Participant.objects.get(event_id=drawn, giftee__user=carol)
    waiting = Participant.objects.get(event_id=drawn, user=giftee_of(carol, drawn))
    a, b = sorted((santa.pk, waiting.pk))
    Exclusion.objects.create(event_id=drawn, first_id=a, second_id=b)
    carol.delete()
    assert services.mend(SantaEvent.objects.get(pk=drawn)) is False  # the two are kept apart
    # Whoever is waiting for a gift nobody gives can still be taken out.
    ok(as_(api_client, site["organiser"]).call("delete", f"{BASE}/events/{drawn}/participants/{waiting.pk}"))
    assert not Participant.objects.filter(pk=waiting.pk).exists()


def test_a_budget_too_large_to_store_is_refused(site, api_client):
    e = create_event(api_client, site["organiser"])
    body = {"name": "Winter gifts", "signup_closes_at": e["signup_closes_at"], "gift_deadline": e["gift_deadline"],
            "budget_isk": 10**19}
    resp = as_(api_client, site["organiser"]).call("put", f"{BASE}/events/{e['id']}", body)
    assert resp.status_code == 400 and "too large" in resp.json()["detail"]


def test_reminder_before_the_deadline_goes_to_those_who_have_not_sent(site, api_client, drawn):
    alice, bob = site["people"]["Alice"], site["people"]["Bob"]
    Participant.objects.filter(event_id=drawn, user=alice).update(sent_at=timezone.now())
    assert services.remind_due() == 0  # the deadline is weeks away
    SantaEvent.objects.filter(pk=drawn).update(gift_deadline=timezone.now() + timedelta(days=1))
    assert services.remind_due() == 3 and services.remind_due() == 0
    assert Notification.objects.filter(user=bob, title__startswith="Secret Santa: gift due").exists()
    assert not Notification.objects.filter(user=alice, title__startswith="Secret Santa: gift due").exists()


def test_every_pair_shown_after_the_end_if_the_organiser_wants(site, api_client, drawn):
    alice = site["people"]["Alice"]
    as_(api_client, site["organiser"])
    resp = api_client.call("put", f"{BASE}/events/{drawn}/reveal-all", {"on": True})
    assert resp.status_code == 400  # not before the end
    ok(api_client.call("post", f"{BASE}/events/{drawn}/end"))
    assert ok(as_(api_client, alice).call("get", f"{BASE}/events/{drawn}"))["pairs"] is None
    ok(as_(api_client, site["organiser"]).call("put", f"{BASE}/events/{drawn}/reveal-all", {"on": True}))
    d = ok(as_(api_client, alice).call("get", f"{BASE}/events/{drawn}"))
    assert d["phase"] == "ended" and len(d["pairs"]) == 4
    # Someone who wasn't in it still sees nothing.
    outsider = make_user(91000080, "Outsider")
    assert ok(as_(api_client, outsider).call("get", f"{BASE}/events/{drawn}"))["pairs"] is None


def test_widget_shows_the_current_giftee_or_an_open_event(site, api_client, drawn):
    alice = site["people"]["Alice"]
    w = ok(as_(api_client, alice).call("get", f"{BASE}/widget"))
    assert w["event"]["id"] == drawn and w["giving_to"]["name"] == giftee_of(alice, drawn).display_name
    open_one = create_event(api_client, site["organiser"], name="Spring gifts")
    outsider = make_user(91000081, "Newbie")
    w = ok(as_(api_client, outsider).call("get", f"{BASE}/widget"))
    assert w["event"]["id"] == open_one["id"] and w["giving_to"] is None


def test_editing_and_validation(site, api_client):
    e = create_event(api_client, site["organiser"])
    as_(api_client, site["organiser"])
    body = {"name": "Winter gifts", "signup_closes_at": e["gift_deadline"], "gift_deadline": e["signup_closes_at"]}
    resp = api_client.call("put", f"{BASE}/events/{e['id']}", body)
    assert resp.status_code == 400 and "after sign-up closes" in resp.json()["detail"]
    d = ok(api_client.call("put", f"{BASE}/events/{e['id']}", {**body, "name": "Yule", "signup_closes_at": e["signup_closes_at"],
                                                              "gift_deadline": e["gift_deadline"]}))
    assert d["name"] == "Yule" and d["organiser"]["notes"] == ""
    assert ok(api_client.call("delete", f"{BASE}/events/{e['id']}")) == {"ok": True}
    assert AuditEvent.objects.filter(action="secretsanta.delete").exists()
