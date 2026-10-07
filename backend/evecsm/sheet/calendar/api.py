from django.utils import timezone

from evecsm.sheet.api import router, viewable_character

from .models import CalendarEvent


def _row(e):
    return {
        "id": e.event_id,
        "date": e.date.isoformat(),
        "title": e.title,
        "important": e.importance > 0,
        "response": e.response,
        "duration": e.duration,
        "owner": e.owner_name,
        "owner_type": e.owner_type,
        "text": e.text,
    }


@router.get("/{character_id}/calendar")
def calendar(request, character_id: int):
    qs = CalendarEvent.objects.filter(character=viewable_character(request, character_id))
    now = timezone.now()
    return {
        "upcoming": [_row(e) for e in qs.filter(date__gte=now).order_by("date")[:100]],
        "past": [_row(e) for e in qs.filter(date__lt=now).order_by("-date")[:50]],
    }
