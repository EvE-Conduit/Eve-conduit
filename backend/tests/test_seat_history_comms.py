"""The SeAT history import for mail, notifications and the calendar."""

import json

import pytest

from conduit.accounts.models import Token
from conduit.eve.models import EveName
from conduit.sheet.calendar.models import CalendarEvent
from conduit.sheet.mail.models import Mail, MailLabel
from conduit.sheet.models import SyncStatus
from conduit.sheet.notifications.models import Notification

from .conftest import make_user
from .seat_history import run, token_row, write_dump

DEAD, LIVE = 91000101, 91000102
OUTSIDER, CORP, LIST = 2112, 98000001, 145000001


def header(mail_id, sender, when, subject=None):
    return {"mail_id": mail_id, "subject": subject or f"Mail {mail_id}", "from": sender, "timestamp": when,
            "created_at": when, "updated_at": when}


def recipient(rid, mail_id, who, kind="character", is_read=0, labels=None):
    return {"id": rid, "mail_id": mail_id, "recipient_id": who, "recipient_type": kind, "is_read": is_read,
            "labels": None if labels is None else json.dumps(labels)}


def notification(rid, cid, nid, when, is_read=1, text="amount: 1000\nitemID: 1\n"):
    return {"id": rid, "character_id": cid, "notification_id": nid, "type": "InsurancePayoutMsg",
            "sender_id": 1000132, "sender_type": "corporation", "timestamp": when, "is_read": is_read, "text": text,
            "created_at": when, "updated_at": when}


def event(rid, cid, eid, when, title, response="accepted"):
    return {"id": rid, "character_id": cid, "event_id": eid, "event_date": when, "title": title, "importance": 1,
            "event_response": response, "created_at": when, "updated_at": when}


def detail(eid, text, owner_name="Gone Pilot", owner_id=DEAD, owner_type="character", duration=60):
    return {"event_id": eid, "owner_id": owner_id, "owner_name": owner_name, "duration": duration, "text": text,
            "owner_type": owner_type, "created_at": None, "updated_at": None}


def comms_dump(tmp_path):
    headers, recipients, bodies = [], [], []
    rid = 0

    def add_recipient(*args, **kwargs):
        nonlocal rid
        rid += 1
        recipients.append(recipient(rid, *args, **kwargs))

    # 120 mails to the dead character from an outsider (more than two pages of 50); every 3rd one is unread.
    for n in range(120):
        mail_id = 1000 + n
        headers.append(header(mail_id, OUTSIDER, f"2019-01-{1 + n % 28:02d} 10:{n % 60:02d}:00"))
        add_recipient(mail_id, DEAD, is_read=0 if n % 3 == 0 else 1, labels=[1, 3] if n % 2 else [1])
        if mail_id != 1007:  # one SeAT never fetched the body for
            bodies.append({"mail_id": mail_id, "body": f"<font size=\"12\">Hello {n}</font><br>bye",
                           "created_at": None, "updated_at": None})
    # One the dead character sent to the live one and to a mailing list; SeAT adds the sender as a recipient too.
    headers.append(header(2000, DEAD, "2019-02-01 09:00:00", "Fleet tonight"))
    add_recipient(2000, LIVE, is_read=0, labels=[1])
    add_recipient(2000, LIST, kind="mailing_list")
    add_recipient(2000, DEAD, is_read=1, labels=[2])
    bodies.append({"mail_id": 2000, "body": "Form up at 20:00", "created_at": None, "updated_at": None})
    # The live character's: an old one, and the newest one that EVE also gave (read and relabelled since).
    headers.append(header(1500, OUTSIDER, "2018-06-01 00:00:00", "Old news"))
    add_recipient(1500, LIVE, is_read=0, labels=[1])
    bodies.append({"mail_id": 1500, "body": "From long ago", "created_at": None, "updated_at": None})
    headers.append(header(5000, OUTSIDER, "2025-02-01 00:00:00", "Recent"))
    add_recipient(5000, LIVE, is_read=0, labels=[1])
    bodies.append({"mail_id": 5000, "body": "SeAT copy", "created_at": None, "updated_at": None})

    return write_dump(tmp_path / "seat.sql", {
        "refresh_tokens": [token_row(DEAD, deleted_at="2025-03-02 00:00:00"), token_row(LIVE)],
        "universe_names": [{"entity_id": OUTSIDER, "name": "Some Sender", "category": "character"}],
        "mail_headers": headers,
        "mail_recipients": recipients,
        "mail_bodies": bodies,
        "mail_labels": [
            {"id": 1, "character_id": DEAD, "label_id": 1, "name": "Inbox", "color": "#ffffff",
             "created_at": None, "updated_at": None},
            {"id": 2, "character_id": DEAD, "label_id": 3, "name": "[Corp]", "color": "#ffffff",
             "created_at": None, "updated_at": None},
            {"id": 3, "character_id": DEAD, "label_id": 256, "name": "Market", "color": "#ff6600",
             "created_at": None, "updated_at": None},
            {"id": 4, "character_id": LIVE, "label_id": 1, "name": "Inbox", "color": "#ffffff",
             "created_at": None, "updated_at": None},
            {"id": 5, "character_id": LIVE, "label_id": 300, "name": "Deleted since", "color": "#000000",
             "created_at": None, "updated_at": None},
        ],
        "mail_mailing_lists": [{"id": 1, "character_id": DEAD, "mailing_list_id": LIST, "name": "Fleet Pings",
                                "created_at": None, "updated_at": None}],
        "character_notifications": [
            notification(1, DEAD, 700001, "2019-03-01 12:00:00"),
            notification(2, DEAD, 700002, "2019-03-02 12:00:00", is_read=0, text=None),
            notification(3, DEAD, 700002, "2019-03-02 12:00:00", is_read=0, text=None),  # SeAT kept it twice
            notification(4, LIVE, 700003, "2018-01-01 00:00:00"),
            notification(5, LIVE, 800000, "2025-02-01 00:00:00", is_read=0),
        ],
        "character_calendar_events": [
            event(1, DEAD, 9001, "2019-04-01 19:00:00", "Mining op"),
            event(2, DEAD, 9002, "2019-04-02 19:00:00", "Roam", response="declined"),
            event(3, LIVE, 9003, "2018-04-01 19:00:00", "Old op"),
            event(4, LIVE, 9100, "2025-03-01 19:00:00", "SeAT title", response="not_responded"),
        ],
        "character_calendar_event_details": [
            detail(9001, "Bring <b>barges</b>"), detail(9003, "Old op details", owner_name="Live Pilot", owner_id=LIVE),
            detail(9100, "SeAT details"),  # 9002 has none
        ],
        "character_calendar_attendees": [{"id": 1, "event_id": 9001, "character_id": DEAD,
                                          "event_response": "accepted", "created_at": None, "updated_at": None}],
    })


SECTIONS = ["mail", "notifications", "calendar"]


@pytest.fixture
def people(db):
    dead = make_user(DEAD, "Gone Pilot").main_character
    Token.objects.filter(character=dead).update(valid=False)
    live = make_user(LIVE, "Live Pilot").main_character
    # The live character synced all three from EVE already.
    Mail.objects.create(character=live, mail_id=5000, sender_id=OUTSIDER, subject="Recent",
                        timestamp="2025-02-01T00:00:00Z", is_read=True, labels=[1, 400], body="EVE copy",
                        body_fetched=True)
    MailLabel.objects.create(character=live, label_id=1, name="Inbox", color="#ffffff", unread=0)
    MailLabel.objects.create(character=live, label_id=400, name="From EVE", color="#00ff00", unread=0)
    Notification.objects.create(character=live, notification_id=800000, type="InsurancePayoutMsg", sender_id=1000132,
                                sender_type="corporation", timestamp="2025-02-01T00:00:00Z", is_read=True, text="eve")
    CalendarEvent.objects.create(character=live, event_id=9100, date="2025-03-02T19:00:00Z", title="EVE title",
                                 importance=0, response="accepted")
    for key in SECTIONS:
        SyncStatus.objects.create(character=live, section=key, result="ok", last_success="2025-02-02T00:00:00Z")
    return dead, live


def snapshot():
    return (
        sorted(Mail.objects.values_list("character_id", "mail_id", "is_read", "labels", "body", "body_fetched",
                                        "recipients")),
        sorted(MailLabel.objects.values_list("character_id", "label_id", "name", "color", "unread")),
        sorted(Notification.objects.values_list("character_id", "notification_id", "is_read", "text")),
        sorted(CalendarEvent.objects.values_list("character_id", "event_id", "date", "title", "response", "text",
                                                 "detail_fetched")),
    )


@pytest.mark.django_db
def test_mail_comes_over_whole(tmp_path, people):
    dead, live = people
    summary = run(comms_dump(tmp_path), sections=["mail"])
    assert not summary["errors"], summary["errors"]
    assert summary["sections"]["mail"] == {"imported": 2, "skipped": 0, "errors": 0}

    # Every mail SeAT had for the dead character, past both per-run caps (header pages, bodies).
    mails = Mail.objects.filter(character=dead)
    assert mails.count() == 121
    m = mails.get(mail_id=1005)
    assert m.sender_id == OUTSIDER and m.subject == "Mail 1005" and m.is_read and m.labels == [1, 3]
    assert m.timestamp.isoformat() == "2019-01-06T10:05:00+00:00"
    assert m.recipients == [{"recipient_id": DEAD, "recipient_type": "character"}]
    assert m.body == "Hello 5\nbye" and m.body_fetched
    assert not mails.get(mail_id=1000).is_read
    assert mails.filter(body_fetched=False).count() == 0
    assert mails.get(mail_id=1007).body == ""  # SeAT never had it; nothing to wait for
    sent = mails.get(mail_id=2000)
    assert sent.sender_id == DEAD and sent.is_read and sent.labels == [2] and sent.body == "Form up at 20:00"
    assert sent.recipients == [{"recipient_id": LIVE, "recipient_type": "character"},
                               {"recipient_id": LIST, "recipient_type": "mailing_list"}]
    labels = {lab.label_id: lab for lab in MailLabel.objects.filter(character=dead)}
    assert set(labels) == {1, 3, 256} and labels[256].name == "Market" and labels[256].color == "#ff6600"
    assert labels[1].unread == 40 and labels[3].unread == 20
    assert EveName.objects.get(pk=LIST).name == "Fleet Pings"
    assert SyncStatus.objects.get(character=dead, section="mail").message.startswith("From SeAT")

    # The live one gains the older mails; what EVE gave (read state, labels, body) stays.
    assert set(Mail.objects.filter(character=live).values_list("mail_id", flat=True)) == {5000, 1500, 2000}
    recent = Mail.objects.get(character=live, mail_id=5000)
    assert recent.is_read and recent.labels == [1, 400] and recent.body == "EVE copy"
    old = Mail.objects.get(character=live, mail_id=1500)
    assert not old.is_read and old.body == "From long ago"
    assert not Mail.objects.get(character=live, mail_id=2000).is_read  # its own read state, not the sender's
    assert sorted(MailLabel.objects.filter(character=live).values_list("label_id", "name")) == [
        (1, "Inbox"), (400, "From EVE")]
    assert SyncStatus.objects.get(character=live, section="mail").message == ""


@pytest.mark.django_db
def test_notifications_come_over(tmp_path, people):
    dead, live = people
    summary = run(comms_dump(tmp_path), sections=["notifications"])
    assert not summary["errors"], summary["errors"]
    rows = {n.notification_id: n for n in Notification.objects.filter(character=dead)}
    assert set(rows) == {700001, 700002}
    assert rows[700001].is_read and rows[700001].type == "InsurancePayoutMsg" and rows[700001].sender_id == 1000132
    assert rows[700001].sender_type == "corporation" and rows[700001].text == "amount: 1000\nitemID: 1\n"
    assert rows[700001].timestamp.isoformat() == "2019-03-01T12:00:00+00:00"
    assert not rows[700002].is_read and rows[700002].text == ""
    assert set(Notification.objects.filter(character=live).values_list("notification_id", flat=True)) == {700003, 800000}
    kept = Notification.objects.get(character=live, notification_id=800000)
    assert kept.is_read and kept.text == "eve"


@pytest.mark.django_db
def test_calendar_comes_over(tmp_path, people):
    dead, live = people
    summary = run(comms_dump(tmp_path), sections=["calendar"])
    assert not summary["errors"], summary["errors"]
    rows = {e.event_id: e for e in CalendarEvent.objects.filter(character=dead)}
    assert set(rows) == {9001, 9002}
    op = rows[9001]
    assert op.title == "Mining op" and op.importance == 1 and op.response == "accepted"
    assert op.date.isoformat() == "2019-04-01T19:00:00+00:00"
    assert op.detail_fetched and op.duration == 60 and op.owner_name == "Gone Pilot"
    assert op.owner_type == "character" and op.text == "Bring barges"
    assert rows[9002].response == "declined" and not rows[9002].detail_fetched  # SeAT had no details

    assert set(CalendarEvent.objects.filter(character=live).values_list("event_id", flat=True)) == {9003, 9100}
    assert CalendarEvent.objects.get(character=live, event_id=9003).text == "Old op details"
    kept = CalendarEvent.objects.get(character=live, event_id=9100)
    assert kept.title == "EVE title" and kept.response == "accepted" and kept.date.day == 2
    assert not kept.detail_fetched and kept.text == ""  # EVE's own event: details come from EVE


@pytest.mark.django_db
def test_running_again_changes_nothing(tmp_path, people):
    dump = comms_dump(tmp_path)
    first = run(dump, sections=SECTIONS)
    assert not first["errors"], first["errors"]
    before = snapshot()
    second = run(dump, sections=SECTIONS)
    assert not second["errors"], second["errors"]
    assert snapshot() == before
