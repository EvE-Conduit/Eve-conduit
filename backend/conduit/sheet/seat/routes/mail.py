"""Mail: every mail SeAT kept for the character, with labels, read state and bodies.

SeAT keeps one copy of each mail (``mail_headers``, ``mail_bodies``) and ties it to characters through
``mail_recipients``: the owner's own row (recipient_id = the character) carries that character's ``is_read`` and
``labels``. Mails the character sent are found by ``mail_headers.from`` too.

Mails Conduit already has are never sent again, so read state and labels a live sync set stay as they are, and the
header loop never stops early on a page with a known mail. Labels and mailing lists come from Conduit's own rows once
the section has synced from EVE (the sync deletes and recreates labels each run).
"""

import json

from conduit.esi.exceptions import EsiError
from conduit.eve.models import EveName
from conduit.sheet.mail.models import Mail, MailLabel

from ..esi import drop_none, esi_dt, missing, route
from . import HISTORY, section

PAGE = 50

section(
    "mail", HISTORY, ["mail_headers", "mail_recipients", "mail_bodies", "mail_labels", "mail_mailing_lists"],
    indexes={"mail_headers": ("mail_id", "from"), "mail_recipients": ("mail_id", "recipient_id"),
             "mail_bodies": ("mail_id",)},
    limits=[("conduit.sheet.mail.sync", "HEADER_PAGES", 10**9), ("conduit.sheet.mail.sync", "BODY_FETCH_LIMIT", 10**9)],
)


def _labels(value) -> list[int]:
    if value in (None, ""):
        return []
    try:
        found = json.loads(value) if isinstance(value, str) else value
    except ValueError:
        return []
    return [int(x) for x in found or [] if str(x).lstrip("-").isdigit()]


def _mails(ctx) -> dict[int, dict]:
    """The character's mails as ESI headers, {mail_id: header}, built once per run."""
    cached = ctx.cache.get("mails")
    if cached is not None:
        return cached
    cid, store = ctx.cid, ctx.store
    own = {int(r["mail_id"]): r for r in store.rows("mail_recipients", recipient_id=cid, recipient_type="character")}
    sent = {int(h["mail_id"]) for h in store.rows("mail_headers", **{"from": cid})}
    ids = set(own) | sent
    headers = {int(h["mail_id"]): h for h in store.rows_in("mail_headers", "mail_id", ids)}
    recipients: dict[int, list[dict]] = {}
    for r in store.rows_in("mail_recipients", "mail_id", headers):
        recipients.setdefault(int(r["mail_id"]), []).append(r)
    out = {}
    for mail_id, h in headers.items():
        sender = int(h["from"]) if h["from"] is not None else None
        rows = recipients.get(mail_id, [])
        if sender == cid and len(rows) > 1:
            # SeAT adds the owner as a recipient of their own sent mail; EVE doesn't list them.
            rows = [r for r in rows if not (int(r["recipient_id"]) == cid and r["recipient_type"] == "character")]
        mine = own.get(mail_id)
        out[mail_id] = {
            "mail_id": mail_id, "from": sender, "subject": h["subject"] or "", "timestamp": esi_dt(h["timestamp"]),
            "is_read": bool(int(mine["is_read"] or 0)) if mine else sender == cid,
            "labels": _labels(mine["labels"]) if mine else ([2] if sender == cid else []),
            "recipients": [{"recipient_id": int(r["recipient_id"]), "recipient_type": r["recipient_type"]} for r in rows],
        }
    ctx.cache["mails"] = out
    return out


@route("/characters/{cid}/mail/labels")
def labels(ctx, params, cid):
    if ctx.synced:  # keep the labels EVE gave; the sync rebuilds them from this answer
        rows = MailLabel.objects.filter(character_id=cid).order_by("label_id")
        out = [{"label_id": r.label_id, "name": r.name, "color": r.color, "unread_count": r.unread} for r in rows]
        return {"labels": out, "total_unread_count": sum(r["unread_count"] for r in out)}
    unread: dict[int, int] = {}
    for m in _mails(ctx).values():
        if not m["is_read"]:
            for lab in m["labels"]:
                unread[lab] = unread.get(lab, 0) + 1
    out = [
        {"label_id": int(r["label_id"]), "name": r["name"] or "", "color": r["color"] or "",
         "unread_count": unread.get(int(r["label_id"]), 0)}
        for r in sorted(ctx.store.rows("mail_labels", character_id=cid), key=lambda r: int(r["label_id"]))
    ]
    return {"labels": out, "total_unread_count": sum(r["unread_count"] for r in out)}


@route("/characters/{cid}/mail/lists")
def lists(ctx, params, cid):
    rows = [{"mailing_list_id": int(r["mailing_list_id"]), "name": r["name"]}
            for r in ctx.store.rows("mail_mailing_lists", character_id=cid) if r["name"]]
    if ctx.synced:  # names Conduit already has stay as they are
        have = set(EveName.objects.filter(pk__in=[r["mailing_list_id"] for r in rows]).values_list("id", flat=True))
        rows = [r for r in rows if r["mailing_list_id"] not in have]
    return rows


@route("/characters/{cid}/mail")
def headers(ctx, params, cid):
    """Newest first, 50 a page, below ``last_mail_id`` like EVE; only mails Conduit doesn't have yet."""
    known = set(Mail.objects.filter(character_id=cid).values_list("mail_id", flat=True))
    last = params.get("last_mail_id")
    ids = sorted((i for i in _mails(ctx) if i not in known and (last is None or i < int(last))), reverse=True)
    return [_mails(ctx)[i] for i in ids[:PAGE]]


@route("/characters/{cid}/mail/{mail_id}")
def body(ctx, params, cid, mail_id):
    row = ctx.store.one("mail_bodies", mail_id=mail_id)
    if row is None:
        if ctx.synced:  # leave it for a live sync to fetch from EVE
            raise EsiError(503, "body not in the SeAT dump")
        raise missing()
    header = _mails(ctx).get(mail_id, {})
    return drop_none({
        "body": row["body"] or "", "from": header.get("from"), "labels": header.get("labels", []),
        "read": header.get("is_read", False), "recipients": header.get("recipients", []),
        "subject": header.get("subject", ""), "timestamp": header.get("timestamp"),
    })
