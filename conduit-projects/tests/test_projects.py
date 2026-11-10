"""Industry projects: claiming, delivering and confirming, the Corp Store event, pasted lists, industry hints."""

from datetime import timedelta

import pytest
from django.contrib.auth.models import Group, Permission
from django.utils import timezone

from conduit.events import bus
from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit.sde.models import ItemType
from conduit.sheet.industry.models import IndustryJob
from conduit_projects import services
from conduit_projects.models import Contribution, Project
from tests.conftest import make_user

HURRICANE, TRITANIUM, PYERITE = 24702, 34, 35


@pytest.fixture
def setup(db):
    sync_installed()
    set_enabled("projects", True)
    ItemType.objects.create(id=HURRICANE, group_id=419, name="Hurricane", published=True)
    ItemType.objects.create(id=TRITANIUM, group_id=18, name="Tritanium", published=True)
    ItemType.objects.create(id=PYERITE, group_id=18, name="Pyerite", published=True)
    boss = make_user(90000100, "Boss Builder")
    boss.user_permissions.add(Permission.objects.get(content_type__app_label="projects", codename="manage_projects"))
    boss = type(boss).objects.get(pk=boss.pk)
    pilot = make_user(90000101, "Pilot Hammer")
    other = make_user(90000102, "Pilot Anvil")
    project = services.save_project(None, {"name": "Deployment doctrine", "location": "Staging Keepstar", "notify": False}, boss)
    item = services.add_item(project, HURRICANE, 20, points_per_unit=10, isk_per_unit=1000000)
    return project, item, boss, pilot, other


def test_claims_cannot_exceed_what_is_left(setup, api_client):
    project, item, boss, pilot, other = setup
    api_client.force_login(pilot)
    ok = api_client.call("post", f"/api/p/projects/items/{item.pk}/claim", {"quantity": 15})
    assert ok.status_code == 200 and ok.json()["items"][0]["free"] == 5
    api_client.force_login(other)
    over = api_client.call("post", f"/api/p/projects/items/{item.pk}/claim", {"quantity": 6})
    assert over.status_code == 400 and "Only 5 left" in over.json()["detail"]
    assert api_client.call("post", f"/api/p/projects/items/{item.pk}/claim", {"quantity": 5}).status_code == 200
    # Changing one's own claim counts what they already hold.
    api_client.force_login(pilot)
    assert api_client.call("post", f"/api/p/projects/items/{item.pk}/claim", {"quantity": 12}).status_code == 200
    assert Contribution.objects.get(user=pilot).quantity == 12
    assert api_client.call("post", f"/api/p/projects/items/{item.pk}/claim", {"quantity": 16}).status_code == 400
    c = Contribution.objects.get(user=pilot)
    assert api_client.call("post", f"/api/p/projects/contributions/{c.pk}/release").status_code == 200
    assert not Contribution.objects.filter(user=pilot).exists()
    # Someone else's claim isn't theirs to release.
    theirs = Contribution.objects.get(user=other)
    assert api_client.call("post", f"/api/p/projects/contributions/{theirs.pk}/release").status_code == 403


def test_deliver_confirm_emits_points_and_completes(setup, api_client, monkeypatch):
    project, item, boss, pilot, other = setup
    emitted = []
    real_emit = bus.emit
    monkeypatch.setattr(bus, "emit", lambda name, **kw: (emitted.append((name, kw)), real_emit(name, **kw))[1])
    c = services.claim(item, pilot, 20)
    api_client.force_login(pilot)
    assert api_client.call("post", f"/api/p/projects/contributions/{c.pk}/deliver", {"note": "Corp hangar 2"}).status_code == 200
    assert Notification.objects.filter(user=boss, title="Pilot Hammer delivered 20 × Hurricane").exists()
    # Members can't confirm their own.
    assert api_client.call("post", f"/api/p/projects/contributions/{c.pk}/confirm").status_code == 403

    api_client.force_login(boss)
    queue = api_client.call("get", "/api/p/projects/queue").json()
    assert [q["id"] for q in queue] == [c.pk] and queue[0]["note"] == "Corp hangar 2"
    assert api_client.call("post", f"/api/p/projects/contributions/{c.pk}/confirm").status_code == 200
    delivered = [kw for name, kw in emitted if name == "projects.contribution_delivered"]
    assert delivered == [{**delivered[0], "user_id": pilot.pk, "project_id": project.pk, "contribution_id": c.pk,
                          "item": "Hurricane", "quantity": 20, "points": 200}]
    assert {"user", "project", "summary", "link"} <= set(delivered[0])
    project.refresh_from_db()
    assert project.status == Project.Status.DONE and any(name == "projects.completed" for name, _ in emitted)
    assert Notification.objects.filter(user=pilot, title="Delivery confirmed: 20 × Hurricane").exists()


def test_reject_sends_a_delivery_back(setup, api_client):
    project, item, boss, pilot, _ = setup
    c = services.claim(item, pilot, 5)
    services.deliver(c, pilot)
    api_client.force_login(boss)
    assert api_client.call("post", f"/api/p/projects/contributions/{c.pk}/reject", {"note": "Not in the hangar"}).status_code == 200
    c.refresh_from_db()
    assert c.status == "claimed" and c.review_note == "Not in the hangar"
    assert Notification.objects.filter(user=pilot, title="Delivery sent back: 5 × Hurricane").exists()
    # Only waiting deliveries can be sent back.
    assert api_client.call("post", f"/api/p/projects/contributions/{c.pk}/reject", {}).status_code == 400
    project.refresh_from_db()
    assert project.status == "open"


def test_pasted_materials_list(setup, api_client):
    project, item, boss, pilot, _ = setup
    paste = "Item\tRequired\tAvailable\nTritanium\t1 000 000\t0\nPyerite\t250,000\t0\nTritanium\t500\t0\nNot A Thing\t5\t0\n"
    api_client.force_login(pilot)
    assert api_client.call("post", f"/api/p/projects/projects/{project.pk}/items/paste", {"text": paste}).status_code == 403
    api_client.force_login(boss)
    res = api_client.call("post", f"/api/p/projects/projects/{project.pk}/items/paste", {"text": paste, "points_per_unit": 0}).json()
    assert res["added"] == 2 and res["unknown"] == ["Not A Thing"]
    qty = {i["name"]: i["quantity"] for i in res["project"]["items"]}
    assert qty == {"Hurricane": 20, "Tritanium": 1_000_500, "Pyerite": 250_000}
    assert services.parse_paste("Tritanium x 10\n5 Pyerite\nHurricane") == [("Tritanium", 10), ("Pyerite", 5), ("Hurricane", 1)]


def test_items_cannot_go_below_what_is_claimed(setup):
    project, item, boss, pilot, _ = setup
    services.claim(item, pilot, 8)
    with pytest.raises(services.ProjectError, match="8 of these are claimed"):
        services.update_item(item, 5, 0, 0)
    with pytest.raises(services.ProjectError, match="claimed some"):
        services.delete_item(item)
    with pytest.raises(services.ProjectError, match="close it instead"):
        services.delete_project(project, boss)


def test_industry_jobs_hint(setup, api_client):
    project, item, boss, pilot, other = setup
    c = services.claim(item, pilot, 10)
    now = timezone.now()
    char = pilot.main_character

    def job(job_id, start, status, end, product=HURRICANE, runs=2):
        IndustryJob.objects.create(character=char, job_id=job_id, activity_id=1, status=status, blueprint_id=1,
                                   blueprint_type_id=1, product_type_id=product, runs=runs, facility_id=1, station_id=1,
                                   output_location_id=1, start_date=start, end_date=end)

    job(1, now + timedelta(minutes=1), "active", now + timedelta(days=2), runs=3)
    job(2, now + timedelta(minutes=2), "delivered", now + timedelta(minutes=3), runs=4)
    job(3, now - timedelta(days=5), "active", now + timedelta(days=1))  # before the claim: not counted
    job(4, now + timedelta(minutes=1), "active", now + timedelta(days=1), product=TRITANIUM)  # another item
    hint = services.job_hints([c])[c.pk]
    assert hint["jobs"] == 2 and hint["runs_in_production"] == 3 and hint["runs_delivered"] == 4
    assert hint["ends_at"] == (now + timedelta(days=2)).isoformat()

    # The pilot and managers see it; other members see the claim but not the pilot's jobs.
    api_client.force_login(other)
    seen = api_client.call("get", f"/api/p/projects/projects/{project.pk}").json()["items"][0]["contributions"][0]
    assert seen["user"]["name"] == "Pilot Hammer" and seen["industry"] is None
    api_client.force_login(pilot)
    mine = api_client.call("get", "/api/p/projects/me").json()["contributions"][0]
    assert mine["industry"]["runs_in_production"] == 3


def test_audience_and_manager_permissions(setup, api_client):
    project, item, boss, pilot, other = setup
    capitals = Group.objects.create(name="Capitals")
    other.groups.add(capitals)
    api_client.force_login(pilot)
    assert api_client.call("post", "/api/p/projects/projects", {"name": "Mine"}).status_code == 403
    assert api_client.call("get", "/api/p/projects/types?q=hurr").status_code == 403

    api_client.force_login(boss)
    made = api_client.call("post", "/api/p/projects/projects", {"name": "Dread fleet", "groups": [capitals.pk]}).json()
    assert api_client.call("get", "/api/p/projects/types?q=hurr").json()[0]["name"] == "Hurricane"
    assert Notification.objects.filter(user=other, title="New industry project: Dread fleet").exists()
    assert not Notification.objects.filter(user=pilot, title="New industry project: Dread fleet").exists()

    api_client.force_login(pilot)
    names = [p["name"] for p in api_client.call("get", "/api/p/projects/projects").json()["projects"]]
    assert names == ["Deployment doctrine"]
    assert api_client.call("get", f"/api/p/projects/projects/{made['id']}").status_code == 404
    api_client.force_login(other)
    assert {p["name"] for p in api_client.call("get", "/api/p/projects/projects").json()["projects"]} == {"Deployment doctrine", "Dread fleet"}


def test_closed_projects_take_no_claims(setup, api_client):
    project, item, boss, pilot, _ = setup
    api_client.force_login(boss)
    assert api_client.call("post", f"/api/p/projects/projects/{project.pk}/close", {"status": "cancelled"}).status_code == 200
    api_client.force_login(pilot)
    resp = api_client.call("post", f"/api/p/projects/items/{item.pk}/claim", {"quantity": 1})
    assert resp.status_code == 400 and "closed" in resp.json()["detail"]
    closed = api_client.call("get", "/api/p/projects/projects?show=closed").json()["projects"]
    assert closed[0]["status"] == "cancelled"


def test_managers_cannot_confirm_their_own_delivery(setup, api_client):
    project, item, boss, pilot, other = setup
    c = services.claim(item, boss, 2)
    services.deliver(c, boss)
    api_client.force_login(boss)
    resp = api_client.call("post", f"/api/p/projects/contributions/{c.pk}/confirm")
    assert resp.status_code == 403 and "Another manager" in resp.json()["detail"]
    assert Contribution.objects.get(pk=c.pk).status == Contribution.Status.DELIVERED


def test_points_are_bounded_and_capped_per_delivery(setup, api_client):
    project, item, boss, pilot, other = setup
    api_client.force_login(boss)
    for bad in ({"points_per_unit": services.MAX_POINTS + 1}, {"points_per_unit": -1}, {"isk_per_unit": float("nan")},
                {"isk_per_unit": float("inf")}):
        resp = api_client.call("put", f"/api/p/projects/items/{item.pk}", {"quantity": 20, "points_per_unit": 10, "isk_per_unit": 0,
                                                                              **bad})
        assert resp.status_code == 400, bad
    big = services.add_item(project, TRITANIUM, services.MAX_QUANTITY, points_per_unit=services.MAX_POINTS)
    c = services.claim(big, pilot, services.MAX_QUANTITY)
    services.deliver(c, pilot)
    services.confirm(c, boss)
    assert services.contribution_points(c) == services.MAX_POINTS


def test_confirm_needs_a_delivery_on_an_open_project(setup):
    project, item, boss, pilot, other = setup
    c = services.claim(item, pilot, 5)
    with pytest.raises(services.ProjectError, match="marked delivered"):
        services.confirm(c, boss)
    services.deliver(c, pilot)
    services.close(project, Project.Status.CANCELLED, boss)
    with pytest.raises(services.ProjectError, match="closed"):
        services.confirm(c, boss)
    assert Contribution.objects.get(pk=c.pk).status == Contribution.Status.DELIVERED


def test_points_per_unit_cannot_change_under_a_waiting_delivery(setup):
    project, item, boss, pilot, other = setup
    c = services.claim(item, pilot, 5)
    services.update_item(item, 20, 50, 0)  # only claimed: fine
    services.deliver(c, pilot)
    with pytest.raises(services.ProjectError, match="waiting for a manager"):
        services.update_item(item, 20, 5000, 0)
    services.update_item(item, 25, 50, 0)  # the quantity can still change
    services.confirm(c, boss)
    assert services.contribution_points(Contribution.objects.get(pk=c.pk)) == 250


def test_alerts_can_ping_discord():
    assert bus.EVENT_TYPES["projects.created"].alert and bus.EVENT_TYPES["projects.created"].manage == "projects.manage_projects"
    assert not bus.EVENT_TYPES["projects.contribution_delivered"].alert
    assert not bus.EVENT_TYPES["projects.completed"].alert


@pytest.mark.django_db
def test_managers_set_discord_pings(user, api_client):
    from conduit.events.models import EventPing

    api_client.force_login(user)
    assert api_client.call("put", "/api/pings/projects.created", {"ping": True}).status_code == 403
    user.user_permissions.add(Permission.objects.get(content_type__app_label="projects", codename="manage_projects"))
    user = type(user).objects.get(pk=user.pk)  # drop the permission cache
    api_client.force_login(user)
    resp = api_client.call("put", "/api/pings/projects.created", {"ping": True, "roles": ["123"]})
    assert resp.status_code == 200 and resp.json()["ping"] is True
    assert EventPing.objects.get(event="projects.created").roles == ["123"]


def test_projects_for_some_members_stay_out_of_public_webhooks(setup, api_client, monkeypatch):
    """Webhooks often post where anyone can read: a project for a group goes out as private events, without its name."""
    project, item, boss, pilot, other = setup
    capitals = Group.objects.create(name="Capitals")
    pilot.groups.add(capitals)
    emitted = []
    monkeypatch.setattr(bus, "emit", lambda name, **kw: emitted.append((name, kw)))
    secret = services.save_project(None, {"name": "Secret titan", "location": "Keepstar X", "groups": [capitals.pk], "notify": False}, boss)
    assert [name for name, _ in emitted] == ["projects.created_restricted"]
    for name in ("projects.created_restricted", "projects.contribution_delivered_restricted", "projects.completed_restricted"):
        assert bus.is_private(name)
    emitted.clear()
    part = services.add_item(secret, HURRICANE, 2, points_per_unit=10)
    c = services.claim(part, pilot, 2)
    services.deliver(c, pilot)
    services.confirm(c, boss)
    by_name = {name: kw for name, kw in emitted if name.startswith("projects.")}
    assert set(by_name) == {"projects.contribution_delivered", "projects.contribution_delivered_restricted", "projects.completed_restricted"}
    # The Corp Store pays from the public event: it keeps who and how much, and says nothing about the project.
    public = by_name["projects.contribution_delivered"]
    assert public["user_id"] == pilot.pk and public["points"] == 20 and public["contribution_id"] == c.pk
    assert "Secret titan" not in str(public) and "Hurricane" not in str(public) and "Keepstar" not in str(public)
    assert by_name["projects.contribution_delivered_restricted"]["project"] == "Secret titan"
    # A project for everyone goes out as before.
    emitted.clear()
    services.save_project(None, {"name": "Open one", "notify": False}, boss)
    assert [name for name, _ in emitted] == ["projects.created"]


def test_a_stale_copy_cant_undo_what_happened_meanwhile(setup):
    """Two managers on the same delivery, or a member clicking twice: each holds a copy loaded earlier."""
    project, item, boss, pilot, other = setup
    c = services.claim(item, pilot, 5)
    services.deliver(c, pilot)
    stale_reject, stale_deliver = (Contribution.objects.select_related("item__project").get(pk=c.pk) for _ in range(2))
    services.confirm(Contribution.objects.get(pk=c.pk), boss)
    # Sending it back after it was confirmed (and paid) would let it be delivered and paid again.
    with pytest.raises(services.ProjectError, match="waiting for a manager"):
        services.reject(stale_reject, boss, "not there")
    assert Contribution.objects.get(pk=c.pk).status == Contribution.Status.CONFIRMED

    c2 = services.claim(item, other, 5)
    stale_release, stale_deliver = (Contribution.objects.select_related("item__project").get(pk=c2.pk) for _ in range(2))
    services.deliver(Contribution.objects.select_related("item__project").get(pk=c2.pk), other)
    before = Notification.objects.count()
    with pytest.raises(services.ProjectError, match="delivered already"):
        services.deliver(stale_deliver, other)
    with pytest.raises(services.ProjectError, match="send it back first"):
        services.release(stale_release, other)
    assert Notification.objects.count() == before and Contribution.objects.get(pk=c2.pk).status == Contribution.Status.DELIVERED


def test_pasted_lists_have_limits(setup, api_client):
    import time

    project, item, boss, pilot, _ = setup
    started = time.perf_counter()
    lines = services.parse_paste("a" + " " * 60_000 + "b\nTritanium x 10\nTritanium " + "9" * 5000)
    assert time.perf_counter() - started < 1
    assert ("Tritanium", 10) in lines and len(lines) == 3
    api_client.force_login(boss)
    resp = api_client.call("post", f"/api/p/projects/projects/{project.pk}/items/paste", {"text": "Tritanium 5\n" * 20_000})
    assert resp.status_code == 400 and "too long" in resp.json()["detail"]
