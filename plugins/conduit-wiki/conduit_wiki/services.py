"""Who sees which page, the page tree, saving with history, and search."""

from __future__ import annotations

import re

from django.contrib.auth.models import Group
from django.db import transaction
from django.db.models import Max, Q
from django.utils import timezone
from django.utils.text import slugify

from conduit.access.models import State
from conduit.eve.models import portrait_url

from .models import Page, Revision

#: The page shown when the wiki is opened, if someone has written it.
HOME_SLUG = "home"
MAX_BODY = 200_000


#: "Leave it as it is" for optional arguments of ``save``.
UNSET = object()


class WikiError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


# --- who may do what -------------------------------------------------------------------------------------------------


def can_edit(user) -> bool:
    return user.has_perm("wiki.edit_pages") or can_manage(user)


def can_manage(user) -> bool:
    return user.has_perm("wiki.manage_wiki")


def can_edit_page(user, page: Page) -> bool:
    """Editors change pages they can read unless the page is locked; managers change everything."""
    if can_manage(user):
        return True
    return can_edit(user) and not page.locked and visible_to(user).filter(pk=page.pk).exists()


def visible_to(user, qs=None):
    """Pages meant for this user. Managers see every page, so they can fix what nobody else can reach."""
    qs = Page.objects.all() if qs is None else qs
    if can_manage(user):
        return qs
    group_ids = list(user.groups.values_list("pk", flat=True))
    audience = Q(states__isnull=True, groups__isnull=True) | Q(groups__in=group_ids)
    if user.state_id:
        audience |= Q(states=user.state_id)
    return qs.filter(audience).distinct()


def public_pages(qs=None):
    qs = Page.objects.all() if qs is None else qs
    return qs.filter(public=True)


# --- reading ---------------------------------------------------------------------------------------------------------


def _person(user) -> dict | None:
    if user is None:
        return None
    return {"id": user.pk, "name": user.display_name, "portrait": portrait_url(user.main_character_id, 64) if user.main_character_id else None}


def node(p: Page) -> dict:
    return {"id": p.pk, "slug": p.slug, "title": p.title, "parent": p.parent_id, "order": p.order, "public": p.public, "locked": p.locked,
            "updated_at": p.updated_at.isoformat()}


def tree(pages) -> list[dict]:
    """Nest the pages under their parents. A page whose parent isn't in the set sits at the top."""
    rows = {p.pk: node(p) | {"children": []} for p in pages}
    roots = []
    for p in pages:
        row = rows[p.pk]
        parent = rows.get(p.parent_id) if p.parent_id else None
        (parent["children"] if parent else roots).append(row)
    return roots


def breadcrumbs(p: Page, allowed) -> list[dict]:
    """The page's ancestors, nearest last, skipping any the reader can't open."""
    out, seen, cur = [], {p.pk}, p.parent
    while cur is not None and cur.pk not in seen:
        seen.add(cur.pk)
        if cur.pk in allowed:
            out.append({"slug": cur.slug, "title": cur.title})
        cur = cur.parent
    out.reverse()
    return out


def out(p: Page, user=None, allowed: set[int] | None = None, editor: bool = False) -> dict:
    if allowed is None:
        allowed = set(visible_to(user).values_list("pk", flat=True)) if user is not None else set(public_pages().values_list("pk", flat=True))
    children = [c for c in p.children.all() if c.pk in allowed]
    row = node(p) | {
        "body": p.body,
        "breadcrumbs": breadcrumbs(p, allowed),
        "children": [node(c) for c in children],
        "created_at": p.created_at.isoformat(),
        "created_by": _person(p.created_by),
        "updated_by": _person(p.updated_by),
        "revisions": p.revisions.count(),
    }
    if user is not None:
        row["can_edit"] = can_edit_page(user, p)
    if editor:
        row |= {
            "states": [{"id": s.pk, "name": s.name, "color": s.color} for s in p.states.all()],
            "groups": [{"id": g.pk, "name": g.name} for g in p.groups.all()],
        }
    return row


def overview(user) -> dict:
    pages = list(visible_to(user).select_related("parent").order_by("order", "title"))
    home = next((p for p in pages if p.slug == HOME_SLUG), None)
    recent = sorted(pages, key=lambda p: p.updated_at, reverse=True)[:8]
    return {
        "tree": tree(pages),
        "count": len(pages),
        "home": out(home, user, {p.pk for p in pages}) if home else None,
        "recent": [node(p) for p in recent],
        "can_edit": can_edit(user),
        "can_manage": can_manage(user),
    }


def get_page(user, slug: str) -> Page:
    p = visible_to(user).filter(slug=slug).select_related("parent", "created_by__main_character", "updated_by__main_character").first()
    if p is None:
        raise WikiError("No such page", 404)
    return p


def history(p: Page) -> list[dict]:
    return [revision_out(r, with_body=False) for r in p.revisions.select_related("author__main_character")]


def revision_out(r: Revision, with_body: bool = True) -> dict:
    row = {"number": r.number, "title": r.title, "note": r.note, "author": _person(r.author), "created_at": r.created_at.isoformat()}
    if with_body:
        row["body"] = r.body
    return row


# --- writing ---------------------------------------------------------------------------------------------------------


def unique_slug(wanted: str, title: str, exclude_pk: int | None = None) -> str:
    base = slugify(wanted or title)[:100] or "page"
    slug, n = base, 2
    while Page.objects.filter(slug=slug).exclude(pk=exclude_pk).exists():
        slug = f"{base}-{n}"
        n += 1
    return slug


def _parent_for(p: Page | None, parent_id: int | None, user) -> Page | None:
    if parent_id is None:
        return None
    parent = visible_to(user).filter(pk=parent_id).select_related("parent").first()
    if parent is None:
        raise WikiError("No such parent page")
    # A page can't sit under itself or one of its own children.
    cur = parent
    while cur is not None:
        if p is not None and cur.pk == p.pk:
            raise WikiError("A page can't be inside itself")
        cur = cur.parent
    return parent


def save(p: Page | None, by, *, title: str, body: str, slug: str | None = None, parent=UNSET, note: str = "",
         states: list[int] | None = None, groups: list[int] | None = None, public: bool | None = None,
         locked: bool | None = None) -> Page:
    """Create or edit a page and record a revision when its text changed. Audience, public and locked are only
    applied when given (the API passes them for managers alone)."""
    title = title.strip()
    if not title:
        raise WikiError("Give it a title")
    body = body.replace("\r\n", "\n").strip()
    if len(body) > MAX_BODY:
        raise WikiError("That page is too long")
    new = p is None
    if new:
        p = Page(created_by=by)
    parent_obj = (None if new else p.parent) if parent is UNSET else _parent_for(p, parent, by)
    changed = new or p.title != title or p.body != body
    with transaction.atomic():
        p.title, p.body, p.parent = title[:200], body, parent_obj
        if slug is not None or new:
            p.slug = unique_slug(slug or "", title, exclude_pk=p.pk)
        if states is not None or groups is not None:
            state_objs = list(State.objects.filter(pk__in=states or []))
            group_objs = list(Group.objects.filter(pk__in=groups or []))
            if len(state_objs) != len(set(states or [])) or len(group_objs) != len(set(groups or [])):
                raise WikiError("Some of those states or groups don't exist")
        if public is not None:
            p.public = public
        if locked is not None:
            p.locked = locked
        if changed:
            p.updated_by = by
        if new:
            p.order = (Page.objects.filter(parent=parent_obj).aggregate(m=Max("order"))["m"] or 0) + 1
        p.save()
        if states is not None or groups is not None:
            p.states.set(state_objs)
            p.groups.set(group_objs)
        if changed:
            number = (p.revisions.aggregate(m=Max("number"))["m"] or 0) + 1
            Revision.objects.create(page=p, number=number, title=p.title, body=p.body, note=note.strip()[:200], author=by)
    _emit("wiki.page_created" if new else "wiki.page_updated", p, by, note)
    return p


def restore(p: Page, number: int, by) -> Page:
    r = p.revisions.filter(number=number).first()
    if r is None:
        raise WikiError("No such revision", 404)
    return save(p, by, title=r.title, body=r.body, note=f"Restored revision {number}")


def delete(p: Page) -> None:
    """Remove the page; its children move up to its parent so nothing is lost."""
    with transaction.atomic():
        p.children.update(parent=p.parent)
        p.delete()


def reorder(user, parent_id: int | None, ids: list[int]) -> None:
    """Put the given siblings in this order (and under this parent)."""
    parent = _parent_for(None, parent_id, user) if parent_id is not None else None
    pages = {p.pk: p for p in visible_to(user).filter(pk__in=ids)}
    if len(pages) != len(set(ids)):
        raise WikiError("Some of those pages don't exist")
    with transaction.atomic():
        for i, pk in enumerate(ids):
            Page.objects.filter(pk=pk).update(parent=parent, order=i + 1, updated_at=timezone.now())


def _emit(event: str, p: Page, by, note: str) -> None:
    from conduit.events import bus

    bus.emit(event, page_id=p.pk, slug=p.slug, title=p.title, note=note.strip()[:200], author=by.display_name if by else None,
             link=f"/p/wiki/{p.slug}")


# --- text and search -------------------------------------------------------------------------------------------------


def plain(md: str) -> str:
    """The body without Markdown marks, for search snippets and webhooks."""
    # Every pattern is bounded, so a body full of brackets can't make matching slow.
    text = re.sub(r"```[^`]{0,20000}```", " ", md)
    text = re.sub(r"!\[[^\]\n]{0,200}\]\([^)\s]{1,2000}\)", " ", text)
    text = re.sub(r"\[\[([^\]|\n]{1,200})(?:\|([^\]\n]{1,200}))?\]\]", lambda m: m.group(2) or m.group(1), text)
    text = re.sub(r"\[([^\]\n]{1,200})\]\([^)\s]{1,2000}\)", r"\1", text)
    text = re.sub(r"[*_`#>|~-]+", " ", text)
    return " ".join(text.split())


def snippet(body: str, q: str, width: int = 120) -> str:
    text = plain(body)
    at = text.lower().find(q.lower())
    if at < 0:
        return text[:width]
    start = max(0, at - width // 3)
    return ("…" if start else "") + text[start:start + width] + ("…" if start + width < len(text) else "")


def search(request, q, limit):
    """Ctrl+K: pages the user can read whose title or text matches, titles first."""
    qs = visible_to(request.user)
    by_title = list(qs.filter(title__icontains=q).order_by("title")[:limit])
    rows = by_title
    if len(rows) < limit:
        rows += list(qs.filter(body__icontains=q).exclude(pk__in=[p.pk for p in by_title]).order_by("-updated_at")[: limit - len(rows)])
    return {
        "key": "wiki",
        "label": "Wiki",
        "hits": [{"id": f"wiki:{p.pk}", "title": p.title, "subtitle": snippet(p.body, q), "icon": "book-open", "url": f"/p/wiki/{p.slug}"}
                 for p in rows],
    }
