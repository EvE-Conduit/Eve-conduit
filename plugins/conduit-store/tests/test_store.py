"""Corp Store: earning points from other plugins' events and by hand, buying, handing over and refunds."""

import pytest
from django.contrib.auth.models import Permission

from conduit.events import bus
from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit_store import services
from conduit_store.models import Item, Order, PointEntry, StoreSettings
from tests.conftest import make_user


@pytest.fixture
def setup(db):
    sync_installed()
    set_enabled("store", True)
    s = StoreSettings.load()
    s.referral_points, s.fleet_points, s.mentor_points = 100, 5, 50
    s.save()
    officer = make_user(90000100, "Officer Ola")
    officer.user_permissions.add(*Permission.objects.filter(content_type__app_label="store"))
    member = make_user(90000110, "Member Mo")
    item = Item.objects.create(name="Ferox", price=40, stock=3)
    return officer, member, item


def emit(capture, name, **payload):
    with capture(execute=True):
        bus.emit(name, **payload)


def test_points_from_referrals_mentoring_and_projects_are_paid_once(setup, django_capture_on_commit_callbacks):
    _, member, _ = setup
    for _ in range(2):
        emit(django_capture_on_commit_callbacks, "recruit.application_decided", user="Rookie", application_id=7, accepted=True,
             referrer_id=member.pk)
    emit(django_capture_on_commit_callbacks, "recruit.application_decided", application_id=8, accepted=False, referrer_id=member.pk)
    emit(django_capture_on_commit_callbacks, "recruit.application_decided", application_id=9, accepted=True)
    assert services.balance(member) == 100
    emit(django_capture_on_commit_callbacks, "mentors.graduated", mentor_id=member.pk, mentorship_id=3, user="Rookie")
    emit(django_capture_on_commit_callbacks, "projects.contribution_delivered", user_id=member.pk, points=25, contribution_id=4,
         project="Hurricanes")
    emit(django_capture_on_commit_callbacks, "projects.contribution_delivered", user_id=member.pk, points=25, contribution_id=4,
         project="Hurricanes")
    assert services.balance(member) == 175
    assert Notification.objects.filter(user=member, title="You earned 100 store points").exists()


def test_fleet_points_once_per_member_whatever_their_characters(setup, django_capture_on_commit_callbacks):
    pytest.importorskip("conduit_fleets")
    from conduit.accounts.models import Character
    from conduit_fleets.models import Fat, Fleet

    _, member, _ = setup
    Character.objects.create(id=90000111, name="Mo Alt", owner_hash="h-alt", user=member)
    stranger_char = 90000999  # not on the site: nobody to pay
    fleet = Fleet.objects.create(name="Sunday roam")
    for cid, name in ((90000110, "Member Mo"), (90000111, "Mo Alt"), (stranger_char, "Who")):
        Fat.objects.create(fleet=fleet, character_id=cid, character_name=name, via="manual")
    for _ in range(2):
        emit(django_capture_on_commit_callbacks, "fleets.ended", fleet_id=fleet.pk, fleet=fleet.name)
    assert services.balance(member) == 5 and PointEntry.objects.count() == 1


def test_fleet_points_skip_self_added_fats_and_the_fcs_own_unless_tracked(setup, django_capture_on_commit_callbacks):
    pytest.importorskip("conduit_fleets")
    from conduit.accounts.models import Character
    from conduit_fleets.models import Fat, Fleet

    officer, member, _ = setup
    Character.objects.create(id=90000101, name="Ola Alt", owner_hash="h-ola-alt", user=officer)
    other = make_user(90000120, "Pilot Pia")
    linker = make_user(90000130, "Linker Lu")
    fleet = Fleet.objects.create(name="Self-serve", fc=officer, created_by=officer)
    Fat.objects.create(fleet=fleet, character_id=90000110, character_name="Member Mo", via="manual", added_by=member)
    Fat.objects.create(fleet=fleet, character_id=90000100, character_name="Officer Ola", via="manual", added_by=officer)
    Fat.objects.create(fleet=fleet, character_id=90000101, character_name="Ola Alt", via="link", added_by=officer)
    Fat.objects.create(fleet=fleet, character_id=90000120, character_name="Pilot Pia", via="manual", added_by=officer)
    Fat.objects.create(fleet=fleet, character_id=90000130, character_name="Linker Lu", via="link", added_by=linker)
    emit(django_capture_on_commit_callbacks, "fleets.ended", fleet_id=fleet.pk, fleet=fleet.name)
    assert services.balance(member) == 0 and services.balance(officer) == 0
    assert services.balance(other) == 5 and services.balance(linker) == 5

    tracked = Fleet.objects.create(name="Tracked", fc=officer, created_by=officer)
    Fat.objects.create(fleet=tracked, character_id=90000100, character_name="Officer Ola", via="esi")
    emit(django_capture_on_commit_callbacks, "fleets.ended", fleet_id=tracked.pk, fleet=tracked.name)
    assert services.balance(officer) == 5  # ESI saw the FC in the in-game fleet


def test_nothing_is_paid_while_switched_off(setup, django_capture_on_commit_callbacks):
    _, member, _ = setup
    s = StoreSettings.load()
    s.mentor_points, s.projects_enabled = 0, False
    s.save()
    emit(django_capture_on_commit_callbacks, "mentors.graduated", mentor_id=member.pk, mentorship_id=3)
    emit(django_capture_on_commit_callbacks, "projects.contribution_delivered", user_id=member.pk, points=25, contribution_id=4)
    set_enabled("store", False)
    emit(django_capture_on_commit_callbacks, "recruit.application_decided", application_id=7, accepted=True, referrer_id=member.pk)
    assert services.balance(member) == 0


def test_buying_takes_points_checks_stock_limits_and_balance(setup, api_client):
    officer, member, item = setup
    services.award(member.pk, 100, "Start", "manual")
    api_client.force_login(member)
    resp = api_client.call("post", "/api/p/store/orders", {"item_id": item.pk, "quantity": 3})
    assert resp.status_code == 400 and "costs 120 points and you have 100" in resp.json()["detail"]
    resp = api_client.call("post", "/api/p/store/orders", {"item_id": item.pk, "quantity": 2})
    assert resp.status_code == 200 and resp.json()["balance"] == 20
    item.refresh_from_db()
    assert item.stock == 1
    assert Notification.objects.filter(user=officer, title="Store order from Member Mo").exists()

    services.award(member.pk, 200, "More", "manual")
    resp = api_client.call("post", "/api/p/store/orders", {"item_id": item.pk, "quantity": 2})
    assert resp.status_code == 400 and resp.json()["detail"] == "Only 1 left"
    item.stock, item.per_member_limit = None, 3
    item.save()
    resp = api_client.call("post", "/api/p/store/orders", {"item_id": item.pk, "quantity": 2})
    assert resp.status_code == 400 and "1 more" in resp.json()["detail"]
    item.active = False
    item.save()
    assert api_client.call("post", "/api/p/store/orders", {"item_id": item.pk, "quantity": 1}).status_code == 404


def test_the_balance_never_goes_below_zero(setup):
    _, member, item = setup
    item.stock = None
    item.save()
    services.award(member.pk, 50, "Start", "manual")
    services.buy(member, item.pk, 1)
    with pytest.raises(services.StoreError):
        services.buy(member, item.pk, 1)  # the second of two orders sent together finds the points already spent
    assert services.balance(member) == 10


def test_cancelling_refunds_and_restocks_handing_over_notifies(setup, api_client):
    officer, member, item = setup
    services.award(member.pk, 200, "Start", "manual")
    first = services.buy(member, item.pk, 1)
    second = services.buy(member, item.pk, 1)

    api_client.force_login(member)
    assert api_client.call("post", f"/api/p/store/orders/{first.pk}/cancel", {}).status_code == 200
    assert services.balance(member) == 160
    item.refresh_from_db()
    assert item.stock == 2
    assert api_client.call("post", f"/api/p/store/orders/{first.pk}/cancel", {}).status_code == 400
    assert api_client.call("post", f"/api/p/store/orders/{second.pk}/fulfil", {}).status_code == 403

    api_client.force_login(officer)
    resp = api_client.call("post", f"/api/p/store/orders/{second.pk}/fulfil", {"note": "In your hangar in Jita"})
    assert resp.status_code == 200 and resp.json()["status"] == "fulfilled"
    assert Notification.objects.filter(user=member, title="Your store order is ready: 1 × Ferox").exists()
    services.award(officer.pk, 100, "Start", "manual")
    own = services.buy(officer, item.pk, 1)
    resp = api_client.call("post", f"/api/p/store/orders/{own.pk}/fulfil", {})
    assert resp.status_code == 403 and Order.objects.get(pk=own.pk).status == "pending"  # not their own order
    third = services.buy(member, item.pk, 1)
    assert api_client.call("post", f"/api/p/store/orders/{third.pk}/cancel", {}).status_code == 400  # staff say why
    assert api_client.call("post", f"/api/p/store/orders/{third.pk}/cancel", {"note": "Out of Feroxes"}).status_code == 200
    assert services.balance(member) == 160 and Order.objects.get(pk=third.pk).status == "cancelled"
    # Refunds aren't "earned" on the leaderboard.
    assert services.leaderboard()["all_time"][0]["points"] == 200


def test_others_orders_are_hidden_and_managers_award_by_hand(setup, api_client):
    officer, member, item = setup
    other = make_user(90000120, "Other Oz")
    services.award(member.pk, 100, "Start", "manual")
    order = services.buy(member, item.pk, 1)

    api_client.force_login(other)
    assert api_client.call("post", f"/api/p/store/orders/{order.pk}/cancel", {}).status_code == 404
    for method, path in (("get", "/api/p/store/orders"), ("get", "/api/p/store/manage"), ("get", "/api/p/store/members?q=mem")):
        assert api_client.call(method, path).status_code == 403
    assert api_client.call("post", "/api/p/store/awards", {"user_id": other.pk, "points": 5, "reason": "x"}).status_code == 403

    api_client.force_login(officer)
    assert [m["name"] for m in api_client.call("get", "/api/p/store/members?q=o").json()] == []
    assert [m["name"] for m in api_client.call("get", "/api/p/store/members?q=mem").json()] == ["Member Mo"]
    assert api_client.call("post", "/api/p/store/awards", {"user_id": officer.pk, "points": 5, "reason": "me"}).status_code == 403
    assert api_client.call("post", "/api/p/store/awards", {"user_id": other.pk, "points": 5, "reason": ""}).status_code == 400
    resp = api_client.call("post", "/api/p/store/awards", {"user_id": other.pk, "points": 30, "reason": "Great op"})
    assert resp.status_code == 200 and resp.json()["awards"][0]["user"]["name"] == "Other Oz"
    api_client.call("post", "/api/p/store/awards", {"user_id": other.pk, "points": -10, "reason": "Typo"})
    assert services.balance(other) == 20

    resp = api_client.call("delete", f"/api/p/store/items/{item.pk}")
    assert resp.status_code == 400 and "hide it instead" in resp.json()["detail"]
    new = api_client.call("post", "/api/p/store/items", {"name": "PLEX", "price": 500})
    assert new.status_code == 200 and api_client.call("delete", f"/api/p/store/items/{new.json()['id']}").status_code == 200
    assert api_client.call("post", "/api/p/store/items", {"name": "Free", "price": 0}).status_code == 400


def test_guests_cant_use_the_store(setup, api_client):
    guest = make_user(90000130, "Guest Gil", member=False)
    api_client.force_login(guest)
    assert api_client.call("get", "/api/p/store/me").status_code == 403


def test_real_referral_and_project_delivery_pay_points(setup, django_capture_on_commit_callbacks):
    """End to end with the Recruitment and Industry Projects plugins, so their event payloads are checked too."""
    recruit_services = pytest.importorskip("conduit_recruitment.services")
    projects_services = pytest.importorskip("conduit_projects.services")
    from conduit.sde.models import ItemType
    from conduit_recruitment.models import Form

    officer, member, _ = setup
    set_enabled("recruit", True)
    set_enabled("projects", True)
    officer.user_permissions.add(*Permission.objects.filter(content_type__app_label__in=["recruit", "projects"]))
    officer = type(officer).objects.get(pk=officer.pk)

    rookie = make_user(90000120, "Rookie Ray", member=False)
    with django_capture_on_commit_callbacks(execute=True):
        app = recruit_services.apply(rookie, Form.objects.create(name="Join"), {}, referrer_id=member.pk)
    with django_capture_on_commit_callbacks(execute=True):
        recruit_services.decide(app, officer, True)
    assert services.balance(member) == 100

    ItemType.objects.create(id=24702, group_id=419, name="Hurricane", published=True)
    project = projects_services.save_project(None, {"name": "Canes", "notify": False}, officer)
    item = projects_services.add_item(project, 24702, 4, points_per_unit=10)
    c = projects_services.claim(item, member, 3)
    projects_services.deliver(c, member)
    with django_capture_on_commit_callbacks(execute=True):
        projects_services.confirm(c, officer)
    assert services.balance(member) == 130


def test_store_order_placed_is_a_discord_alert():
    et = bus.EVENT_TYPES["store.order_placed"]
    assert et.alert and et.manage == "store.manage_store" and et.plugin == "store"


@pytest.mark.django_db
def test_managers_switch_on_discord_pings(api_client):
    from conduit.events.models import EventPing

    manager = make_user(90000900, "Ping Manager")
    manager.user_permissions.add(Permission.objects.get(content_type__app_label="store", codename="manage_store"))
    other = make_user(90000901, "Not A Manager")
    other.user_permissions.add(Permission.objects.get(content_type__app_label="store", codename="fulfil_orders"))
    api_client.force_login(other)  # an officer who hands orders over may not
    assert api_client.call("put", "/api/pings/store.order_placed", {"ping": True}).status_code == 403
    api_client.force_login(manager)
    resp = api_client.call("put", "/api/pings/store.order_placed", {"ping": True, "roles": ["123"]})
    assert resp.status_code == 200 and resp.json()["ping"] is True
    assert EventPing.objects.get(event="store.order_placed").roles == ["123"]
