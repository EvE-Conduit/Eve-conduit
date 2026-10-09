"""Member Audit: look through the data of every character the viewer may see in one place, starting with mail.

Who is included follows the character-sheet permissions (every member, the alliance or the corporation);
``sheet.use_member_audit`` only opens the page. Opening a mail goes in the snooper log like opening it on the
character sheet, and searches go in the audit log.
"""

from django.core.cache import cache
from django.db.models import Count, Max, Q
from django.http import Http404
from ninja import Router
from ninja.errors import HttpError

from conduit.audit.services import record, record_snoop
from conduit.eve.models import EveName
from conduit.paging import page

from .access import viewable_characters
from .mail.api import _people, _row
from .mail.models import Mail
from .models import SyncStatus

PERM = "sheet.use_member_audit"
SEARCH_DEDUPE_SECONDS = 600  # the same viewer and search is recorded once per 10 minutes
MAX_QUERY = 200  # longer searches are cut, so they can't bloat the audit log

router = Router(tags=["member audit"])


def _characters(request, corporation: int | None = None):
    if not request.user.has_perm(PERM):
        raise HttpError(403, "You don't have access to Member Audit")
    qs = viewable_characters(request.user)
    return qs.filter(corporation_id=corporation) if corporation else qs


def _note_search(request, what: str, q: str):
    # Searches are GETs, so a link on another site could open one in an auditor's browser and put words in their
    # mouth in the audit log. Browsers mark such requests; only the site's own pages are recorded.
    if request.META.get("HTTP_SEC_FETCH_SITE", "same-origin") not in {"same-origin", "none"}:
        return
    if cache.add(f"member_audit:{request.user.pk}:{what}:{q.lower()}", 1, SEARCH_DEDUPE_SECONDS):
        record("member_audit.search", f"searched members' {what} in Member Audit for “{q}”"[:300], request=request, details={"section": what, "q": q})


@router.get("/summary")
def summary(request):
    """How many characters are in reach, how many have their mail synced, and their corporations (for the filter)."""
    chars = _characters(request)
    corps = (
        chars.exclude(corporation=None)
        .values("corporation_id", "corporation__name", "corporation__ticker")
        .annotate(n=Count("pk"))
        .order_by("corporation__name")
    )
    return {
        "characters": chars.count(),
        "mail_synced": SyncStatus.objects.filter(character__in=chars.values("pk"), section="mail", last_success__isnull=False).count(),
        "corporations": [{"id": c["corporation_id"], "name": c["corporation__name"], "ticker": c["corporation__ticker"], "characters": c["n"]} for c in corps],
    }


def _holder(m: Mail) -> dict:
    c = m.character
    return {"id": c.pk, "name": c.name, "owner": c.user.display_name if c.user_id else "", "is_read": m.is_read}


@router.get("/mail")
def mail(request, q: str = "", corporation: int | None = None, sender: int | None = None, limit: int = 50, offset: int = 0):
    """Mail of every character in reach, newest first. A mail several members received is one row, with each
    member character that has it under ``held_by``. ``q`` matches the subject, text and sender's name."""
    chars = _characters(request, corporation).values("pk")
    qs = Mail.objects.filter(character__in=chars)
    q = q.strip()[:MAX_QUERY]
    if q:
        senders = EveName.objects.filter(name__icontains=q).values("id")
        qs = qs.filter(Q(subject__icontains=q) | Q(body__icontains=q) | Q(sender_id__in=senders))
        _note_search(request, "mail", q)
    if sender:
        qs = qs.filter(sender_id=sender)
    result = page(qs.values("mail_id").annotate(ts=Max("timestamp")).order_by("-ts", "-mail_id"), lambda r: r["mail_id"], limit, offset)

    copies: dict[int, list[Mail]] = {}
    for m in Mail.objects.filter(mail_id__in=result["items"], character__in=chars).select_related("character__user").order_by("character__name"):
        copies.setdefault(m.mail_id, []).append(m)
    firsts = [copies[i][0] for i in result["items"] if i in copies]
    names = _people(firsts)
    result["items"] = [{**_row(m, names), "held_by": [_holder(c) for c in copies[m.mail_id]]} for m in firsts]
    return result


@router.get("/mail/{mail_id}")
def mail_detail(request, mail_id: int):
    copies = list(Mail.objects.filter(mail_id=mail_id, character__in=_characters(request).values("pk")).select_related("character__user").order_by("character__name"))
    if not copies:
        raise Http404
    for m in copies:
        record_snoop(request, m.character, "mail")
    best = next((m for m in copies if m.body_fetched), copies[0])
    return {**_row(best, _people([best])), "held_by": [_holder(m) for m in copies], "body": best.body, "body_loaded": best.body_fetched}
