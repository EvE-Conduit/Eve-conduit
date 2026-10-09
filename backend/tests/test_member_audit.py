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
