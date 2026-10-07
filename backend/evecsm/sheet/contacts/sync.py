from django.db import transaction

from evecsm.eve.tasks import ensure_eve_names

from .models import Contact


def sync(character, esi):
    cid = character.pk
    rows = esi.get_all_pages(f"/characters/{cid}/contacts", character=character)
    labels = {lab["label_id"]: lab["label_name"] for lab in esi.get(f"/characters/{cid}/contacts/labels", character=character).data}
    with transaction.atomic():
        Contact.objects.filter(character=character).delete()
        Contact.objects.bulk_create(
            Contact(
                character=character,
                contact_id=r["contact_id"],
                contact_type=r["contact_type"],
                standing=r["standing"],
                is_blocked=r.get("is_blocked", False),
                is_watched=r.get("is_watched", False),
                labels=[labels[i] for i in r.get("label_ids", []) if i in labels],
            )
            for r in rows
        )
    ensure_eve_names({r["contact_id"] for r in rows})
