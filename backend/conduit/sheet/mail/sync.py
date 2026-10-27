from django.db import transaction
from django.db.models import F

from conduit.esi.exceptions import EsiBackoff, EsiError
from conduit.eve.models import EveName
from conduit.eve.tasks import ensure_eve_names
from conduit.sheet.text import plain_text
from conduit.sheet.util import parse_dt
from conduit.db import upsert

from .models import Mail, MailLabel

HEADER_PAGES = 10  # 50 mails per page
BODY_FETCH_LIMIT = 50
#: Failed fetches after which a mail's body is no longer asked for.
MAX_FETCH_FAILURES = 5


def sync(character, esi):
    cid = character.pk
    labels = esi.get(f"/characters/{cid}/mail/labels", character=character).data
    lists = esi.get(f"/characters/{cid}/mail/lists", character=character).data
    known = set(Mail.objects.filter(character=character).values_list("mail_id", flat=True))

    headers, last_id = [], None
    for _ in range(HEADER_PAGES):
        page = esi.get(f"/characters/{cid}/mail", character=character, params={"last_mail_id": last_id} if last_id else None).data
        headers += page
        if len(page) < 50 or any(m.get("mail_id") in known for m in page):
            break
        last_id = min(m["mail_id"] for m in page)

    with transaction.atomic():
        MailLabel.objects.filter(character=character).delete()
        MailLabel.objects.bulk_create(
            MailLabel(
                character=character,
                label_id=lab["label_id"],
                name=lab.get("name", ""),
                color=lab.get("color", ""),
                unread=lab.get("unread_count") or 0,
            )
            for lab in labels.get("labels", [])
            if "label_id" in lab
        )
        # Mailing lists aren't in /universe/names; remember their names ourselves.
        upsert(
            EveName,
            [EveName(id=ml["mailing_list_id"], name=ml["name"], category="mailing_list") for ml in lists],
            unique_fields=["id"],
            update_fields=["name", "category"],
        )
        upsert(
            Mail,
            [
                Mail(
                    character=character,
                    mail_id=m["mail_id"],
                    sender_id=m.get("from"),
                    subject=(m.get("subject") or "")[:255],
                    timestamp=parse_dt(m["timestamp"]),
                    is_read=m.get("is_read", False),
                    labels=m.get("labels", []),
                    recipients=m.get("recipients", []),
                )
                for m in headers
                if m.get("mail_id") and m.get("timestamp")
            ],
            unique_fields=["character", "mail_id"],
            update_fields=["is_read", "labels"],
        )

    # Fewest failures first, so a body ESI keeps refusing can't hold up the others; give up after a few.
    pending = (
        Mail.objects.filter(character=character, body_fetched=False, fetch_failures__lt=MAX_FETCH_FAILURES)
        .order_by("fetch_failures", "-timestamp", "mail_id")[:BODY_FETCH_LIMIT]
    )
    for mail in pending:
        try:
            data = esi.get(f"/characters/{cid}/mail/{mail.mail_id}", character=character).data
        except EsiBackoff:
            break  # the rest wait for the next sync; the headers are already saved
        except EsiError as exc:
            if exc.status != 404:
                Mail.objects.filter(pk=mail.pk).update(fetch_failures=F("fetch_failures") + 1)
                if exc.status == 0 or exc.status >= 500:
                    break  # ESI is in trouble: don't burn its shared error limit on the rest
                continue
            data = {}
        mail.body = plain_text(data.get("body"))
        mail.body_fetched = True
        mail.save(update_fields=["body", "body_fetched"])

    people = {m.get("from") for m in headers}
    people |= {r["recipient_id"] for m in headers for r in m.get("recipients", []) if r["recipient_type"] != "mailing_list"}
    ensure_eve_names(people)
