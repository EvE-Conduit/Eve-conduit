"""Corp finance: categories and officers' overrides, internal transfers, monthly figures, the report, balance history,
the month-closed notification and who may see what."""

from datetime import UTC, datetime, time, timedelta
from decimal import Decimal

import pytest
from django.contrib.auth.models import Group, Permission
from django.utils import timezone

from conduit.corp.models import CorpJournalEntry, CorpSyncStatus, WalletDivision
from conduit.eve.models import EveCorporation, EveName
from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit_finance import categories as cat
from conduit_finance import services
from conduit_finance.models import CategoryOverride, CounterpartyRule, FinanceSettings, MonthReport
from tests.conftest import make_user

BASE = "/api/p/finance"
CONCORD = 1000125
PILOT = 90000001
SRP_GUY = 91000500
BUYBACK = 91000600
_ref = iter(range(1, 10**6))


def this_month():
    return timezone.now().date().replace(day=1)


def last_month():
    return services.add_months(this_month(), -1)


def at(day, hour=12):
    return datetime.combine(day, time(hour), tzinfo=UTC)


def entry(corp, when, ref_type, amount, first=None, second=None, division=1, balance=None, reason=""):
    return CorpJournalEntry.objects.create(
        corporation=corp, division=division, ref_id=next(_ref), date=when, ref_type=ref_type, amount=Decimal(amount),
        balance=None if balance is None else Decimal(balance), first_party_id=first, second_party_id=second, reason=reason,
    )


def grant(user, *codenames):
    user.user_permissions.add(*Permission.objects.filter(codename__in=codenames))
    return type(user).objects.get(pk=user.pk)  # fresh, so the permission cache is empty


@pytest.fixture
def corps(db, corp):
    """Test Corp and a sister corporation in the same alliance, and an outside corporation; all with synced wallets."""
    sync_installed()
    set_enabled("finance", True)
    sister = EveCorporation.objects.create(id=98000002, name="Sister Corp", ticker="SIS", alliance=corp.alliance)
    outside = EveCorporation.objects.create(id=98000003, name="Outside Corp", ticker="OUT")
    for c in (corp, sister, outside):
        WalletDivision.objects.create(corporation=c, division=1, balance=Decimal(0))
    EveName.objects.create(id=SRP_GUY, name="SRP Guy", category="character")
    EveName.objects.create(id=BUYBACK, name="Buyback Holder", category="character")
    EveName.objects.create(id=PILOT, name="Pilot One", category="character")
    return corp, sister, outside


@pytest.fixture
def officer(corps):
    """May see every corporation's wallets and change the finance settings."""
    u = make_user(90000050, "Officer Olga", corporation=corps[0])
    return grant(u, "view_finance", "manage_finance", "view_all_corporations", "view_corporation_wallets")


def rules_for(corp):
    return services.load_rules([corp.pk])


# --- categories ---------------------------------------------------------------------------------------------------


def test_built_in_table(corps):
    assert cat.default_category("bounty_prizes") == cat.RATTING
    assert cat.default_category("agent_mission_reward") == cat.MISSIONS
    assert cat.default_category("brokers_fee") == cat.MARKET
    assert cat.default_category("contract_reward_deposited_corp") == cat.CONTRACTS  # by prefix
    assert cat.default_category("industry_job_tax") == cat.INDUSTRY
    assert cat.default_category("planetary_export_tax") == cat.PLANETARY
    assert cat.default_category("office_rental_fee") == cat.STRUCTURES
    assert cat.default_category("something_new_ccp_added") == cat.OTHER
    assert cat.ref_type_label("office_rental_fee") == "Office rental fee"


def test_overrides_and_counterparty_rules(corps):
    corp, *_ = corps
    assert services.classify(rules_for(corp), corp.pk, "player_donation", SRP_GUY, corp.pk, True) == (cat.TRANSFERS, False)
    CategoryOverride.objects.create(ref_type="player_donation", category="Donations")
    CategoryOverride.objects.create(ref_type="bounty_prizes", category=cat.OTHER_TAX)
    r = rules_for(corp)
    assert services.classify(r, corp.pk, "player_donation", SRP_GUY, corp.pk, True) == ("Donations", False)
    assert services.classify(r, corp.pk, "bounty_prizes", CONCORD, PILOT, True) == (cat.OTHER_TAX, False)
    # Paid to the SRP guy: SRP payouts, both ways unless a one-way rule says otherwise.
    CounterpartyRule.objects.create(party_id=SRP_GUY, direction="out", category="SRP payouts")
    CounterpartyRule.objects.create(party_id=BUYBACK, direction="both", category="Buyback")
    r = rules_for(corp)
    assert services.classify(r, corp.pk, "corporation_account_withdrawal", corp.pk, SRP_GUY, False) == ("SRP payouts", False)
    assert services.classify(r, corp.pk, "player_donation", SRP_GUY, corp.pk, True) == ("Donations", False)  # rule is one-way
    assert services.classify(r, corp.pk, "player_donation", BUYBACK, corp.pk, True) == ("Buyback", False)
    assert services.classify(r, corp.pk, "contract_price", corp.pk, BUYBACK, False) == ("Buyback", False)
    # A corporation's own rule beats the every-corporation one, and only in that corporation.
    CounterpartyRule.objects.create(party_id=BUYBACK, direction="both", category="Ore buyback", corporation_id=corp.pk)
    assert services.classify(rules_for(corp), corp.pk, "player_donation", BUYBACK, corp.pk, True) == ("Ore buyback", False)
    sister = corps[1]
    assert services.classify(services.load_rules([sister.pk]), sister.pk, "player_donation", BUYBACK, sister.pk, True) == ("Buyback", False)


def test_internal_transfers(corps):
    corp, sister, outside = corps
    r = services.load_rules([corp.pk, sister.pk, outside.pk])
    # Between its own divisions: the corporation is on both sides.
    assert services.classify(r, corp.pk, "corporation_account_withdrawal", corp.pk, corp.pk, False) == (cat.INTERNAL, True)
    # To and from the alliance's other corporations, and every tracked corporation.
    assert services.classify(r, corp.pk, "corporation_account_withdrawal", corp.pk, sister.pk, False)[1]
    assert services.classify(r, sister.pk, "player_donation", corp.pk, sister.pk, True)[1]
    assert services.classify(r, corp.pk, "player_donation", outside.pk, corp.pk, True)[1]  # tracked here
    FinanceSettings.objects.update_or_create(pk=1, defaults={"corporations": [corp.pk, sister.pk]})
    r = services.load_rules([corp.pk])
    assert not services.classify(r, corp.pk, "player_donation", outside.pk, corp.pk, True)[1]  # no longer one of ours
    assert services.classify(r, corp.pk, "player_donation", sister.pk, corp.pk, True)[1]  # still the alliance's
    # A director taking ISK to their own character is spending, and a sister's market trade isn't a transfer.
    assert services.classify(r, corp.pk, "corporation_account_withdrawal", corp.pk, PILOT, False) == (cat.TRANSFERS, False)
    assert services.classify(r, corp.pk, "market_transaction", sister.pk, corp.pk, True) == (cat.MARKET, False)
    # Internal beats a counterparty rule.
    CounterpartyRule.objects.create(party_id=sister.pk, category="Sister payments")
    assert services.classify(services.load_rules([corp.pk]), corp.pk, "player_donation", sister.pk, corp.pk, True)[1]


# --- months and the report ----------------------------------------------------------------------------------------


@pytest.fixture
def books(corps):
    """Two months of Test Corp's wallet: last month and the month before."""
    corp, sister, _ = corps
    lm, before = last_month(), services.add_months(last_month(), -1)
    d = at(lm + timedelta(days=9))
    entry(corp, d, "bounty_prizes", 1_000_000, CONCORD, PILOT)
    entry(corp, d, "bounty_prizes", 500_000, CONCORD, PILOT)
    entry(corp, d, "agent_mission_reward", 200_000, CONCORD, PILOT)
    entry(corp, d, "player_donation", 300_000, BUYBACK, corp.pk)
    entry(corp, d, "office_rental_fee", -50_000, corp.pk, 1000035)
    entry(corp, d, "corporation_account_withdrawal", -400_000, corp.pk, SRP_GUY)
    # Moved around: between divisions, and to the sister corporation. Neither is income or spending.
    entry(corp, d, "corporation_account_withdrawal", -5_000_000, corp.pk, corp.pk, division=1)
    entry(corp, d, "corporation_account_withdrawal", 5_000_000, corp.pk, corp.pk, division=2)
    entry(corp, d, "corporation_account_withdrawal", -1_000_000, corp.pk, sister.pk)
    entry(sister, d, "corporation_account_withdrawal", 1_000_000, corp.pk, sister.pk)
    db = at(before + timedelta(days=9))
    entry(corp, db, "bounty_prizes", 750_000, CONCORD, PILOT)
    entry(corp, db, "office_rental_fee", -50_000, corp.pk, 1000035)
    return corp, sister


def test_overview_by_month_and_category(books, officer):
    corp, _ = books
    data = services.overview(officer, corp.pk, months=3)
    by_month = {m["month"]: m for m in data["months"]}
    lm = by_month[last_month().strftime("%Y-%m")]
    assert lm["income"] == 2_000_000 and lm["spending"] == 450_000 and lm["net"] == 1_550_000
    assert lm["internal_in"] == 5_000_000 and lm["internal_out"] == 6_000_000
    before = by_month[services.add_months(last_month(), -1).strftime("%Y-%m")]
    assert before["income"] == 750_000 and before["spending"] == 50_000
    assert [m["month"] for m in data["months"]][-1] == this_month().strftime("%Y-%m")  # oldest first, this month last
    cats = {c["category"]: c for c in data["categories"]}
    assert cats[cat.RATTING]["income"] == [750_000, 1_500_000, 0]
    assert cats[cat.STRUCTURES]["total_spending"] == 100_000
    assert cat.INTERNAL not in cats
    # Combined: the sister's incoming transfer is internal too.
    combined = services.overview(officer, None, months=3)
    lm = {m["month"]: m for m in combined["months"]}[last_month().strftime("%Y-%m")]
    assert lm["income"] == 2_000_000 and lm["internal_in"] == 6_000_000


def test_report_totals_counterparties_and_change(books, officer):
    corp, _ = books
    CounterpartyRule.objects.create(party_id=SRP_GUY, direction="out", category="SRP payouts")
    data = services.report(officer, last_month(), corp.pk)
    assert data["totals"]["income"] == 2_000_000 and data["totals"]["spending"] == 450_000 and data["totals"]["net"] == 1_550_000
    assert data["previous"]["income"] == 750_000 and data["previous"]["net"] == 700_000
    assert data["change"]["income"] == {"amount": 1_250_000, "percent": pytest.approx(166.7)}
    assert data["change"]["net"]["amount"] == 850_000
    cats = {c["category"]: c for c in data["categories"]}
    assert cats[cat.RATTING]["income"] == 1_500_000 and cats[cat.RATTING]["previous_income"] == 750_000
    assert cats["SRP payouts"]["spending"] == 400_000
    assert data["categories"][0]["category"] == cat.RATTING  # biggest first
    top_in = data["top_income"][0]
    assert top_in["name"] == "Pilot One" and top_in["amount"] == 1_700_000 and top_in["entries"] == 3
    assert {p["name"] for p in data["top_spending"]} == {"SRP Guy", "#1000035"}
    assert all(p["id"] != corp.pk for p in data["top_spending"])  # internal transfers aren't counterparties
    assert data["complete"] and data["corporations"][0]["internal_out"] == 6_000_000


def test_closing_balance_from_running_balances(corps):
    corp, *_ = corps
    lm = last_month()
    entry(corp, at(lm + timedelta(days=2)), "bounty_prizes", 100, CONCORD, PILOT, balance=1_100)
    entry(corp, at(lm + timedelta(days=20)), "bounty_prizes", 100, CONCORD, PILOT, balance=1_200)
    entry(corp, at(this_month()), "bounty_prizes", 100, CONCORD, PILOT, balance=1_300)
    assert services.closing_balance(corp.pk, services._at(lm)) is None  # the journal doesn't reach back that far
    assert services.closing_balance(corp.pk, services._at(this_month())) == 1_200


# --- balance history --------------------------------------------------------------------------------------------


def test_balance_history_per_division(corps, officer):
    corp, *_ = corps
    today = timezone.now().date()

    def day(n):
        return at(today - timedelta(days=n))

    WalletDivision.objects.filter(corporation=corp, division=1).update(balance=Decimal(120))
    WalletDivision.objects.create(corporation=corp, division=2, balance=Decimal(500))  # never touched: stays as it is
    WalletDivision.objects.create(corporation=corp, division=3, balance=Decimal(130))
    entry(corp, day(40), "bounty_prizes", 50, CONCORD, PILOT, balance=50)
    entry(corp, day(5), "bounty_prizes", 100, CONCORD, PILOT, balance=150)
    entry(corp, day(5) + timedelta(hours=1), "bounty_prizes", 50, CONCORD, PILOT, balance=200)  # the day ends on the last
    entry(corp, day(2), "office_rental_fee", -80, corp.pk, 1000035, balance=120)
    entry(corp, day(3), "bounty_prizes", 30, CONCORD, PILOT, division=3, balance=130)  # only entry: 100 before it

    data = services.balances(officer, corp.pk, days=30)
    assert data["since"] == (today - timedelta(days=29)).isoformat()
    div = {d["division"]: d for d in data["divisions"]}
    s1 = {p["date"]: p["value"] for p in div[1]["series"]}
    assert len(s1) == 30
    assert s1[(today - timedelta(days=29)).isoformat()] == 50  # carried from before the range
    assert s1[(today - timedelta(days=5)).isoformat()] == 200
    assert s1[(today - timedelta(days=3)).isoformat()] == 200
    assert s1[(today - timedelta(days=2)).isoformat()] == 120
    assert s1[today.isoformat()] == 120 and div[1]["change"] == 70
    assert {p["value"] for p in div[2]["series"]} == {500}
    s3 = {p["date"]: p["value"] for p in div[3]["series"]}
    assert s3[(today - timedelta(days=4)).isoformat()] == 100 and s3[(today - timedelta(days=3)).isoformat()] == 130
    total = {p["date"]: p["value"] for p in data["series"]}
    assert total[today.isoformat()] == 750 and data["balance"] == 750
    assert div[1]["name"] == "Master wallet"
    # Everything: from the first journal entry.
    everything = services.balances(officer, corp.pk, days=0)
    assert everything["since"] == (today - timedelta(days=40)).isoformat()


# --- the month closing ----------------------------------------------------------------------------------------------


def test_month_report_waits_for_sync_then_notifies_the_group_once(books, officer, monkeypatch):
    corp, sister = books
    emitted = []
    monkeypatch.setattr(services.bus, "emit", lambda name, **payload: name == "finance.month_closed" and emitted.append((name, payload)))
    group = Group.objects.create(name="Directors")
    officer.groups.add(group)
    outsider = make_user(90000070, "No Perm Nate", corporation=corp)
    outsider.groups.add(group)  # in the group but without finance.view_finance: not told
    own_corp_only = grant(make_user(90000071, "Own Corp Oscar", corporation=corp), "view_finance", "view_own_corporation", "view_corporation_wallets")
    own_corp_only.groups.add(group)
    FinanceSettings.objects.update_or_create(pk=1, defaults={"report_group": group})
    end = services._at(this_month())
    CorpSyncStatus.objects.create(corporation=corp, section="wallets", last_success=end - timedelta(hours=1))

    assert services.report_closed_month(now=end + timedelta(hours=3)) is None  # wallets haven't synced past the end yet
    CorpSyncStatus.objects.create(corporation=sister, section="wallets", last_success=end + timedelta(hours=1))
    assert services.report_closed_month(now=end + timedelta(hours=3)) is None  # Test Corp and Outside Corp still to go
    report = services.report_closed_month(now=end + services.REPORT_GRACE + timedelta(hours=1))  # waited long enough
    assert report is not None and report.month == last_month()
    assert report.totals["income"] == 2_000_000 and report.totals["internal_in"] == 6_000_000

    told = {n.user_id: n for n in Notification.objects.filter(category="p.finance")}
    assert set(told) == {officer.pk, own_corp_only.pk}
    assert "+1,550,000 ISK" in told[officer.pk].title and told[officer.pk].link.startswith("/p/finance/report?month=")
    assert "across 1 corporation" in told[own_corp_only.pk].body
    name, payload = emitted[0]
    assert name == "finance.month_closed" and payload["net"] == 1_550_000
    assert {c["name"] for c in payload["corporations"]} == {"Test Corp", "Sister Corp", "Outside Corp"}

    assert services.report_closed_month(now=end + timedelta(days=5)) is None  # once
    assert MonthReport.objects.count() == 1 and len(emitted) == 1


# --- the journal and CSV ------------------------------------------------------------------------------------------


def test_categorised_journal_and_csv(books, officer):
    corp, _ = books
    month = last_month()
    data = services.journal(officer, month, corp.pk)
    assert len(data["rows"]) == 9 and not data["truncated"]
    internal = services.journal(officer, month, corp.pk, internal=True)["rows"]
    assert len(internal) == 3 and all(r["category"] == cat.INTERNAL for r in internal)
    ratting = services.journal(officer, month, corp.pk, category=cat.RATTING)["rows"]
    assert [r["amount"] for r in ratting] and all(r["counterparty"] == "Pilot One" for r in ratting)
    assert len(services.journal(officer, month, corp.pk, limit=2)["rows"]) == 2
    text = services.journal_csv(officer, month, corp.pk)
    lines = text.strip().splitlines()
    assert lines[0].startswith("Date (EVE),Corporation,Division,Ref type,Category,Internal")
    assert len(lines) == 10 and any("Ratting tax" in ln for ln in lines)
    # Typed text that looks like a formula is quoted.
    entry(corp, at(month + timedelta(days=11)), "player_donation", 10, PILOT, corp.pk, reason="=HYPERLINK(1)")
    assert "'=HYPERLINK(1)" in services.journal_csv(officer, month, corp.pk)


def test_summary_this_month(corps, officer):
    corp, sister, _ = corps
    now = timezone.now()
    entry(corp, now - timedelta(minutes=5), "bounty_prizes", 900, CONCORD, PILOT)
    entry(sister, now - timedelta(minutes=5), "office_rental_fee", -100, sister.pk, 1000035)
    entry(corp, now - timedelta(minutes=5), "corporation_account_withdrawal", -5_000, corp.pk, corp.pk)
    data = services.summary(officer)
    rows = {r["name"]: r for r in data["corporations"]}
    assert rows["Test Corp"]["net"] == 900 and rows["Sister Corp"]["net"] == -100 and rows["Outside Corp"]["net"] == 0
    assert data["net"] == 800 and data["corporations"][0]["name"] == "Test Corp"


# --- who may see what ---------------------------------------------------------------------------------------------


def test_permissions(books, officer, api_client):
    corp, sister = books
    month = last_month().strftime("%Y-%m")
    nobody = make_user(90000080, "Plain Pete", corporation=corp)
    api_client.force_login(nobody)
    assert api_client.get(f"{BASE}/overview").status_code == 403
    assert api_client.get(f"{BASE}/summary").status_code == 403

    # The finance permission alone shows nothing: the corporation sheet's wallet access decides which corporations.
    viewer = grant(nobody, "view_finance")
    api_client.force_login(viewer)
    assert api_client.get(f"{BASE}/overview").json()["corporations"] == []
    assert api_client.get(f"{BASE}/report?month={month}&corporation={corp.pk}").status_code == 403
    viewer = grant(viewer, "view_own_corporation")
    assert api_client.get(f"{BASE}/overview").json()["corporations"] == []  # still no wallet permission
    viewer = grant(viewer, "view_corporation_wallets")
    assert [c["name"] for c in api_client.get(f"{BASE}/overview").json()["corporations"]] == ["Test Corp"]
    assert api_client.get(f"{BASE}/report?month={month}&corporation={sister.pk}").status_code == 403
    assert api_client.get(f"{BASE}/balances?corporation={sister.pk}").status_code == 403
    assert api_client.get(f"{BASE}/journal.csv?month={month}&corporation={sister.pk}").status_code == 403
    combined = api_client.get(f"{BASE}/report?month={month}").json()
    assert [c["name"] for c in combined["corporations"]] == ["Test Corp"]
    assert api_client.get(f"{BASE}/settings").status_code == 403

    # Managing: global changes need every corporation's wallets; a corporation's own tag needs only that one.
    manager = grant(viewer, "manage_finance")
    api_client.force_login(manager)
    assert api_client.get(f"{BASE}/settings").status_code == 200
    r = api_client.call("put", f"{BASE}/categories/player_donation", {"category": "Donations"})
    assert r.status_code == 403 and "Sister Corp" in r.json()["detail"]
    assert api_client.call("post", f"{BASE}/rules", {"party_id": SRP_GUY, "category": "SRP payouts"}).status_code == 403
    r = api_client.call("post", f"{BASE}/rules", {"party_id": SRP_GUY, "category": "SRP payouts", "direction": "out", "corporation_id": corp.pk})
    assert r.status_code == 200 and r.json()["party_name"] == "SRP Guy"
    assert api_client.call("post", f"{BASE}/rules", {"party_id": SRP_GUY, "category": "X", "corporation_id": sister.pk}).status_code == 403
    # The settings list rules for every corporation and for the ones they may see, not the sister corporation's.
    CounterpartyRule.objects.create(party_id=BUYBACK, category="Buyback", corporation_id=sister.pk)
    CounterpartyRule.objects.create(party_id=BUYBACK, category="Buyback", direction="in")
    shown = [(r["category"], r["corporation_id"]) for r in api_client.get(f"{BASE}/settings").json()["rules"]]
    assert sorted(shown, key=str) == sorted([("SRP payouts", corp.pk), ("Buyback", None)], key=str)
    api_client.force_login(officer)
    assert len(api_client.get(f"{BASE}/settings").json()["rules"]) == 3
    CounterpartyRule.objects.filter(party_id=BUYBACK).delete()

    api_client.force_login(officer)
    assert api_client.call("put", f"{BASE}/categories/player_donation", {"category": "Donations"}).status_code == 200
    assert CategoryOverride.objects.get(ref_type="player_donation").category == "Donations"
    assert api_client.call("put", f"{BASE}/categories/player_donation", {"category": cat.TRANSFERS}).status_code == 200
    assert not CategoryOverride.objects.exists()  # back to the built-in one
    bad = api_client.call("put", f"{BASE}/categories/player_donation", {"category": cat.INTERNAL})
    assert bad.status_code == 400
    rule_id = CounterpartyRule.objects.get().pk
    assert api_client.call("delete", f"{BASE}/rules/{rule_id}").status_code == 200
    group = Group.objects.create(name="Directors")
    r = api_client.call("put", f"{BASE}/settings", {"corporations": [corp.pk, sister.pk], "report_group": group.pk})
    assert r.status_code == 200 and r.json()["report_group"] == group.pk
    assert services.tracked_corporations() == {corp.pk, sister.pk}
    assert api_client.call("put", f"{BASE}/settings", {"corporations": [123]}).status_code == 400


def test_months_list_and_bad_input(books, officer, api_client):
    api_client.force_login(officer)
    data = api_client.get(f"{BASE}/months").json()
    assert data["months"][0]["current"] and len(data["months"]) == 3 and data["can_manage"]
    assert api_client.get(f"{BASE}/report?month=nope").status_code == 400
    assert api_client.get(f"{BASE}/parties?q=SRP").json()[0]["name"] == "SRP Guy"
    assert api_client.get(f"{BASE}/parties?q={SRP_GUY}").json()[0]["name"] == "SRP Guy"
