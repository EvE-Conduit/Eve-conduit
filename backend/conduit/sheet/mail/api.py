from django.db.models import Q
from django.shortcuts import get_object_or_404
from ninja.pagination import paginate

from conduit.eve.tasks import names_for
from conduit.sheet.api import router, viewable_character

from .models import Mail, MailLabel


def _people(mails):
    ids = {m.sender_id for m in mails} | {r["recipient_id"] for m in mails for r in m.recipients}
    return names_for(ids)


def _row(m, names):
    return {
        "mail_id": m.mail_id,
        "subject": m.subject or "(no subject)",
        "sender": {"id": m.sender_id, "name": names.get(m.sender_id, "Unknown")} if m.sender_id else None,
        "recipients": [{"id": r["recipient_id"], "type": r["recipient_type"], "name": names.get(r["recipient_id"], str(r["recipient_id"]))} for r in m.recipients],
        "timestamp": m.timestamp.isoformat(),
        "is_read": m.is_read,
        "labels": m.labels,
        "preview": m.body[:140].replace("\n", " "),
    }


@router.get("/{character_id}/mail/labels")
def mail_labels(request, character_id: int):
    character = viewable_character(request, character_id)
    return [{"id": lab.label_id, "name": lab.name, "color": lab.color, "unread": lab.unread} for lab in MailLabel.objects.filter(character=character).order_by("label_id")]


@router.get("/{character_id}/mail", response=list[dict])
@paginate
def mail(request, character_id: int, q: str = "", label: int | None = None):
    qs = Mail.objects.filter(character=viewable_character(request, character_id))
    if q:
        qs = qs.filter(Q(subject__icontains=q) | Q(body__icontains=q))
    rows = list(qs[:3000])
    if label is not None:
        rows = [m for m in rows if label in m.labels]
    names = _people(rows)
    return [_row(m, names) for m in rows]


@router.get("/{character_id}/mail/{mail_id}")
def mail_detail(request, character_id: int, mail_id: int):
    m = get_object_or_404(Mail, character=viewable_character(request, character_id), mail_id=mail_id)
    return {**_row(m, _people([m])), "body": m.body, "body_loaded": m.body_fetched}
