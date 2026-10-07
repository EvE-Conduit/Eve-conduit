"""Ctrl+K: mentees by name, for mentors (their own mentees and the waiting list) and program managers (everyone)."""

from .models import Mentorship
from .services import can_manage, is_mentor


def find(request, q, limit):
    user = request.user
    if not (is_mentor(user) or can_manage(user)) or len(q.strip()) < 2:
        return None
    from .services import search

    hits = [{"id": f"mentorship:{m.pk}", "title": m.mentee.display_name,
             "subtitle": f"{Mentorship.Status(m.status).label}" + (f" · mentor {m.mentor.display_name}" if m.mentor else ""),
             "icon": "life-buoy", "url": f"/p/mentors/m/{m.pk}"} for m in search(user, q.strip(), limit)]
    return {"key": "mentors", "label": "Mentoring", "hits": hits}
