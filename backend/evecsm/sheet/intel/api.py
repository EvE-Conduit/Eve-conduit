"""Who a character deals with, built from data other sections already hold.

Useful for recruiters and directors: frequent counterparties, interactions with
characters registered here (alts or spies), and the account's other characters.
"""

from collections import defaultdict

from django.db.models import Count, Max

from evecsm.accounts.models import Character
from evecsm.eve.models import EveName
from evecsm.schemas import character_brief
from evecsm.sheet.api import router, viewable_character
from evecsm.sheet.contacts.api import entity_image
from evecsm.sheet.contacts.models import Contact
from evecsm.sheet.contracts.models import Contract
from evecsm.sheet.mail.models import Mail
from evecsm.sheet.wallet.models import JournalEntry, WalletTransaction

NPC_ID_LIMIT = 4_000_000  # NPC corporations, factions and agents live below this
LIMIT = 30


@router.get("/{character_id}/intel")
def intel(request, character_id: int):
    character = viewable_character(request, character_id)
    me = character.pk
    counts: dict[int, dict] = defaultdict(lambda: {"journal": 0, "market": 0, "mail": 0, "contracts": 0, "last": None})

    def bump(entity_id, source, when, n=1):
        if not entity_id or entity_id == me or entity_id < NPC_ID_LIMIT:
            return
        row = counts[entity_id]
        row[source] += n
        if when and (row["last"] is None or when > row["last"]):
            row["last"] = when

    journal = JournalEntry.objects.filter(character=character)
    for field in ("first_party_id", "second_party_id"):
        for r in journal.values(field).annotate(n=Count("id"), last=Max("date")):
            bump(r[field], "journal", r["last"], r["n"])
    for r in WalletTransaction.objects.filter(character=character).values("client_id").annotate(n=Count("id"), last=Max("date")):
        bump(r["client_id"], "market", r["last"], r["n"])
    for m in Mail.objects.filter(character=character).only("sender_id", "recipients", "timestamp"):
        bump(m.sender_id, "mail", m.timestamp)
        for rec in m.recipients:
            if rec["recipient_type"] != "mailing_list":
                bump(rec["recipient_id"], "mail", m.timestamp)
    for c in Contract.objects.filter(character=character).only("issuer_id", "assignee_id", "acceptor_id", "date_issued"):
        for party in {c.issuer_id, c.assignee_id, c.acceptor_id}:
            bump(party, "contracts", c.date_issued)

    ranked = sorted(counts.items(), key=lambda kv: -(kv[1]["journal"] + kv[1]["market"] + kv[1]["mail"] + kv[1]["contracts"]))[:LIMIT]
    ids = [i for i, _ in ranked]
    names = {n.id: n for n in EveName.objects.filter(pk__in=ids)}
    members = {c.pk: c for c in Character.objects.filter(pk__in=ids).select_related("user__main_character")}
    standings = dict(Contact.objects.filter(character=character, contact_id__in=ids).values_list("contact_id", "standing"))

    interactions = []
    for entity_id, row in ranked:
        name = names.get(entity_id)
        kind = name.category if name else "character"
        member = members.get(entity_id)
        interactions.append(
            {
                "id": entity_id,
                "name": name.name if name else str(entity_id),
                "type": kind,
                "image": entity_image(kind, entity_id),
                "journal": row["journal"],
                "market": row["market"],
                "mail": row["mail"],
                "contracts": row["contracts"],
                "total": row["journal"] + row["market"] + row["mail"] + row["contracts"],
                "last": row["last"].isoformat() if row["last"] else None,
                "standing": standings.get(entity_id),
                "member": {
                    "user_id": member.user_id,
                    "main": member.user.main_character.name if member.user.main_character else None,
                    "same_account": member.user_id == character.user_id,
                }
                if member
                else None,
            }
        )

    account = Character.objects.filter(user=character.user).exclude(pk=me).select_related("corporation", "alliance")
    return {
        "interactions": interactions,
        "registered_counterparties": sum(1 for i in interactions if i["member"] and not i["member"]["same_account"]),
        "account_characters": [character_brief(c) for c in account],
    }
