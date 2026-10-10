"""Leaderboard: ranking members from their characters' data, hiding, the Fleets category, settings and medals."""

from datetime import timedelta
from decimal import Decimal

import pytest
from django.contrib.auth.models import Permission
from django.utils import timezone

from conduit.accounts.models import Character
from conduit.eve.models import MarketPrice
from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit.sheet.industry.models import IndustryJob
from conduit.sheet.killmails.models import CharacterKillmail, Killmail
from conduit.sheet.mining.models import MiningEntry
from conduit.sheet.skills.models import SkillSummary
from conduit.sheet.wallet.models import JournalEntry
from conduit_leaderboard import services
from conduit_leaderboard.models import Award, LeaderboardSettings
from tests.conftest import make_user

ORE = 1230  # Veldspar


def kill(km_id: int, when, value: float, *characters, loss=False):
    km = Killmail.objects.create(id=km_id, hash="h", time=when, solar_system_id=30000142, victim_ship_type_id=587, damage_taken=1,
                                 attacker_count=len(characters), value=value, data={})
    for c in characters:
        CharacterKillmail.objects.create(character_id=c, killmail=km, is_loss=loss)
    return km


@pytest.fixture
def last_month():
    return (timezone.now().date().replace(day=1) - timedelta(days=1)).replace(day=1)


@pytest.fixture
def pilots(db, corp, last_month):
    """Pilot One (with an alt) and Pilot Two, both members of Test Corp, with a month of activity behind them."""
    sync_installed()
    set_enabled("leaderboard", True)
    one = make_user(90000001, "Pilot One", corporation=corp)
    Character.objects.create(id=90000002, name="One Alt", owner_hash="alt", user=one, corporation=corp)
    two = make_user(90000003, "Pilot Two", corporation=corp)
    when = timezone.make_aware(timezone.datetime(last_month.year, last_month.month, 5, 12))
    kill(1, when, 100_000_000, 90000001, 90000002)  # main and alt on one kill: still one kill
    kill(2, when, 50_000_000, 90000001)
    kill(3, when, 900_000_000, 90000003)
    kill(4, when, 10_000_000, 90000003, loss=True)
    kill(5, when - timedelta(days=40), 1_000_000, 90000003)  # the month before: not in last month's board
    MarketPrice.objects.create(type_id=ORE, average_price=10.0)
    MiningEntry.objects.create(character_id=90000002, date=last_month + timedelta(days=2), solar_system_id=30000142, type_id=ORE, quantity=5000)
    MiningEntry.objects.create(character_id=90000003, date=last_month + timedelta(days=2), solar_system_id=30000142, type_id=ORE, quantity=1000)
    JournalEntry.objects.create(character_id=90000003, ref_id=1, date=when, ref_type="bounty_prizes", amount=Decimal("25000000"))
    JournalEntry.objects.create(character_id=90000003, ref_id=2, date=when, ref_type="player_donation", amount=Decimal("99000000"))
    IndustryJob.objects.create(character_id=90000001, job_id=1, activity_id=1, status="active", blueprint_id=1, blueprint_type_id=1, runs=10,
                               facility_id=1, station_id=1, output_location_id=1, start_date=when, end_date=when + timedelta(days=1))
    SkillSummary.objects.create(character_id=90000001, total_sp=10_000_000)
    SkillSummary.objects.create(character_id=90000002, total_sp=5_000_000)
    SkillSummary.objects.create(character_id=90000003, total_sp=12_000_000)
    return one, two


def manager(admin_user):
    admin_user.is_superuser = False
    admin_user.save()
    admin_user.user_permissions.add(Permission.objects.get(codename="manage_leaderboard"))
    return type(admin_user).objects.get(pk=admin_user.pk)


def test_kills_count_each_killmail_once_per_member(pilots, last_month):
    one, two = pilots
    rows = services.ranked(services.CATEGORIES["kills"], services.month_period(last_month))
    assert [(r["name"], r["rank"], r["score"]) for r in rows] == [("Pilot One", 1, 2), ("Pilot Two", 2, 1)]
    assert rows[0]["extra"] == 150_000_000  # ISK destroyed on those two kills
    assert [(c["name"], c["score"]) for c in rows[0]["characters"]] == [("Pilot One", 2), ("One Alt", 1)]
    by_value = services.ranked(services.CATEGORIES["isk_destroyed"], services.month_period(last_month))
    assert [r["name"] for r in by_value] == ["Pilot Two", "Pilot One"] and by_value[0]["score"] == 900_000_000
    assert [r["name"] for r in services.ranked(services.CATEGORIES["losses"], services.month_period(last_month))] == ["Pilot Two"]


def test_other_categories(pilots, last_month):
    period = services.month_period(last_month)
    mining = services.ranked(services.CATEGORIES["mining"], period)
    assert [(r["name"], r["score"], r["extra"]) for r in mining] == [("Pilot One", 50_000.0, 5000), ("Pilot Two", 10_000.0, 1000)]
    bounties = services.ranked(services.CATEGORIES["bounties"], period)
    assert [(r["name"], r["score"]) for r in bounties] == [("Pilot Two", 25_000_000.0)]  # the donation doesn't count
    industry = services.ranked(services.CATEGORIES["industry"], period)
    assert [(r["name"], r["score"], r["extra"]) for r in industry] == [("Pilot One", 1, 10)]
    sp = services.ranked(services.CATEGORIES["skillpoints"], period)
    assert [(r["name"], r["score"]) for r in sp] == [("Pilot One", 15_000_000), ("Pilot Two", 12_000_000)]


def test_all_time_and_ties(pilots, last_month):
    rows = services.ranked(services.CATEGORIES["kills"], services.parse_period("all"))
    assert [(r["name"], r["rank"], r["score"]) for r in rows] == [("Pilot One", 1, 2), ("Pilot Two", 1, 2)]
    with pytest.raises(services.LeaderboardError):
        services.parse_period("soon")


def test_fleets_category_needs_the_fleets_plugin(pilots, last_month):
    keys = [c.key for c in services.enabled_categories()]
    assert "fats" not in keys  # installed in this checkout but not switched on
    set_enabled("fleets", True)
    assert "fats" in [c.key for c in services.enabled_categories()]
    from conduit_fleets.models import Fat, Fleet

    one, two = pilots
    fleet = Fleet.objects.create(name="CTA", started_at=timezone.make_aware(timezone.datetime(last_month.year, last_month.month, 9, 20)))
    Fat.objects.create(fleet=fleet, character_id=90000001, character_name="Pilot One", via="link")
    Fat.objects.create(fleet=fleet, character_id=90000002, character_name="One Alt", via="link")
    Fat.objects.create(fleet=fleet, character_id=90000003, character_name="Pilot Two", via="link")
    rows = services.ranked(services.CATEGORIES["fats"], services.month_period(last_month))
    assert [(r["name"], r["score"]) for r in rows] == [("Pilot One", 2), ("Pilot Two", 1)]


def test_board_and_overview_through_the_api(pilots, last_month, api_client):
    one, two = pilots
    api_client.force_login(two)
    data = api_client.call("get", f"/api/p/leaderboard/board/kills?period={last_month:%Y-%m}").json()
    assert data["participants"] == 2 and data["me"]["rank"] == 2 and data["entries"][0]["name"] == "Pilot One"
    assert data["entries"][0]["characters"]  # show_characters is on by default
    over = api_client.call("get", f"/api/p/leaderboard/overview?period={last_month:%Y-%m}").json()
    kills = next(b for b in over["boards"] if b["category"]["key"] == "kills")
    assert [p["name"] for p in kills["podium"]] == ["Pilot One", "Pilot Two"] and kills["me"]["rank"] == 2
    assert "fats" not in [b["category"]["key"] for b in over["boards"]]
    assert api_client.call("get", "/api/p/leaderboard/board/nope").status_code == 404
    me = api_client.call("get", "/api/p/leaderboard/me").json()
    assert me["medals"] == {"gold": 0, "silver": 0, "bronze": 0} and len(me["ranks"]) == 7


def test_hiding_yourself(pilots, last_month, api_client):
    one, two = pilots
    api_client.force_login(one)
    assert api_client.call("put", "/api/p/leaderboard/me/hidden", {"hidden": True}).json() == {"hidden": True}
    data = api_client.call("get", f"/api/p/leaderboard/board/kills?period={last_month:%Y-%m}").json()
    assert [e["name"] for e in data["entries"]] == ["Pilot Two"] and data["me"] is None and data["hidden"]
    api_client.call("put", "/api/p/leaderboard/me/hidden", {"hidden": False})
    data = api_client.call("get", f"/api/p/leaderboard/board/kills?period={last_month:%Y-%m}").json()
    assert data["me"]["rank"] == 1 and not data["hidden"]


def test_settings_limit_categories_corporations_and_characters(pilots, last_month, api_client, admin_user, corp):
    from conduit.eve.models import EveCorporation

    other = EveCorporation.objects.create(id=98000002, name="Other Corp", ticker="OTHER")
    three = make_user(90000005, "Pilot Three", corporation=other)
    kill(9, timezone.make_aware(timezone.datetime(last_month.year, last_month.month, 6, 1)), 5, 90000005)
    api_client.force_login(pilots[0])
    assert api_client.call("get", "/api/p/leaderboard/settings").status_code == 403
    api_client.force_login(manager(admin_user))
    s = api_client.call("get", "/api/p/leaderboard/settings").json()
    assert {c["id"] for c in s["available_corporations"]} == {corp.pk, other.pk}
    resp = api_client.call("put", "/api/p/leaderboard/settings",
                           {"categories": ["mining", "kills"], "corporations": [corp.pk], "show_characters": False, "places": 3, "medals": False})
    assert resp.status_code == 200 and resp.json()["categories"] == ["kills", "mining"]
    assert api_client.call("put", "/api/p/leaderboard/settings", {"categories": ["pod_count"]}).status_code == 400
    assert api_client.call("put", "/api/p/leaderboard/settings", {"places": 1}).status_code == 400
    over = api_client.call("get", f"/api/p/leaderboard/overview?period={last_month:%Y-%m}").json()
    assert [b["category"]["key"] for b in over["boards"]] == ["kills", "mining"]
    board = api_client.call("get", f"/api/p/leaderboard/board/kills?period={last_month:%Y-%m}").json()
    assert [e["name"] for e in board["entries"]] == ["Pilot One", "Pilot Two"]  # Pilot Three's corporation is left out
    assert board["entries"][0]["characters"] == []
    assert api_client.call("get", f"/api/p/leaderboard/board/skillpoints").status_code == 404
    assert three.pk not in {r["user_id"] for r in services.ranked(services.CATEGORIES["kills"], services.month_period(last_month))}


def test_awarding_a_month_gives_medals_and_tells_the_winners(pilots, last_month, api_client, admin_user):
    one, two = pilots
    api_client.force_login(manager(admin_user))
    assert api_client.call("post", "/api/p/leaderboard/medals/all/award").status_code == 400
    this_month = timezone.now().date().replace(day=1)
    assert api_client.call("post", f"/api/p/leaderboard/medals/{this_month:%Y-%m}/award").status_code == 400  # not over yet
    resp = api_client.call("post", f"/api/p/leaderboard/medals/{last_month:%Y-%m}/award")
    assert resp.status_code == 200
    golds = {a.category: a.user.display_name for a in Award.objects.filter(month=last_month, rank=1)}
    assert golds == {"kills": "Pilot One", "isk_destroyed": "Pilot Two", "mining": "Pilot One", "bounties": "Pilot Two",
                     "industry": "Pilot One", "losses": "Pilot Two"}  # skillpoints are a total, never a monthly medal
    assert Award.objects.filter(user=one, rank=2).count() == 1  # ISK destroyed
    assert Award.objects.filter(user=two, rank=2).count() == 2  # kills and mining
    assert Notification.objects.filter(user=one, category="p.leaderboard", title__startswith="You finished 1st in Kills").exists()
    assert api_client.call("post", f"/api/p/leaderboard/medals/{last_month:%Y-%m}/award").status_code == 400  # already done
    medals = api_client.call("get", "/api/p/leaderboard/medals").json()
    assert [(h["name"], h["gold"], h["silver"]) for h in medals["hall_of_fame"]] == [("Pilot Two", 3, 2), ("Pilot One", 3, 1)]
    assert len(api_client.call("get", f"/api/p/leaderboard/medals?user={two.pk}").json()["awards"]) == 5
    # The daily job skips a month that's already awarded, and does nothing while medals are off.
    assert services.award_finished_months() == []
    Award.objects.all().delete()
    LeaderboardSettings.objects.update(medals=False)
    assert services.award_finished_months() == [] and not Award.objects.exists()
    LeaderboardSettings.objects.update(medals=True)
    assert len(services.award_finished_months()) == 9


def test_members_only(pilots, api_client, corp):
    guest = make_user(90000007, "Guest", corporation=corp, member=False)
    api_client.force_login(guest)
    assert api_client.call("get", "/api/p/leaderboard/overview").status_code in (403, 404)
    assert guest.pk not in {u.pk for u in services.competitors()}
