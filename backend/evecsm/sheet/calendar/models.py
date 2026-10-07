from django.db import models


class CalendarEvent(models.Model):
    character = models.ForeignKey("accounts.Character", on_delete=models.CASCADE, related_name="calendar_events")
    event_id = models.BigIntegerField()
    date = models.DateTimeField(db_index=True)
    title = models.CharField(max_length=200)
    importance = models.SmallIntegerField(default=0)
    response = models.CharField(max_length=20, blank=True)
    duration = models.IntegerField(null=True)  # minutes
    owner_name = models.CharField(max_length=200, blank=True)
    owner_type = models.CharField(max_length=20, blank=True)
    text = models.TextField(blank=True)
    detail_fetched = models.BooleanField(default=False)

    class Meta:
        unique_together = [("character", "event_id")]
        ordering = ["date"]
