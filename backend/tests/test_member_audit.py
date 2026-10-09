"""Member Audit: everyone's mail in one place, limited to the characters the viewer may see."""

from datetime import timedelta

import pytest
from django.contrib.auth.models import Permission
from django.utils import timezone

from conduit.audit.models import AuditEvent, SnoopEvent
from conduit.eve.models import EveAlliance, EveCorporation, EveName
from conduit.sheet.mail.models import Mail

from .conftest import make_user


def grant(user, *codenames):
    user.user_permissions.add(*Permission.objects.filter(content_type__app_label="sheet", codename__in=codenames))


def mail(character, mail_id, subject, body="", sender_id=None, ago=0, is_read=False):
    return Mail.objects.create(
        character=character, mail_id=mail_id, subject=subject, body=body, body_fetched=bool(body), sender_id=sender_id,
        timestamp=timezone.now() - timedelta(hours=ago), is_read=is_read,
        recipients=[{"recipient_id": character.pk, "recipient_type": "character"}],
    )


@pytest.fixture
def people(corp):
    other = EveCorporation.objects.create(id=98000002, name="Other Corp", ticker="OTHER", alliance=EveAlliance.objects.create(id=99000002, name="Other", ticker="OTH"))
    auditor = make_user(90000010, "Auditor", corporation=corp)
    one = make_user(90000020, "Line One", corporation=corp)
    two = make_user(90000030, "Line Two", corporation=corp)
    outsider = make_user(90000040, "Outsider", corporation=other)
    EveName.objects.create(id=91000001, name="Spy Master", category="character")
    mail(one.main_character, 1, "Fleet tonight", "Form up at 19:00", ago=1)
    mail(two.main_character, 1, "Fleet tonight", "Form up at 19:00", ago=1, is_read=True)
    mail(two.main_character, 2, "Hello", "Please send the doctrine fits", sender_id=91000001, ago=2)
    mail(outsider.main_character, 3, "Secret", "Not yours to read", ago=3)
    return auditor, one, two, outsider


@pytest.mark.django_db
def test_needs_the_member_audit_permission(people, client):
    auditor, *_ = people
    grant(auditor, "view_corporation_characters")
    client.force_login(auditor)
    assert client.get("/api/member-audit/mail").status_code == 403
    assert client.get("/api/member-audit/summary").status_code == 403


@pytest.mark.django_db
def test_mail_of_characters_in_reach_one_row_per_mail(people, client):
    auditor, one, two, _ = people
    grant(auditor, "use_member_audit", "view_corporation_characters")
    client.force_login(auditor)
    data = client.get("/api/member-audit/mail").json()
    assert data["count"] == 2  # the other corporation's mail is out of reach
    first, second = data["items"]
    assert first["mail_id"] == 1 and [h["name"] for h in first["held_by"]] == ["Line One", "Line Two"]
    assert [h["is_read"] for h in first["held_by"]] == [False, True]
    assert second["sender"] == {"id": 91000001, "name": "Spy Master"}

    summary = client.get("/api/member-audit/summary").json()
    assert summary["characters"] == 3 and summary["corporations"][0]["ticker"] == "TCORP"


@pytest.mark.django_db
def test_search_and_filters(people, client, corp):
    auditor, *_ = people
    grant(auditor, "use_member_audit", "view_all_characters")
    client.force_login(auditor)
    assert client.get("/api/member-audit/mail").json()["count"] == 3
    assert [r["mail_id"] for r in client.get("/api/member-audit/mail?q=doctrine").json()["items"]] == [2]
    assert [r["mail_id"] for r in client.get("/api/member-audit/mail?q=spy").json()["items"]] == [2]  # sender's name
    assert [r["mail_id"] for r in client.get("/api/member-audit/mail?sender=91000001").json()["items"]] == [2]
    assert client.get(f"/api/member-audit/mail?corporation={corp.pk}").json()["count"] == 2
    client.get("/api/member-audit/mail?q=doctrine")  # the same search again is recorded once
    events = AuditEvent.objects.filter(action="member_audit.search")
    assert [e.details["q"] for e in events.order_by("id")] == ["doctrine", "spy"]


@pytest.mark.django_db
def test_opening_a_mail_is_snooped_for_every_holder(people, client):
    auditor, *_ = people
    grant(auditor, "use_member_audit", "view_corporation_characters")
    client.force_login(auditor)
    data = client.get("/api/member-audit/mail/1").json()
    assert data["body"] == "Form up at 19:00" and len(data["held_by"]) == 2
    assert sorted(SnoopEvent.objects.values_list("character_name", flat=True)) == ["Line One", "Line Two"]
    assert set(SnoopEvent.objects.values_list("section", flat=True)) == {"mail"}
    assert client.get("/api/member-audit/mail/3").status_code == 404  # another corporation's


@pytest.mark.django_db
def test_character_sheet_lists_the_owners_alts(people, client):
    from conduit.accounts.models import Character

    auditor, one, _, _ = people
    grant(auditor, "view_corporation_characters")
    other_corp = EveCorporation.objects.get(pk=98000002)
    Character.objects.create(id=90000021, name="Alt Out Of Corp", owner_hash="h21", user=one, corporation=other_corp)
    Character.objects.create(id=90000022, name="Alt In Corp", owner_hash="h22", user=one, corporation=one.main_character.corporation)
    client.force_login(auditor)
    alts = client.get("/api/characters/90000022").json()["alts"]
    assert [(a["name"], a["is_main"], a["viewable"]) for a in alts] == [("Line One", True, True), ("Alt Out Of Corp", False, False)]
    assert alts[1]["corporation"]["ticker"] == "OTHER"


@pytest.mark.django_db
def test_search_logging_ignores_other_sites_and_long_queries(people, client):
    auditor, *_ = people
    grant(auditor, "use_member_audit", "view_all_characters")
    client.force_login(auditor)
    client.get("/api/member-audit/mail?q=planted", HTTP_SEC_FETCH_SITE="cross-site")  # a link on another site
    assert not AuditEvent.objects.filter(action="member_audit.search").exists()
    client.get("/api/member-audit/mail?q=" + "x" * 5000, HTTP_SEC_FETCH_SITE="same-origin")
    assert len(AuditEvent.objects.get(action="member_audit.search").details["q"]) == 200


# --- counterparties, wallets, contracts, skill check ---------------------------------------------------------------

SPY = 91000001
OUTSIDE_CORP = 98500000


def journal(character, ref_id, amount, first, second, ref_type="player_donation", reason=""):
    from conduit.sheet.wallet.models import JournalEntry

    return JournalEntry.objects.create(character=character, ref_id=ref_id, date=timezone.now() - timedelta(hours=ref_id), ref_type=ref_type,
                                       amount=amount, first_party_id=first, second_party_id=second, reason=reason)


def contract(character, contract_id, issuer, assignee=0, acceptor=0, title="", price=0, status="outstanding", items_fetched=False):
    from conduit.sheet.contracts.models import Contract

    now = timezone.now()
    return Contract.objects.create(character=character, contract_id=contract_id, type="item_exchange", status=status, title=title,
                                   availability="personal", issuer_id=issuer, issuer_corporation_id=98000001, assignee_id=assignee,
                                   acceptor_id=acceptor, price=price, date_issued=now - timedelta(hours=contract_id), date_expired=now + timedelta(days=7),
                                   items_fetched=items_fetched)


@pytest.fixture
def dealings(people):
    from conduit.sheet.contacts.models import Contact

    auditor, one, two, outsider = people
    a, b, o = one.main_character, two.main_character, outsider.main_character
    EveName.objects.create(id=OUTSIDE_CORP, name="Shady Holdings", category="corporation")
    journal(a, 1, -5_000_000_000, a.pk, SPY, reason="for the intel")
    journal(a, 2, 2_000_000, SPY, a.pk)
    journal(b, 3, -100_000_000, b.pk, a.pk)  # between two members: not "outside"
    journal(a, 4, 100_000_000, b.pk, a.pk)
    journal(a, 5, 900_000, 1000125, a.pk, ref_type="bounty_prizes")  # NPC
    journal(o, 6, 7_000_000_000, SPY, o.pk)  # out of reach
    Contact.objects.create(character=b, contact_id=SPY, contact_type="character", standing=10)
    contract(a, 100, a.pk, assignee=SPY, title="Doctrine fits", price=1_000_000_000)
    contract(a, 101, a.pk, assignee=b.pk, title="Internal", price=5)
    contract(b, 101, a.pk, assignee=b.pk, title="Internal", price=5, items_fetched=True)
    contract(o, 102, o.pk, assignee=SPY, title="Not ours")
    return people


@pytest.mark.django_db
def test_counterparty_lists_every_member_who_dealt_with_them(dealings, client):
    auditor, one, two, _ = dealings
    grant(auditor, "use_member_audit", "view_corporation_characters")
    client.force_login(auditor)
    assert [e["id"] for e in client.get("/api/member-audit/entities?q=spy").json()] == [SPY]
    data = client.get(f"/api/member-audit/counterparty?entity={SPY}").json()
    assert data["entity"]["name"] == "Spy Master" and not data["member"]
    rows = {r["character"]["name"]: r for r in data["characters"]}
    assert set(rows) == {"Line One", "Line Two"}  # the outsider's dealings are out of reach
    assert rows["Line One"]["journal"] == 2 and rows["Line One"]["isk_out"] == 5_000_000_000 and rows["Line One"]["isk_in"] == 2_000_000
    assert rows["Line One"]["contracts"] == 1
    assert rows["Line Two"]["mail"] == 1 and rows["Line Two"]["standing"] == 10
    assert SnoopEvent.objects.filter(section="intel").count() == 2
    assert AuditEvent.objects.get(action="member_audit.search").details == {"section": "counterparties", "q": "Spy Master"}


@pytest.mark.django_db
def test_wallet_filters_large_and_outside_transfers(dealings, client):
    auditor, *_ = dealings
    grant(auditor, "use_member_audit", "view_corporation_characters")
    client.force_login(auditor)
    data = client.get("/api/member-audit/wallet").json()
    assert data["count"] == 5
    assert data["items"][0]["first_party"]["name"] == "Line One" and data["items"][0]["second_party"]["name"] == "Spy Master"
    assert [r["amount"] for r in client.get("/api/member-audit/wallet?min_amount=50000000").json()["items"]] == [-5e9, -1e8, 1e8]
    assert [r["amount"] for r in client.get("/api/member-audit/wallet?outside=true").json()["items"]] == [-5e9, 2e6]
    assert [r["amount"] for r in client.get("/api/member-audit/wallet?outside=true&direction=in").json()["items"]] == [2e6]
    assert [r["amount"] for r in client.get("/api/member-audit/wallet?q=intel").json()["items"]] == [-5e9]
    assert [r["amount"] for r in client.get("/api/member-audit/wallet?q=spy").json()["items"]] == [-5e9, 2e6]  # a party's name
    assert client.get("/api/member-audit/wallet?ref_type=bounty_prizes").json()["count"] == 1
    assert client.get("/api/member-audit/wallet/ref-types").json() == ["bounty_prizes", "player_donation"]
    assert set(SnoopEvent.objects.values_list("section", flat=True)) == {"wallet"}


@pytest.mark.django_db
def test_contracts_one_row_per_contract(dealings, client):
    auditor, *_ = dealings
    grant(auditor, "use_member_audit", "view_corporation_characters")
    client.force_login(auditor)
    data = client.get("/api/member-audit/contracts").json()
    assert [r["contract_id"] for r in data["items"]] == [100, 101]
    assert [h["name"] for h in data["items"][1]["held_by"]] == ["Line Two", "Line One"]  # the copy with items first
    assert [r["contract_id"] for r in client.get("/api/member-audit/contracts?outside=true").json()["items"]] == [100]
    assert [r["contract_id"] for r in client.get("/api/member-audit/contracts?min_value=1000000").json()["items"]] == [100]
    assert [r["contract_id"] for r in client.get("/api/member-audit/contracts?q=spy").json()["items"]] == [100]
    detail = client.get("/api/member-audit/contracts/101").json()
    assert detail["items_loaded"] and len(detail["held_by"]) == 2
    assert client.get("/api/member-audit/contracts/102").status_code == 404


@pytest.mark.django_db
def test_skill_check(people, client):
    from conduit.sde.models import ItemCategory, ItemGroup, ItemType, SkillInfo
    from conduit.sheet.skills.models import CharacterSkill, SkillQueueItem, SkillSummary

    auditor, one, two, _ = people
    ItemCategory.objects.create(id=16, name="Skill", published=True)
    ItemCategory.objects.create(id=6, name="Ship", published=True)
    ItemGroup.objects.create(id=257, category_id=16, name="Spaceship Command", published=True)
    ItemGroup.objects.create(id=420, category_id=6, name="Destroyer", published=True)
    ItemType.objects.create(id=3327, name="Spaceship Command", group_id=257, published=True)
    ItemType.objects.create(id=3300, name="Gunnery", group_id=257, published=True)
    SkillInfo.objects.create(type_id=3327, rank=1, primary_attribute="perception", secondary_attribute="willpower")
    SkillInfo.objects.create(type_id=3300, rank=1, primary_attribute="perception", secondary_attribute="willpower")
    ItemType.objects.create(id=16236, name="Thrasher", group_id=420, published=True, required_skills=[[3327, 2]])
    for c in (one.main_character, two.main_character):
        SkillSummary.objects.create(character=c)
        CharacterSkill.objects.create(character=c, skill_id=3327, active_level=2, trained_level=2, skillpoints=1415)
    CharacterSkill.objects.create(character=one.main_character, skill_id=3300, active_level=3, trained_level=3, skillpoints=8000)
    SkillQueueItem.objects.create(character=two.main_character, position=0, skill_id=3300, finished_level=3, finish_date=timezone.now() + timedelta(days=1))
    grant(auditor, "use_member_audit", "view_corporation_characters")
    client.force_login(auditor)

    assert [t["name"] for t in client.get("/api/member-audit/types?q=thra").json()] == ["Thrasher"]
    data = client.post("/api/member-audit/skills/check", {"types": [16236], "text": "Gunnery III\nNot A Skill 2"}, content_type="application/json").json()
    assert data["skills"] == [{"id": 3300, "name": "Gunnery", "level": 3}, {"id": 3327, "name": "Spaceship Command", "level": 2}]
    assert data["problems"] == ["Not A Skill 2"]
    assert [(r["character"]["name"], r["status"]) for r in data["characters"]] == [("Line One", "ready"), ("Line Two", "queued"), ("Auditor", "unsynced")]
    assert data["counts"] == {"ready": 1, "queued": 1, "missing": 0, "unsynced": 1}
    assert AuditEvent.objects.get(action="member_audit.skill_check").summary.endswith("for Thrasher, 1 pasted skill levels")
    assert client.post("/api/member-audit/skills/check", {}, content_type="application/json").status_code == 400
