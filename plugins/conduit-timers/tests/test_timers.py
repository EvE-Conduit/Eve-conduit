"""Timers: the board, who may write, going, reminders, and timers read from structures and notifications."""

from datetime import UTC, datetime, timedelta

import pytest
from django.contrib.auth.models import Permission
from django.utils import timezone

from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit.sde.models import Region, SolarSystem
from conduit_timers import services
from conduit_timers.models import Timer, TimerSettings
from tests.conftest import make_user

JITA, PERIMETER = 30000142, 30000144


@pytest.fixture
def people(db, corp):
    sync_installed()
    set_enabled("timers", True)
    Region.objects.create(id=10000002, name="The Forge")
    SolarSystem.objects.create(id=JITA, name="Jita", constellation_id=20000020, region_id=10000002, security_status=0.9459)
    SolarSystem.objects.create(id=PERIMETER, name="Perimeter", constellation_id=20000020, region_id=10000002, security_status=0.9)
    pilot = make_user(90000001, "Pilot One", corporation=corp)
    other = make_user(90000002, "Pilot Two", corporation=corp)
    guest = make_user(90000003, "Guest Pilot", member=False)
    manager = make_user(90000004, "Timer Manager", corporation=corp)
    manager.user_permissions.add(Permission.objects.get(codename="manage_timers"))
    return {"pilot": pilot, "other": other, "guest": guest, "manager": manager}


def add(api_client, who, **body):
    api_client.force_login(who)
    payload = {"name": "Fortizar of Doom", "structure_type": "Fortizar", "system": JITA, "kind": "armor", "side": "friendly",
               "ends_at": (timezone.now() + timedelta(hours=5)).isoformat(), **body}
    resp = api_client.call("post", "/api/p/timers", payload)
    assert resp.status_code == 200, resp.content
    return resp.json()


def test_members_see_the_board_and_are_told(people, api_client, django_capture_on_commit_callbacks):
    with django_capture_on_commit_callbacks(execute=True):
        t = add(api_client, people["manager"])
    assert t["status"] == "upcoming" and t["type_id"] == 35833 and t["system"]["name"] == "Jita" and t["system"]["region"] == "The Forge"
    api_client.force_login(people["pilot"])
    board = api_client.call("get", "/api/p/timers").json()
    assert [x["name"] for x in board["upcoming"]] == ["Fortizar of Doom"] and board["past"] == [] and not board["can_manage"]
    assert Notification.objects.filter(user=people["pilot"], category="p.timers", title__contains="armor timer").exists()
    assert not Notification.objects.filter(user=people["guest"]).exists()
    api_client.force_login(people["guest"])
    assert api_client.call("get", "/api/p/timers").status_code == 403


def test_only_managers_write(people, api_client):
    api_client.force_login(people["pilot"])
    assert api_client.call("post", "/api/p/timers", {"name": "X", "system": JITA, "ends_at": timezone.now().isoformat()}).status_code == 403
    t = add(api_client, people["manager"])
    api_client.force_login(people["pilot"])
    assert api_client.call("delete", f"/api/p/timers/{t['id']}").status_code == 403
    assert api_client.call("get", "/api/p/timers/settings").status_code == 403
    api_client.force_login(people["manager"])
    assert api_client.call("put", f"/api/p/timers/{t['id']}", {"name": " ", "system": JITA, "ends_at": t["ends_at"]}).status_code == 400
    assert api_client.call("put", f"/api/p/timers/{t['id']}", {"name": "X", "system": 1, "ends_at": t["ends_at"]}).status_code == 400
    far = (timezone.now() + timedelta(days=100)).isoformat()
    assert api_client.call("put", f"/api/p/timers/{t['id']}", {"name": "X", "system": JITA, "ends_at": far}).status_code == 400
    edited = api_client.call("put", f"/api/p/timers/{t['id']}", {"name": "Fortizar of Doom", "system": PERIMETER, "kind": "hull", "side": "hostile",
                                                                   "owner": "Bad Guys", "ends_at": t["ends_at"], "structure_type": "fortizar"}).json()
    assert edited["system"]["name"] == "Perimeter" and edited["kind"] == "hull" and edited["owner"] == "Bad Guys" and edited["type_id"] == 35833
    assert api_client.call("delete", f"/api/p/timers/{t['id']}").status_code == 200
    assert not Timer.objects.exists()


def test_quiet_timers_only_reach_webhooks(people, api_client):
    add(api_client, people["manager"], notify=False)
    assert not Notification.objects.filter(category="p.timers").exists()
    # Important ones are always announced, even to people who muted timers.
    add(api_client, people["manager"], name="Keepstar", important=True, notify=False)
    assert Notification.objects.filter(user=people["pilot"], title__startswith="Keepstar").exists()


def test_going(people, api_client):
    t = add(api_client, people["manager"])
    api_client.force_login(people["pilot"])
    assert api_client.call("post", f"/api/p/timers/{t['id']}/going", {"going": True}).json() == {"going": True, "going_count": 1}
    board = api_client.call("get", "/api/p/timers").json()
    assert board["going"] == [t["id"]] and board["upcoming"][0]["going"] and board["upcoming"][0]["going_names"] == ["Pilot One"]
    api_client.force_login(people["other"])
    row = api_client.call("get", "/api/p/timers").json()["upcoming"][0]
    assert not row["going"] and row["going_count"] == 1
    api_client.force_login(people["pilot"])
    assert api_client.call("post", f"/api/p/timers/{t['id']}/going", {"going": False}).json()["going_count"] == 0


def test_past_timers_move_down_then_drop_off(people, api_client):
    api_client.force_login(people["manager"])
    soon = add(api_client, people["manager"], name="Just now", ends_at=(timezone.now() - timedelta(minutes=10)).isoformat())
    assert soon["status"] == "now"
    Timer.objects.filter(pk=soon["id"]).update(ends_at=timezone.now() - timedelta(days=2))
    board = api_client.call("get", "/api/p/timers").json()
    assert board["upcoming"] == [] and [x["status"] for x in board["past"]] == ["past"]
    Timer.objects.filter(pk=soon["id"]).update(ends_at=timezone.now() - timedelta(days=20))
    assert api_client.call("get", "/api/p/timers").json()["past"] == []


def test_reminders_go_out_once_per_mark(people, api_client):
    t = add(api_client, people["manager"], ends_at=(timezone.now() + timedelta(minutes=50)).isoformat())
    api_client.force_login(people["pilot"])
    api_client.call("post", f"/api/p/timers/{t['id']}/going", {"going": True})
    Notification.objects.all().delete()
    assert services.remind_due() == 1 and services.remind_due() == 0  # the 60-minute mark, once
    assert Notification.objects.filter(user=people["pilot"], title__startswith="Timer soon").count() == 1
    assert not Notification.objects.filter(user=people["other"]).exists()  # not going, not important
    Timer.objects.filter(pk=t["id"]).update(ends_at=timezone.now() + timedelta(minutes=10))
    assert services.remind_due() == 1  # the 15-minute mark
    assert Notification.objects.filter(user=people["pilot"], title__startswith="Timer soon").count() == 2
    # Moving a timer by hand gets its reminders again.
    api_client.force_login(people["manager"])
    api_client.call("put", f"/api/p/timers/{t['id']}", {"name": t["name"], "system": JITA, "ends_at": (timezone.now() + timedelta(minutes=12)).isoformat()})
    assert Timer.objects.get(pk=t["id"]).reminded == []
    assert services.remind_due() == 1  # both marks due at once: one reminder


def test_important_reminders_reach_everyone(people, api_client):
    add(api_client, people["manager"], name="CTA", important=True, ends_at=(timezone.now() + timedelta(minutes=30)).isoformat())
    Notification.objects.all().delete()
    assert services.remind_due() == 1
    assert Notification.objects.filter(user=people["other"], title="Timer soon: CTA in Jita (armor timer)").exists()


def test_settings(people, api_client):
    api_client.force_login(people["manager"])
    s = api_client.call("put", "/api/p/timers/settings", {"reminder_minutes": [15, 60, 1440, 15], "keep_days": 7, "import_structures": False}).json()
    assert s["reminder_minutes"] == [1440, 60, 15] and s["keep_days"] == 7 and not s["import_structures"] and s["import_notifications"]
    assert api_client.call("put", "/api/p/timers/settings", {"keep_days": 0}).status_code == 400
    assert api_client.call("get", "/api/p/timers").json()["reminder_minutes"] == [1440, 60, 15]


def test_systems_and_types(people, api_client):
    api_client.force_login(people["pilot"])
    assert api_client.call("get", "/api/p/timers/systems?q=j").json() == []
    rows = api_client.call("get", "/api/p/timers/systems?q=ji").json()
    assert rows == [{"id": JITA, "name": "Jita", "region": "The Forge", "security": 0.9}]
    names = [t["name"] for t in api_client.call("get", "/api/p/timers/types").json()]
    assert "Keepstar" in names and "Customs Office" in names


def test_search(people, api_client):
    add(api_client, people["manager"], name="Fortizar of Doom", owner="Bad Guys")
    api_client.force_login(people["pilot"])
    group = next(g for g in api_client.call("get", "/api/search?q=doom").json()["groups"] if g["key"] == "timers")
    assert group["hits"][0]["title"] == "Fortizar of Doom · Jita"
    group = next(g for g in api_client.call("get", "/api/search?q=bad%20guys").json()["groups"] if g["key"] == "timers")
    assert len(group["hits"]) == 1


# --- from structures and notifications ----------------------------------------------------------------------------


def test_timers_from_reinforced_structures(people, corp):
    from conduit.corp.models import Structure

    end = timezone.now() + timedelta(hours=30)
    Structure.objects.create(corporation=corp, structure_id=1030000000001, name="Our Astrahus", type_id=35832, system_id=JITA, state="armor_reinforce",
                             state_timer_start=timezone.now(), state_timer_end=end)
    Structure.objects.create(corporation=corp, structure_id=1030000000002, name="Fine", type_id=35832, system_id=JITA, state="shield_vulnerable")
    Structure.objects.create(corporation=corp, structure_id=1030000000003, name="Leaving", type_id=35835, system_id=PERIMETER, state="shield_vulnerable",
                             unanchors_at=end)
    assert services.import_structures() == 2
    assert services.import_structures() == 0
    ours = Timer.objects.get(structure_id=1030000000001)
    assert ours.kind == "armor" and ours.source == "structure" and ours.owner == "Test Corp" and ours.structure_type == "Astrahus" and ours.ends_at == end
    assert Timer.objects.get(structure_id=1030000000003).kind == "unanchoring"
    # The structure's timer moved a little (a new sync): the timer follows.
    Structure.objects.filter(structure_id=1030000000001).update(state_timer_end=end + timedelta(minutes=3))
    assert services.import_structures() == 0
    assert Timer.objects.get(structure_id=1030000000001).ends_at == end + timedelta(minutes=3)
    assert Notification.objects.filter(user=people["pilot"], title__startswith="Our Astrahus in Jita").exists()


def _notification(character, kind, text, when=None, nid=None):
    from conduit.sheet.notifications.models import Notification as EveNotification

    when = when or timezone.now() - timedelta(minutes=5)
    return EveNotification.objects.create(character=character, notification_id=nid or int(when.timestamp() * 1000) % 10**9, type=kind,
                                          sender_id=1000137, sender_type="corporation", timestamp=when, text=text)


def test_timers_from_notifications(people, corp):
    from conduit.sheet.models import Location

    pilot = people["pilot"].main_character
    Location.objects.create(id=1030000000005, kind="structure", name="Jita Trade Hub", solar_system_id=JITA, type_id=35833, owner_id=corp.pk)
    when = timezone.now() - timedelta(minutes=5)
    twenty_hours = 20 * 3600 * 10_000_000
    shields = f"solarsystemID: {JITA}\nstructureID: &id001 1030000000005\nstructureShowInfoData:\n- showinfo\n- 35833\n- *id001\nstructureTypeID: 35833\ntimeLeft: {twenty_hours}\ntimestamp: 133000000000000000\nvulnerableTime: 9000000000\n"
    _notification(pilot, "StructureLostShields", shields, when, nid=1)
    # Another member got the same notification: not a second timer.
    _notification(people["other"].main_character, "StructureLostShields", shields, when + timedelta(seconds=20), nid=1)
    decloak = int((timezone.now() + timedelta(days=1) - datetime(1601, 1, 1, tzinfo=UTC)).total_seconds() * 10_000_000)
    _notification(pilot, "SovStructureReinforced", f"campaignEventType: 2\ndecloakTime: {decloak}\nsolarSystemID: {PERIMETER}\n", when, nid=2)
    _notification(pilot, "OrbitalReinforced", f"aggressorAllianceID: 99000002\nplanetID: 40009077\nplanetTypeID: 11\nreinforceExitTime: {decloak}\nsolarSystemID: {JITA}\ntypeID: 2233\n", when, nid=3)
    _notification(pilot, "StructureUnderAttack", f"solarsystemID: {JITA}\nshieldPercentage: 42.5\n", when, nid=4)  # no time in it
    _notification(pilot, "StructureLostArmor", f"solarsystemID: {JITA}\nstructureID: &id001 1030000000006\nstructureTypeID: 35832\ntimeLeft: {twenty_hours}\n",
                  timezone.now() - timedelta(days=10), nid=5)  # too old to matter
    assert services.import_notifications() == 3
    assert services.import_notifications() == 0
    armor = Timer.objects.get(structure_id=1030000000005)
    assert armor.kind == "armor" and armor.name == "Jita Trade Hub" and armor.structure_type == "Fortizar" and armor.source == "notification"
    assert abs((armor.ends_at - (when + timedelta(hours=20))).total_seconds()) < 1
    sov = Timer.objects.get(kind="sov")
    assert sov.name == "Infrastructure Hub" and sov.system_id == PERIMETER and abs((sov.ends_at - (timezone.now() + timedelta(days=1))).total_seconds()) < 2
    poco = Timer.objects.get(name="Customs Office")
    assert poco.structure_id == 40009077 and poco.type_id == 2233
    assert TimerSettings.load().notifications_seen_until == when + timedelta(seconds=20)
    # A later notification is picked up; one that was already looked at isn't.
    _notification(pilot, "StructureLostArmor", f"solarsystemID: {JITA}\nstructureID: &id001 1030000000005\nstructureTypeID: 35833\ntimeLeft: {twenty_hours}\n",
                  timezone.now() - timedelta(minutes=1), nid=6)
    assert services.import_notifications() == 1
    assert Timer.objects.filter(structure_id=1030000000005).count() == 2


def test_notification_parsing():
    f = services.notification_fields("structureID: &id001 1030000000005\nstructureTypeID: 35833\ntimeLeft: 720000000000\nshieldPercentage: 42.5\nnotes: 'x'\n")
    assert f == {"structureID": 1030000000005, "structureTypeID": 35833, "timeLeft": 720000000000, "shieldPercentage": 42}
    assert services.filetime(0) == datetime(1601, 1, 1, tzinfo=UTC)
    assert services.filetime(116444736000000000) == datetime(1970, 1, 1, tzinfo=UTC)


def test_imports_can_be_switched_off(people, api_client, monkeypatch):
    api_client.force_login(people["manager"])
    monkeypatch.setattr(services, "import_structures", lambda: 5)
    monkeypatch.setattr(services, "import_notifications", lambda: 7)
    assert api_client.call("post", "/api/p/timers/import").json() == {"structures": 5, "notifications": 7}
    api_client.call("put", "/api/p/timers/settings", {"import_structures": False, "import_notifications": False})
    assert api_client.call("post", "/api/p/timers/import").json() == {"structures": 0, "notifications": 0}


# --- picking our own structures in the editor ---------------------------------------------------------------------


def test_known_structures_are_offered_and_fill_the_timer(people, api_client, corp):
    from conduit.corp.models import Structure
    from conduit.eve.models import EveCorporation
    from conduit.sheet.models import Location

    # Known from members' assets and contracts: no corporation sheet needed (same as Buyback).
    Location.objects.create(id=1030000000001, kind="structure", name="Jita Keep", solar_system_id=JITA, type_id=35834, owner_id=corp.pk)
    Location.objects.create(id=1030000000002, kind="structure", name="Perimeter Refinery", solar_system_id=PERIMETER, type_id=35835, owner_id=corp.pk)
    hostile = EveCorporation.objects.create(id=98000002, name="Bad Corp", ticker="BAD")
    Location.objects.create(id=1030000000003, kind="structure", name="Jita Hostile Fort", solar_system_id=JITA, type_id=35833, owner_id=hostile.pk)
    Location.objects.create(id=1030000000004, kind="structure", name="Restricted structure", solar_system_id=JITA, type_id=35833, resolved=False)
    Location.objects.create(id=60003760, kind="station", name="Jita IV - Moon 4 - Caldari Navy Assembly Plant", solar_system_id=JITA)
    manager = people["manager"]
    api_client.force_login(manager)
    # By system name: every known structure in the system, ours first; stations and unnamed structures aren't offered.
    hits = api_client.call("get", "/api/p/timers/structures?q=jita").json()
    assert [(h["name"], h["ours"]) for h in hits] == [("Jita Keep", True), ("Jita Hostile Fort", False)]
    assert hits[0]["structure_type"] == "Keepstar" and hits[0]["system"]["name"] == "Jita" and hits[0]["owner"] == "Test Corp"
    assert hits[0]["kind"] is None and hits[0]["ends_at"] is None and hits[0]["state"] == ""
    assert hits[1]["owner"] == "Bad Corp"
    # By structure name and by type.
    assert [h["name"] for h in api_client.call("get", "/api/p/timers/structures?q=perim").json()] == ["Perimeter Refinery"]
    assert [h["name"] for h in api_client.call("get", "/api/p/timers/structures?q=athanor").json()] == ["Perimeter Refinery"]
    assert api_client.call("get", "/api/p/timers/structures?q=x").json() == []
    assert api_client.call("get", "/api/p/timers/structures?q=nowhere").json() == []
    # The corporation sheet adds the state and running timer, for those who may see the sheet.
    end = timezone.now() + timedelta(hours=30)
    Structure.objects.create(corporation=corp, structure_id=1030000000001, name="Jita Keep", type_id=35834, system_id=JITA, state="armor_reinforce",
                             state_timer_start=timezone.now(), state_timer_end=end)
    Structure.objects.create(corporation=corp, structure_id=1030000000005, name="Jita Sheet Only", type_id=35832, system_id=JITA, state="shield_vulnerable")
    hits = api_client.call("get", "/api/p/timers/structures?q=jita").json()
    assert [h["name"] for h in hits] == ["Jita Keep", "Jita Sheet Only", "Jita Hostile Fort"]
    assert hits[0]["kind"] is None and hits[0]["state"] == ""  # no corporation sheet access yet
    manager.user_permissions.add(Permission.objects.get(codename="view_own_corporation"))
    api_client.force_login(type(manager).objects.get(pk=manager.pk))
    hits = api_client.call("get", "/api/p/timers/structures?q=jita").json()
    assert hits[0]["kind"] == "armor" and hits[0]["ends_at"] == end.isoformat() and hits[0]["state"] == "armor_reinforce"
    # Members who can't add timers can't look either.
    api_client.force_login(people["pilot"])
    assert api_client.call("get", "/api/p/timers/structures?q=jita").status_code == 403
    # A timer added from the pick keeps the structure id, so the automatic import doesn't add it again.
    t = add(api_client, manager, name="Jita Keep", structure_type="Keepstar", structure_id=1030000000001, ends_at=end.isoformat())
    assert t["structure_id"] == 1030000000001 and t["source"] == "manual"
    assert services.import_structures() == 0
    assert Timer.objects.count() == 1


# --- Discord pings ---------------------------------------------------------------------------------------------------


def test_ping_asks_webhooks_to_mention(people, api_client, monkeypatch):
    from conduit.events import bus

    seen = []
    monkeypatch.setattr(bus, "emit", lambda name, **payload: seen.append((name, payload)))
    end = timezone.now() + timedelta(minutes=10)
    t = add(api_client, people["manager"], ping=True, ping_roles=["123", "<script>", "123", "456"], ends_at=end.isoformat())
    assert t["ping"] is True and t["ping_roles"] == ["123", "456"]
    created = [p for n, p in seen if n == "timers.created"]
    assert created and created[0]["ping"] is True and created[0]["mention_roles"] == ["123", "456"]
    # Reminders ping too; a quiet timer doesn't.
    quiet = add(api_client, people["manager"], name="Quiet", ends_at=end.isoformat())
    assert quiet["ping"] is False
    seen.clear()
    assert services.remind_due() == 2
    by_timer = {p["timer_id"]: p for n, p in seen if n == "timers.reminder"}
    assert by_timer[t["id"]]["ping"] is True and by_timer[t["id"]]["mention_roles"] == ["123", "456"]
    assert by_timer[quiet["id"]]["ping"] is False and by_timer[quiet["id"]]["mention_roles"] == []
    # Taking a timer off the board never pings.
    seen.clear()
    api_client.force_login(people["manager"])
    assert api_client.call("delete", f"/api/p/timers/{t['id']}").status_code == 200
    assert [p["ping"] for n, p in seen if n == "timers.deleted"] == [False]


def test_discord_roles_need_the_discord_plugin(people, api_client, monkeypatch):
    from django.apps import apps

    api_client.force_login(people["manager"])
    if not apps.is_installed("conduit_discord"):
        assert api_client.call("get", "/api/p/timers/discord-roles").json() == {"available": False, "roles": []}
        return
    from conduit.plugins.services import set_enabled
    from conduit_discord import discord_api
    from conduit_discord.models import DiscordSettings

    set_enabled("discord", True)
    assert api_client.call("get", "/api/p/timers/discord-roles").json() == {"available": False, "roles": []}
    s = DiscordSettings.load()
    s.bot_token, s.guild_id = "bot-token", "1000"
    s.save()
    monkeypatch.setattr(discord_api, "roles", lambda token, guild: [
        {"id": "1000", "name": "@everyone", "position": 0}, {"id": "2", "name": "Capitals", "position": 5, "color": 0xFF0000},
        {"id": "3", "name": "Bot", "position": 9, "managed": True}, {"id": "4", "name": "Members", "position": 1},
    ])
    roles = api_client.call("get", "/api/p/timers/discord-roles").json()
    assert roles == {"available": True, "roles": [{"id": "2", "name": "Capitals", "color": 0xFF0000}, {"id": "4", "name": "Members", "color": 0}]}
    # Default roles for new timers live in the settings.
    resp = api_client.call("put", "/api/p/timers/settings", {"reminder_minutes": [15], "default_ping_roles": ["2", "x"]})
    assert resp.status_code == 200 and resp.json()["default_ping_roles"] == ["2"]
    api_client.force_login(people["pilot"])
    assert api_client.call("get", "/api/p/timers/discord-roles").status_code == 403
